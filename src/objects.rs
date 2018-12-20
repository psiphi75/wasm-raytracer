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
#![allow(clippy::many_single_char_names)]
use std::f64;

use crate::constants::{COL_SQUARE_1, COL_SQUARE_2, COL_WHITE, ORIGIN};
use crate::vector::Vector;
use crate::vector::Vector as Colour;

pub enum HasIntersection {
  Yes { col: Colour, t: f64, pi: Vector },
  No,
}

#[derive(Clone, PartialEq)]
pub enum ObjectType {
  Sphere,
  Disc,
}

/**
 * Make a sphere.
 */
pub struct Object {
  pub typ: ObjectType,
  pub c: Vector,   // Center position Vector
  pub n: Vector,   // Center position Vector
  pub radius: f64, // Radius
  pub col: Colour, // Colour of sphere
  pub spec: f64,   // the specular amount -> 0.0 to 1.0
  pub diff: f64,
  pub can_create_shadow: bool,
  pub can_receive_shadow: bool,
  pub ambient_light: f64,

  pub rfl: f64, // Reflectivity -> 0.0 to 1.0
  pub rfr: f64, // Refractivity
  pub d: f64,   // like .n above.
  pub rendered: bool,
  pub velocity: Vector,
}

// Intersection with a disc from a ray coming from [px, py, pz] with direction Vector [vx, vy, vz].
fn intersect_disc(
  dist_c: &Vector,
  disc_radius: f64,
  _col: &Colour,
  disc_n: &Vector,
  disc_d: f64,
  ray: &Ray,
) -> HasIntersection {
  let d = disc_n.dot(&ray.direction);
  let t = (disc_d - disc_n.dot(&ray.origin)) / d;
  if t > 0.0 {
    let pi = ray.origin.add(&ray.direction.scale(t)).sub(&dist_c);
    let pi_sub_c = pi.length();
    if pi_sub_c < disc_radius {
      let which_colour =
        ((pi.x + 100.0).abs() as u8 & 255 % 2) ^ ((pi.z + 100.0).abs() as u8 & 255 % 2) != 0;

      HasIntersection::Yes {
        col: if which_colour {
          COL_SQUARE_1
        } else {
          COL_SQUARE_2
        },
        t,
        pi,
      }
    } else {
      HasIntersection::No
    }
  } else {
    HasIntersection::No
  }
}

// Sphere intersection
fn intersect_sphere(
  sphere_c: &Vector,
  r: f64,
  col: &Colour,
  _n: &Vector,
  _d: f64,
  ray: &Ray,
) -> HasIntersection {
  // Intersection with a circle from a ray coming from [px, py, pz] direction [vx, vy, vz]

  // Transform to local coordinates
  let local_p1 = ray.origin.sub(sphere_c);

  let a = ray.direction.dot(&ray.direction); // FIXME: Could cache this value
  let b = 2.0 * ray.direction.dot(&local_p1);
  let c = local_p1.dot(&local_p1) - (r * r);

  // , or ray is in wrong direction (when t < zero)
  if b <= 0.0 || c <= 0.0 {
    let d = b * b - (4.0 * a * c);
    if d >= 0.0 {
      let sqrt_d = d.sqrt();
      if -b - sqrt_d > 0.0 {
        let t = (-b - sqrt_d) / (2.0 * a);
        let pi = ray.origin.add(&ray.direction.scale(t));
        HasIntersection::Yes { col: *col, t, pi }
      } else {
        HasIntersection::No
      }
    } else {
      HasIntersection::No
    }
  } else {
    HasIntersection::No
  }
}

impl Object {
  pub fn new_disc(
    c: Vector,
    n: Vector,
    radius: f64,
    rfl: f64,
    rfr: f64,
    ambient_light: f64,
  ) -> Object {
    Object {
      typ: ObjectType::Disc,
      c,
      n,
      col: COL_WHITE,
      radius,
      rfl,
      rfr,
      can_create_shadow: true,
      can_receive_shadow: true,
      d: c.dot(&n),
      diff: 1.0,
      spec: 0.0,
      rendered: false,
      velocity: Vector::new(0.0, 0.0, 0.0),
      ambient_light,
    }
  }
  pub fn new_sphere(
    c: Vector,
    radius: f64,
    col: Colour,
    rfl: f64,
    rfr: f64,
    ambient_light: f64,
  ) -> Object {
    Object {
      typ: ObjectType::Sphere,
      c,
      n: ORIGIN,
      col,
      radius,
      rfl,
      rfr,
      d: 0.0,
      diff: 1.0,
      spec: 0.0,
      can_create_shadow: true,
      can_receive_shadow: false,
      rendered: false,
      velocity: Vector::new(0.0, 0.0, 0.0),
      ambient_light,
    }
  }

  pub fn intersect(&self, ray: &Ray) -> HasIntersection {
    if let ObjectType::Disc = self.typ {
      intersect_disc(&self.c, self.radius, &self.col, &self.n, self.d, ray)
    } else {
      intersect_sphere(&self.c, self.radius, &self.col, &self.n, self.d, ray)
    }
  }
  pub fn get_norm(&self, p: &Vector) -> Vector {
    if let ObjectType::Disc = self.typ {
      self.n
    } else {
      p.sub(&self.c)
    }
  }

  pub fn set_diffuse(&mut self, diff: f64) {
    self.diff = diff;
    self.spec = 1.0 - diff;
  }
}

// Light class, can have position and colour.
pub struct Light {
  pub c: Vector,
  pub col: Colour,
}

// Make an eye, the observer. There can only be one observer.
pub struct Eye {
  pub c: Vector, // center
  pub w: f64,    // width
  pub h: f64,    // height
  pub d: f64,    // depth
}

// Class to make the scene, can add objects, lights.  Requires an eye for constructor.
pub struct Scene {
  pub eye: Eye,
  pub lights: Vec<Light>, // The list of lights for the scene
  pub objs: Vec<Object>,  // The list of objects in the scene
}

impl Scene {
  pub fn add_light(&mut self, light: Light) {
    self.lights.push(light);
  }
  pub fn add_object(&mut self, obj: Object) {
    self.objs.push(obj);
  }
}

// A ray that gets cast.
#[derive(Clone)]
pub struct Ray {
  pub origin: Vector,
  pub direction: Vector,
  pub dot_dd: f64,
}

impl Ray {
  pub fn new(origin: Vector, direction: Vector) -> Ray {
    Ray {
      origin,
      direction,
      dot_dd: direction.dot(&direction),
    }
  }
}
