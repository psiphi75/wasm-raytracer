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

'use strict';

const Vector = require('../common/Vector');
const constants = require('../common/Constants');

const COL_WHITE = constants.COL_WHITE;
const COL_SQUARE_1 = constants.COL_SQUARE_1;
const COL_SQUARE_2 = constants.COL_SQUARE_2;

/**
 * Make a sphere.
 * @param {Object} centerV    - The center point of the Sphere.
 * @class
 */
function Sphere(centerV) {
  this.c = centerV; // Center position Vector
  this.r = 1.0; // Radius
  this.col = COL_WHITE; // Colour of sphere
  this.rfl = 0.7; // Reflectivity -> 0.0 to 1.0
  this.rfr = 0; // Refractivity
  this.ambient_light = 0.3;
  this.spec = 0.0; // the specular amount -> 0.0 to 1.0
  this.diff = 0.0;
  this.d = new Vector(0, 0, 0); // like .n above.
  this.canCreateShadow = true;
  this.canReceiveShadow = true;
  this.type = 'sphere';
}
/**
 * Sphere intersection.
 * @param  {Object} ray
 * @return {Object|null}
 */
Sphere.prototype.intersect = function(ray) {
  // Intersection with a circle from a ray coming from [px, py, pz] direction [vx, vy, vz]

  // Transform to local coordinates
  const LocalP1 = ray.origin.sub(this.c);

  // var A = ray.direction.dot(ray.direction);
  const A = ray.dotDD;
  const B = 2 * ray.direction.dot(LocalP1);
  const C = LocalP1.dot(LocalP1) - this.r * this.r;

  // , or ray is in wrong direction (when t < zero)
  if (B > 0 && C > 0) return null;
  const D = B * B - 4 * A * C;

  if (D < 0.0) {
    // No hit
    return null;
  } else {
    const sqrtD = Math.sqrt(D);
    if (-B - sqrtD > 0) {
      const t = (-B - sqrtD) / (2.0 * A);
      const pi = ray.origin.add(ray.direction.scale(t));
      return {
        col: this.col,
        t,
        pi,
      };
    }
  }

  return null;
};
/**
 * Get the normal at point p.
 * @param {Object} p  - The point to get the normal at.
 * @returns {Object}  The normal Vector.
 */
Sphere.prototype.get_norm = function(p) {
  return p.sub(this.c);
};
/** @param {number} diff */
Sphere.prototype.set_diffuse = function(diff) {
  this.diff = diff;
  this.spec = 1.0 - diff;
};

/**
 * Make a disc. This is just a circle on a plane.
 * @param {Object} center_v  - The center of the disc.
 * @param {Object} norm_v    - The normal of the disc.
 * @class
 */
function Disc(center_v, norm_v) {
  // Plane equation is a*x + b*y + c*z = d.
  this.c = center_v; // center of disc
  this.n = norm_v.normalise(); // normal Vector
  this.r = 1.0; // radius
  this.col = COL_WHITE;
  this.rfl = 0.7; // Reflectivity -> 0.0 to 1.0
  this.rfr = 0; // Refractivity
  this.ambient_light = 0.3;
  this.spec = 0.0; // specular intensity
  this.diff = 0.0; // diffuse intensity
  this.d = this.c.dot(this.n); // solve plane equation for d
  this.canCreateShadow = true;
  this.canReceiveShadow = true;
  this.type = 'disc';
}
/**
 * Intersection with a disc from a ray coming from [px, py, pz] with direction Vector [vx, vy, vz].
 * @param {Object} ray    - The incoming ray.
 * @returns {Object|null}      And array with {col, t}.
 */
Disc.prototype.intersect = function(ray) {
  const d = this.n.dot(ray.direction);
  const t = (this.d - this.n.dot(ray.origin)) / d;
  if (t > 0.0) {
    const pi = ray.origin.add(ray.direction.scale(t)).sub(this.c);
    const pi_sub_c = pi.length();
    if (pi_sub_c < this.r) {
      let col;
      if ((Math.abs(pi.x + 100) & 255 % 2) ^ (Math.abs(pi.z + 100) & 255 % 2)) {
        col = COL_SQUARE_1;
      } else {
        col = COL_SQUARE_2;
      }

      return {
        col,
        t,
        pi,
      };
    }
  }

  // No intersection
  return null;
};
/**
 * Return a copy of the normal Vector for this disc.
 * @returns {Object} The normal Vector.
 */
Disc.prototype.get_norm = function() {
  return this.n.copy();
};
Disc.prototype.set_diffuse = function(diff) {
  this.diff = diff;
  this.spec = 1.0 - diff;
};

/**
 * Light class, can have position and colour.
 *
 * @class
 */
function Light(c, colour) {
  this.c = c;
  this.col = colour;
}

/**
 * Make an eye, the observer. There can only be one observer.
 * @param {Object} center
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @class
 */
function Eye(center, width, height, depth) {
  this.c = center;
  this.w = width;
  this.h = height;
  this.d = depth;
}

/**
 * Class to make the scene, can add objects, lights.  Requires an eye for constructor.
 * @param {Eye} eye    - The observer for the scene.
 * @class
 */
function Scene(eye) {
  this.eye = eye;
  this.lights = []; // The list of lights for the scene
  this.objs = []; // The list of objects in the scene
}
Scene.prototype.addLight = function(light) {
  this.lights.push(light);
};
Scene.prototype.addObject = function(obj) {
  this.objs.push(obj);
  obj.rendered = false; // Has this object been rendered in the last sequence
};

/**
 * A ray that gets cast.
 * @param {Object} origin
 * @param {Object} direction - (must be normalised).
 * @class
 */
function Ray(origin, direction) {
  this.origin = origin;
  this.direction = direction;
  this.dotDD = direction.dot(direction);
}

module.exports = {
  Scene,
  Eye,
  Light,
  Disc,
  Sphere,
  Ray,
};
