// Todo
// make the movement slower
// better start
// div canvas with responsive styling

/* - - Variables - - */

// adjust size to parent div
let parentDiv = document.getElementById("sketch");
let width = parentDiv.offsetWidth;
let height = parentDiv.offsetHeight;

// masks
let reveals = []; // array to store the images that we will reveal
let masks = []; // array to store the masks for each layer

// blobs
const substeps = 20; // how many points per blob, default: 10
const maxRadius = 0.25; // maximum size of the blobs (relative to canvas size), default: 0.25
const minRadius = 0.1; // minimum size of the blobs, default: 0.1
const vertexDistance = 0.025; // How far apart are the vertices (relative to min canvas length) (smaller number == more cpu work), default: 0.015

let blobs;
let particles;
let distanceJoints;
let hashGrid;
let effectiveVertexDistance;

// blob styling
let blobCount = 3; // total number of blobs
let radius;
let radiusFactor = 0.2; // radius of the blob (relative to canvas size)
let bgColor = 255; // background color
let blobColor = 0; // blob color
let damping = 0.995; // (default: 1)
let friction = 0.001; // (default: 0.1)
let mass = 100; // (default: 1)
let blobDistance = 60; // distance between the blobs (default:6)

// bouncer styling
let bouncerColor = "#000"; // bouncer color
let bouncerSize = 80; // halfe the bouncer size
let bouncerMargin = 100; // margin around the bouncer that still hits the blobs
let bouncerSpeed = 1; // speed of the bouncer, 1 = mouse speed

// mouse bouncer
let mx;
let my;

// margin at screen that the blobs cannot touch
const marginX = 20;
const marginY = 20;

// images
let logoMargin = 50; // margin around the logo
let showBG = true; // show the background image
let bgImg0, bgImg1, bgImg2, bgImg3; // images for each layer

/* - - Preload - - */
function preload() {
  bgImg0 = loadImage("assets/Frame_96.png"); // layer 0 (background image)
  bgImg1 = loadImage("assets/gradual.svg"); // layer 1 (logo)
  bgImg2 = loadImage("assets/Frame_95.png"); // layer 2 (image)
  bgImg3 = loadImage("assets/Frame_97.png"); // layer 3 (image)
}

/* - - Setup - - */
function setup() {
  let canvas = createCanvas(width, height);
  canvas.parent("sketch");

  effectiveVertexDistance = vertexDistance * min(width, height);
  radius = width * radiusFactor;

  // image scaling
  calculateImageScaling(bgImg0);
  calculateImageScaling(bgImg2);
  calculateImageScaling(bgImg3);

  // mouse bouncer
  mx = 0;
  my = 0;

  hashGrid = new HashGrid(
    width,
    height,
    Math.floor(effectiveVertexDistance * 2)
  );
  particles = [];
  distanceJoints = [];
  blobs = [];

  const minLength = min(width, height);
  //let offsetY = 0;
  let totalArea = 0;
  let prevRadius = 0;
  let maxArea = (width - marginX * 2) * (height - marginY * 2) * 0.8;

  // generate our blobs
  for (let i = 0; i < blobCount; i++) {
    const radiusLimit = (maxArea - totalArea) / (PI * 2);

    // starting positions
    xPos = map(i, 0, blobCount - 1, 0, width);
    yPos = map(i, 0, blobCount - 1, height * 0.3, height * 0.7);
    console.log(
      "Starting position no " + i + ". x: " + xPos + "px" + " y: " + yPos + "px"
    );

    // call the blob function
    const blob = generateBlob(
      xPos,
      yPos,
      radius // radius
    );
    totalArea += blob.area;
    blobs.push(blob);
    particles.push(...blob.particles);
    distanceJoints.push(...blob.joints);

    prevRadius = radius;
  }

  // create reveal layers
  for (let i = 0; i < blobCount; i++) {
    reveals.push(createGraphics(width, height));
  }

  // create the masks
  for (let i = 0; i < blobCount; i++) {
    masks.push(createGraphics(width, height));
  }
}

