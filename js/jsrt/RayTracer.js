/*********************************************************************
 *                                                                   *
 *   Copyright 2018 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

/*********************************************************************/
/**                                                                 **/
/**      Javascript    Ray    Tracer                                **/
/**                                                                 **/
/*********************************************************************/

/*********************************************************************

         Coordinate system used:

         +y

         ^  ^  +z (depth)
         | /
         |/
         +----->  +x

 *********************************************************************/

'use strict';

const Objects = require('./Objects');
const Physics = require('./Physics');
const constants = require('../common/Constants');
const Vector = require('../common/Vector');
const FPSTimer = require('../common/FPSTimer');

//
// Some global constants.
//

const COL_BACKGROUND = constants.COL_BACKGROUND;
const GROUND_PLANE = constants.GROUND_PLANE;
const EPSILON = constants.EPSILON;
const Ray = Objects.Ray;

/**
 * The Ray Tracer.
 *
 * @param {number} cols - Number of columns.
 * @param {number} rows - Number of rows.
 * @class
 */
function RayTracer(cols, rows) {
  this.cols = cols;
  this.rows = rows;
  this.depth = constants.DEPTH;
  this.timers = {
    raytrace: FPSTimer(),
    intersect: FPSTimer(),
    getShadeAtPoint: FPSTimer(),
  };

  /**************************************/
  /* Create the scene, add our objects. */
  /**************************************/

  // set up the Physics
  this.physics = new Physics();

  // Init the eye and scene
  const eye = new Objects.Eye(new Vector(0.0, 2, -15.0), 0.75, 0.75, 2.0);
  this.scene = new Objects.Scene(eye);

  // Add a disc
  const discCenter = new Vector(0.0, 0.0, 0);
  const discNormal = new Vector(0.0, 1.0, 0.0);
  const disc = new Objects.Disc(discCenter, discNormal);
  disc.r = 6;
  disc.rfl = 0.7; // Reflectivity -> 0.0 to 1.0
  disc.rfr = 0; // Refractivity
  disc.ambient_light = 0.6;
  disc.set_diffuse(0.2);
  disc.canCreateShadow = false;
  disc.canReceiveShadow = true;
  this.scene.addObject(disc);

  // Add a sphere
  const sphCenter = new Vector(0.7, 1.2, 0.4);
  const sph = new Objects.Sphere(sphCenter);
  sph.r = 1.0; // Radius
  sph.col = constants.COL_RED; // Colour of sphere
  sph.rfl = 0.9; // Reflectivity -> 0.0 to 1.0
  sph.rfr = 0; // Refractivity
  sph.ambient_light = 0.2;
  sph.set_diffuse(0.2);
  sph.canCreateShadow = true;
  sph.canReceiveShadow = false;
  this.scene.addObject(sph);
  this.physics.addObject(sph);

  // ... and another sphere
  const sph2Center = new Vector(-1.5, 1.6, 0.4);
  const sph2 = new Objects.Sphere(sph2Center);
  sph2.r = 0.8;
  sph2.col = constants.COL_WHITE;
  sph2.rfl = 0.6;
  sph2.rfr = 0; // Refractivity
  sph2.ambient_light = 0.2;
  sph2.set_diffuse(0.7);
  sph2.canCreateShadow = true;
  sph2.canReceiveShadow = false;
  this.scene.addObject(sph2);
  this.physics.addObject(sph2);

  // ... and another sphere
  const sph3Center = new Vector(1.2, 0.8, -1.8);
  const sph3 = new Objects.Sphere(sph3Center);
  sph3.r = 0.8;
  sph3.col = constants.COL_WHITE;
  sph3.rfl = 0.4;
  sph3.rfr = 1.12; // Refractivity
  sph3.ambient_light = 0.05;
  sph3.set_diffuse(0);
  sph3.canCreateShadow = true;
  sph3.canReceiveShadow = false;
  this.scene.addObject(sph3);
  this.physics.addObject(sph3);

  // Add a light
  const lightC = new Vector(5, 7.5, -2.0);
  const lightCol = constants.COL_WHITE;
  const light = new Objects.Light(lightC, lightCol);
  this.scene.addLight(light);

  /**************************************/
  /*     Do some pre-calculations.      */
  /**************************************/

  // Start in the top left
  const xDirectionStart = -this.scene.eye.w / 2.0;
  const yDirectionStart = this.scene.eye.h / 2.0;
  const direction = new Vector(xDirectionStart, yDirectionStart, this.scene.eye.d);
  const origin = this.scene.eye.c;
  const dnx = new Vector(this.scene.eye.w / (this.cols - 1.0), 0, 0);
  const dny = new Vector(0, this.scene.eye.h / (this.rows - 1.0), 0);

  // Prepare the strips
  this.strips = [];
  let strip;
  let pnt = 0;
  for (let row = 0; row < this.rows; row += 1) {
    if (row % constants.SQUARE_SIZE === 0) {
      strip = [];
    }

    for (let col = 0; col < this.cols; col += 1) {
      direction.addInplace(dnx);
      const firstRay = new Ray(origin, direction.normalise());
      strip.push({
        firstRay,
        pnt,
        pixelCol: new Vector(0, 0, 0),
      });
      pnt += 1;
    }

    direction.x = xDirectionStart;
    direction.subInplace(dny);

    if ((row + 1) % constants.SQUARE_SIZE === 0) {
      this.strips.push(strip);
    }
  }

  // Prepare the result strip, this will be copied, it means we don't have
  // do the 255 copy.
  const len = this.cols * constants.SQUARE_SIZE * 4;
  this.preparedStrip = new Uint8ClampedArray(len);
  for (let i = 3; i < len; i += 4) {
    this.preparedStrip[i] = 255;
  }
}