/* - - Draw - - */
function draw() {
  // empty the masks
  for (let i = 0; i < blobCount; i++) {
    masks[i].clear();
  }

  // - - B A C K G R O U N D - - //
  background(bgColor);

  if (showBG) {
    //image(bgImg0, 0, 0, width, height);
    // imageMode(CENTER);
    // image(
    //   bgImg0,
    //   width / 2,
    //   height / 2,
    //   bgImg0.scaledWidth,
    //   bgImg0.scaledHeight
    // );
    // imageMode(CORNER);

    // logo in the background
    let logoHeight = bgImg1.height * (width / bgImg1.width);

    imageMode(CENTER);
    image(
      bgImg1, // image (logo)
      width * 0.5, // x pos
      height - 0.5 * logoHeight - logoMargin, // y pos
      width - logoMargin * 2, // width (minus margin * 2)
      logoHeight // height
    );
    imageMode(CORNER);
  }

  // draw images on our reveal layers
  for (let i = 0; i < blobCount; i++) {
    // layer 1 (logo)
    if (i === 0) {
      // reveals[i].background("#B4FF7F");

      // let logoHeight = bgImg1.height * (width / bgImg1.width);

      // reveals[i].imageMode(CENTER);
      // reveals[i].image(
      //   bgImg1, // image
      //   width * 0.5, // x pos
      //   height - 0.5 * logoHeight - logoMargin, // y pos
      //   width - logoMargin * 2, // width (minus margin * 2)
      //   logoHeight // height
      // );
      // reveals[i].imageMode(CORNER);

      reveals[i].imageMode(CENTER);
      reveals[i].image(
        bgImg0, // image
        width / 2, // x pos
        height / 2, // y pos
        bgImg0.scaledWidth, // width
        bgImg0.scaledHeight // height
      );
      reveals[i].imageMode(CORNER);
    }

    // layer 2 (image)
    else if (i === 1) {
      reveals[i].imageMode(CENTER);
      reveals[i].image(
        bgImg2, // image
        width / 2, // x pos
        height / 2, // y pos
        bgImg2.scaledWidth, // width
        bgImg2.scaledHeight // height
      );
      reveals[i].imageMode(CORNER);
    }

    // layer 3 (image)
    else if (i === 2) {
      reveals[i].imageMode(CENTER);
      reveals[i].image(
        bgImg3, // image
        width / 2, // x pos
        height / 2, // y pos
        bgImg3.scaledWidth, // width
        bgImg3.scaledHeight // height
      );
      reveals[i].imageMode(CORNER);
    }
  }

  // mouse bouncer size & position
  const mr = bouncerSize + bouncerMargin;
  mx = lerp(mx, mouseX, bouncerSpeed);
  my = lerp(my, mouseY, bouncerSpeed);

  const dt = 1 / 60; // 60 fps
  const sdt = dt / substeps;

  for (let i = particles.length; i--; ) {
    const particle = particles[i];
    particle.updateClient();
  }

  for (let substep = substeps; substep--; ) {
    for (let i = blobs.length; i--; ) {
      const blob = blobs[i];
      blob.currentArea = geometry.polygonArea(blob.particles);
      blob.areaDiff = (blob.area - blob.currentArea) / blob.area;
    }

    for (let i = particles.length; i--; ) {
      const particle = particles[i];
      particle.addForce(0, 1000 * sdt, 0);
      const v = geometry.limit(
        { x: particle.vx, y: particle.vy },
        (effectiveVertexDistance / sdt) * 2
      );
      particle.vx = v.x;
      particle.vy = v.y;
      particle.update(sdt);
    }

    for (let i = particles.length; i--; ) {
      const v = particles[i];
      // Area constraint
      const v0 = v.prevSibling;
      const v1 = v.nextSibling;
      const lineNormal = geometry.getLineNormal(v0.x, v0.y, v1.x, v1.y);
      const dir = v.parent.areaDiff;
      v.move(lineNormal.x * dir, lineNormal.y * dir, 0);
    }

    for (let i = distanceJoints.length; i--; ) {
      distanceJoints[i].update(1);
    }

    for (let i = particles.length; i--; ) {
      const particle = particles[i];
      hashGrid
        .query(particle.x, particle.y, particle.radius)
        .forEach((other) => {
          if (
            other === particle ||
            other === particle.nextSibling ||
            other === particle.prevSibling
          )
            return;

          const force = particle.testCollision(other.x, other.y, other.radius);

          if (force) {
            particle.move(force.x * 0.5, force.y * 0.5);
            other.move(-force.x * 0.5, -force.y * 0.5);
          }
        });
    }

    // loop through all particles
    for (let i = particles.length; i--; ) {
      const particle = particles[i];

      // check for collision with mouse bouncer and radius
      particle.collide(mx, my, mr, 9999);

      // keep blobs within the screen
      // particle.constrain(marginX, -99999, width - marginX, height - marginY); // open to the top
      particle.constrain(marginX, marginX, width - marginX, height - marginY); // closed to the top
      particle.endUpdate(sdt);
    }
  }

  // start drawing the blobs on the mask
  for (let i = blobs.length; i--; ) {
    const blob = blobs[i];
    let currentParticle = blob.rootParticle;

    // style the vertex shape
    // mask1.stroke(blob.color);
    // mask1.strokeWeight(effectiveVertexDistance * 2 - blobDistance);
    // mask1.fill(blob.color);

    // go through each blob individually
    let currentMask = masks[i]; // Get the corresponding mask

    // create the vertex
    currentMask.beginShape();
    do {
      currentMask.curveVertex(currentParticle.x, currentParticle.y);
      currentParticle = currentParticle.nextSibling;
    } while (currentParticle !== blob.rootParticle);

    currentMask.curveVertex(currentParticle.x, currentParticle.y);
    currentParticle = currentParticle.nextSibling;
    currentMask.curveVertex(currentParticle.x, currentParticle.y);
    currentParticle = currentParticle.nextSibling;
    currentMask.curveVertex(currentParticle.x, currentParticle.y);
    currentMask.endShape();
  }

  // mouse bouncer (on mask1)
  masks[0].fill(bouncerColor);
  masks[0].noStroke();
  masks[0].ellipse(mx, my, bouncerSize * 2);

  for (let i = 0; i < blobCount; i++) {
    // copy the reveal layers
    let visible = reveals[i].get();

    // apply them to our masks
    visible.mask(masks[i]);

    // draw the masked images
    imageMode(CENTER);
    image(visible, width / 2, height / 2, visible.width, visible.height);
    imageMode(CORNER);
  }
}

/* - - Functions - - */
function generateBlob(offsetX, offsetY, radius) {
  const numPoints = Math.floor((radius * PI * 2) / effectiveVertexDistance);
  const vertices = new Array(numPoints).fill(0).map((_, i, { length }) => {
    const t = i / length;
    const angle = t * TWO_PI;
    const particle = new ChainableParticle({
      x: Math.cos(angle) * radius + offsetX,
      y: Math.sin(angle) * radius + offsetY,
      z: 0,
      damping: damping,
      friction: friction,
      radius: effectiveVertexDistance,
      mass: mass,
    });
    particle.setClient(hashGrid.createClient(particle));
    return particle;
  });

  vertices.forEach((v, i, { length }) => {
    const vprev = vertices[(i + length - 1) % length];
    const vnext = vertices[(i + 1) % length];

    v.setPrevSibling(vprev);
    v.setNextSibling(vnext);

    if (i === 0) {
      v.setIsRoot(true);
    }
  });

  const joints = vertices
    .map((v) => {
      const v2 = v.nextSibling.nextSibling;
      return [
        new DistanceJoint(v, v.nextSibling, effectiveVertexDistance, 0.75),
        new DistanceJoint(v, v2, effectiveVertexDistance * 2, 0.25),
      ];
    })
    .flat();

  const area = geometry.polygonArea(vertices) * random(0.6, 0.9);
  const blob = {
    area,
    currentArea: area,
    areaDiff: 0,
    rootParticle: vertices[0],
    particles: vertices,
    joints,
    radius,

    // assign the color to the blob
    // color: color(random(360), random(30, 100), 100), // random color
    color: blobColor,
  };

  blob.particles.forEach((particle) => {
    particle.parent = blob;
  });

  return blob;
}

// function: rescale image to fill the canvas
function calculateImageScaling(img) {
  const imgAspectRatio = img.width / img.height;
  const canvasAspectRatio = width / height;

  if (imgAspectRatio > canvasAspectRatio) {
    // Image is wider than canvas aspect ratio
    img.scaledHeight = height;
    img.scaledWidth = img.scaledHeight * imgAspectRatio;
  } else {
    // Image is taller than canvas aspect ratio
    img.scaledWidth = width;
    img.scaledHeight = img.scaledWidth / imgAspectRatio;
  }
}

/* - - Resize - - */
function windowResized() {
  // adjust width and height to parent div
  width = parentDiv.offsetWidth;
  height = parentDiv.offsetHeight;

  // canvas
  resizeCanvas(width, height);

  // masks
  for (let i = 0; i < blobCount; i++) {
    reveals[i].resizeCanvas(width, height);
    masks[i].resizeCanvas(width, height);
  }

  // image scaling
  calculateImageScaling(bgImg0);
  calculateImageScaling(bgImg2);
  calculateImageScaling(bgImg3);
}