RayTracer.prototype.getNumStrips = function getNumStrips() {
  return this.strips.length;
};
RayTracer.prototype.increment = function increment(angle) {
  this.physics.applyForces(angle);
};

/**
 * Render the scene.  This will update the data object that was provided.
 *
 * @param {number} stripID - The strip number to render.
 * @returns {ArrayBuffer} - The strip.
 */
RayTracer.prototype.render = function render(stripID) {
  const self = this;
  const objs = self.scene.objs;
  const resultGrid = new Uint8ClampedArray(this.preparedStrip);

  // The "main loop"
  raytraceStrip(self.strips[stripID]);
  return resultGrid.buffer;

  function raytraceStrip(strip) {
    let staticColour = COL_BACKGROUND.copy();

    const staticBackground = COL_BACKGROUND.copy();
    staticBackground.scaleInplace(255);
    staticBackground.maxValInplace(255);

    // TopLeft (TL), TopRight (TR), ...
    let sPntTL = 0;
    let sPntTR = constants.SQUARE_SIZE - 1;
    let sPntBL = (constants.SQUARE_SIZE - 1) * self.cols;
    let sPntBR = sPntBL + constants.SQUARE_SIZE - 1;
    let sPntMid = (sPntBR / 2) | 0; // eslint-disable-line no-bitwise

    // For Each Square
    while (sPntTL < self.cols) {
      const pixelColTL = COL_BACKGROUND.copy();
      raytrace(pixelColTL, self.depth, strip[sPntTL].firstRay, -1, 1);
      const pixelColTR = COL_BACKGROUND.copy();
      raytrace(pixelColTR, self.depth, strip[sPntTR].firstRay, -1, 1);
      const pixelColBL = COL_BACKGROUND.copy();
      raytrace(pixelColBL, self.depth, strip[sPntBL].firstRay, -1, 1);
      const pixelColBR = COL_BACKGROUND.copy();
      raytrace(pixelColBR, self.depth, strip[sPntBR].firstRay, -1, 1);
      const pixelColMid = COL_BACKGROUND.copy();
      raytrace(pixelColMid, self.depth, strip[sPntMid].firstRay, -1, 1);

      let sPnt = sPntTL;

      // Check to see if we can fill the square with black
      const pixSum = pixelColTL
        .add(pixelColTR)
        .add(pixelColBL)
        .add(pixelColBR)
        .add(pixelColMid);
      const allElementsAreZero = pixSum.sumElements() === 0;

      // Fill the square with colour (or black)
      for (let r = 0; r < constants.SQUARE_SIZE; r += 1) {
        for (let c = 0; c < constants.SQUARE_SIZE; c += 1) {
          if (allElementsAreZero) {
            staticColour = staticBackground;
          } else {
            // Don't need to calculate those that have already be calculated
            if (sPnt === sPntTL) {
              staticColour = pixelColTL;
            } else if (sPnt === sPntTR) {
              staticColour = pixelColTR;
            } else if (sPnt === sPntBL) {
              staticColour = pixelColBL;
            } else if (sPnt === sPntBR) {
              staticColour = pixelColBR;
            } else {
              raytrace(staticColour, self.depth, strip[sPnt].firstRay, -1, 1);
            }
            staticColour.scaleInplace(255);
            staticColour.maxValInplace(255);
          }

          resultGrid[sPnt * 4] = staticColour.x;
          resultGrid[sPnt * 4 + 1] = staticColour.y;
          resultGrid[sPnt * 4 + 2] = staticColour.z;
          // resultGrid[sPnt * 4 + 3] = 255;
          sPnt += 1;
        }
        sPnt += self.cols - constants.SQUARE_SIZE;
      }

      sPntTL += constants.SQUARE_SIZE;
      sPntTR += constants.SQUARE_SIZE;
      sPntBL += constants.SQUARE_SIZE;
      sPntBR += constants.SQUARE_SIZE;
      sPntMid += constants.SQUARE_SIZE;
    }
  }

  /**
   * Recursive function that returns the shade of a pixel.
   *
   * @param {Object} colour    - The colour - this value gets changed in place.
   * @param {number} depth     - How many iterations left.
   * @param {Ray} ray          - The ray.
   * @param {number} objID  - The ID of the object the ray comes from.
   * @param {number} rindex    - Refractivity.
   */
  function raytrace(colour, depth, ray, objID, rindex) {
    if (depth === 0) {
      colour.set(COL_BACKGROUND);
      return;
    }

    let closestObjId = -1;
    let closestInt;
    const len = objs.length;

    for (let i = 0; i < len; i += 1) {
      // Don't intersect object with itself
      if (i !== objID) {
        const obj = objs[i];

        const intersection = obj.intersect(ray);
        if (intersection !== null) {
          if (closestObjId === -1 || intersection.t < closestInt.t) {
            closestInt = intersection;
            closestObjId = i;
          }
        }
      }
    }

    if (closestObjId === -1) {
      colour.set(COL_BACKGROUND);
    } else {
      colour.set(closestInt.col);
      // If we found an object, get the shade for the object.  Otherwise return the background
      getShadeAtPoint(colour, depth, ray, closestObjId, closestInt.pi, rindex);
    }
  }

  /**
   * Get the shade of the pixel - where the work is done.
   * @param {Object} colour - The colour - this value gets changed in place.
   * @param {number} depth - How many iterations left.
   * @param {Ray} ray -  The ray.
   * @param {number} objID -  The ID of the object the ray just hit.
   * @param {Object} pi - The intersection point.
   * @param {number} rindex - Refractivity.
   */
  function getShadeAtPoint(colour, depth, ray, objID, pi, rindex) {
    const obj = objs[objID];
    colour.scaleInplace(obj.ambient_light);

    const light = self.scene.lights[0];

    // handle point light source -
    const L = light.c.sub(pi);
    const shade = getShading(L, pi, objID);

    // calculate diffuse shading
    L.normaliseInplace();
    const V = ray.direction;
    const N = obj.get_norm(pi);
    const dotLN = L.dot(N);
    const dotVN = ray.direction.dot(N);
    if (obj.diff > 0 && dotLN > 0) {
      const diff = dotLN * obj.diff * shade;
      // add diffuse component to ray color
      colour.addInplace(light.col.product(obj.col).scale(diff));
    }

    // determine specular component
    let R;
    if (obj.spec > 0.0001) {
      // point light source: sample once for specular highlight

      R = L; // NOTE: don't use L after this point
      R.subInplace(N.scale(2 * dotLN));
      const dotVR = V.dot(R);
      if (dotVR > 0.0001) {
        const spec = dotVR ** 20 * obj.spec * shade;
        // add specular component to ray color
        colour.addInplace(light.col.scale(spec));
      }
    }

    // calculate reflection
    if (obj.rfl > 0) {
      R = ray.direction.sub(N.scale(2 * dotVN));
      if (depth > 0) {
        const newRay = new Ray(pi.add(R.scale(EPSILON)), R);

        const rcol = COL_BACKGROUND.copy();
        raytrace(rcol, depth - 1, newRay, objID, 1);
        rcol.productInplace(obj.col);
        rcol.scaleInplace(obj.rfl);
        colour.addInplace(rcol);
      }
    }

    // calculate refraction
    if (obj.rfr > 0) {
      const n = rindex / obj.rfr;
      const result = rindex === 1.0 ? 1 : -1;
      const rN = N;
      rN.scaleInplace(result); // NOTE: Don't use N after this point
      const cosI = -dotVN;
      const cosT2 = 1 - n * n * (1.0 - cosI * cosI);
      if (cosT2 > 0) {
        rN.scaleInplace(n * cosI - Math.sqrt(cosT2));
        let T = ray.direction;
        T = T.scale(n);
        T.addInplace(rN);
        const refrRay = new Ray(pi.add(T.scale(EPSILON)), T);
        const rfrCol = COL_BACKGROUND.copy();
        raytrace(rfrCol, depth - 1, refrRay, objID, obj.rfr);
        colour.addInplace(rfrCol);
      }
    }
  }

  function getShading(L, pi, objID) {
    const tdist = L.length();
    const Lt = L.scale(1 / tdist);
    const r = new Ray(pi.add(Lt.scale(EPSILON)), Lt);
    for (let i = 0; i < objs.length; i += 1) {
      // Don't intersect with self...
      // ... and check if an object is in the way of the light source

      if (objID !== i && objs[objID].canReceiveShadow && objs[i].canCreateShadow && objs[i].intersect(r) !== null) {
        return 0;
      }
    }
    return 1;
  }
};

module.exports = RayTracer;
