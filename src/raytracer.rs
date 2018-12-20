/*********************************************************************
 *                                                                   *
 *   Copyright 2018 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with self work for additional information           *
 *   regarding copyright ownership.  The ASF licenses self file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use self file except in compliance      *
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

//*********************************************************************/
//**                                                                 **/
//**      Rust    Ray    Tracer                                      **/
//**                                                                 **/
//*********************************************************************/
#![allow(clippy::many_single_char_names)]

use std::f64;
use wasm_bindgen::prelude::*;

use crate::constants::*;
use crate::objects::*;
use crate::vector::Vector;
use crate::vector::Vector as Colour;

struct OriginPixel {
  first_ray: Ray,
}

#[wasm_bindgen] // Public methods, exported to JavaScript.
pub struct RayTracer {
  depth: i32,
  scene: Scene,
  origin_pix: Vec<Vec<OriginPixel>>,
  strip_map: [usize; NUM_STRIPS],
}

#[wasm_bindgen]
impl RayTracer {
  #[wasm_bindgen(constructor)]
  pub fn new(depth: i32) -> Self {
    let mut scene;

    /**************************************/
    /* Create the scene, add our objects. */
    /**************************************/
    {
      // Init the eye and scene
      scene = Scene {
        eye: Eye {
          c: Vector {
            x: 0.0,
            y: 2.0,
            z: -15.0,
          },
          w: 0.75,
          h: 0.75,
          d: 2.0,
        },
        lights: vec![],
        objs: vec![],
      };
      //
      // Add the disc
      //

      let disc_norm = Vector {
        x: 0.0,
        y: 1.0,
        z: 0.0,
      };
      let disc_centre = Vector {
        x: 0.0,
        y: 0.0,
        z: 0.0,
      };
      let mut disc = Object::new_disc(
        disc_centre,
        disc_norm,
        6.0,
        0.7, // Reflectivity -> 0.0 to 1.0
        0.0, // Refractivity
        0.6, // Ambient light
      );
      disc.set_diffuse(0.2);
      disc.can_create_shadow = false;
      disc.can_receive_shadow = true;
      scene.add_object(disc);

      //
      // Add a sphere
      //
      let mut obj = Object::new_sphere(
        Vector::new(0.7, 1.2, 0.4),
        1.0,     // Radius
        COL_RED, // Colour of sphere
        0.9,     // Reflectivity -> 0.0 to 1.0
        0.0,     // Refractivity
        0.2,     // Ambient light
      );
      obj.set_diffuse(0.2);
      obj.can_create_shadow = true;
      obj.can_receive_shadow = false;
      scene.add_object(obj);

      //
      // ... and another sphere
      //
      let mut obj = Object::new_sphere(
        Vector::new(-1.5, 1.6, 0.4),
        0.8,       // Radius
        COL_WHITE, // Colour of sphere
        0.6,       // Reflectivity -> 0.0 to 1.0
        0.0,       // Refractivity
        0.2,       // Ambient light
      );
      obj.set_diffuse(0.7);
      obj.can_create_shadow = true;
      obj.can_receive_shadow = false;
      scene.add_object(obj);

      //
      // ... and another sphere
      //
      let mut obj = Object::new_sphere(
        Vector::new(1.2, 0.8, -1.8),
        0.8,       // Radius
        COL_WHITE, // Colour of sphere
        0.4,       // Reflectivity -> 0.0 to 1.0
        1.12,      // Refractivity
        0.05,      // Ambient light
      );
      obj.set_diffuse(0.0);
      obj.can_create_shadow = true;
      obj.can_receive_shadow = false;
      scene.add_object(obj);

      //
      // Add a light
      //
      scene.add_light(Light {
        c: Vector::new(5.0, 7.5, -2.0),
        col: COL_WHITE,
      });
    }
    /**************************************/
    /*     Do some pre-calculations.      */
    /**************************************/

    let mut origin_pix = vec![];
    let mut strip_map = [0; NUM_STRIPS];

    // Start in the top left
    let x_direction_start = -scene.eye.w / 2.0;
    let y_direction_start = scene.eye.h / 2.0;
    let origin = scene.eye.c;
    let dnx = Vector::new(scene.eye.w / (NUM_COLS as f64 - 1.0), 0.0, 0.0);
    let dny = Vector::new(0.0, scene.eye.h / (NUM_ROWS as f64 - 1.0), 0.0);
    let mut direction = Vector::new(x_direction_start, y_direction_start, scene.eye.d);

    // Prepare the strips
    let mut strip_id = 0;
    for row in 0..NUM_ROWS {
      if row % SQUARE_SIZE == 0 {
        strip_map[strip_id] = row;
        strip_id += 1;
      }

      origin_pix.push(vec![]);
      for _ in 0..NUM_COLS {
        direction.add_in_place(&dnx);
        let dir_norm = direction.normalise();
        origin_pix[row].push(OriginPixel {
          first_ray: Ray {
            origin,
            direction: dir_norm,
            dot_dd: dir_norm.dot(&dir_norm),
          },
        });
      }

      direction.x = x_direction_start;
      direction.sub_in_place(&dny);
    }

    RayTracer {
      depth,
      scene,
      origin_pix,
      strip_map,
    }
  }

  pub fn width(&self) -> u32 {
    NUM_COLS as u32
  }

  pub fn height(&self) -> u32 {
    NUM_ROWS as u32
  }

  pub fn square_size(&self) -> u32 {
    SQUARE_SIZE as u32
  }

  pub fn num_strips(&self) -> u32 {
    NUM_STRIPS as u32
  }

  pub fn increment(&mut self) {
    for obj in &mut self.scene.objs {
      if obj.typ == ObjectType::Sphere {
        crate::physics::Physics::apply_forces(obj);
      }
    }
  }

  /**
   * Render the scene.  self will update the data object that was provided.
   */
  pub fn render(&mut self, strip_id: u32, strip_data: &mut [u8]) {
    // The "main loop"

    let mut col = 0;
    let row = self.strip_map[strip_id as usize];

    let mut static_colour = COL_BACKGROUND;

    // Bounds of the square in pixels
    let row_top = row;
    let row_bot = row + SQUARE_SIZE - 1;
    let mut col_lhs = 0;
    let mut col_rhs = SQUARE_SIZE - 1;

    let mut pxl_tl = COL_BACKGROUND;
    let mut pxl_tr = COL_BACKGROUND;
    let mut pxl_bl = COL_BACKGROUND;
    let mut pxl_br = COL_BACKGROUND;

    // For Each Square
    while col_lhs < NUM_COLS {
      // Top Left
      self.raytrace(
        &mut pxl_tl,
        self.depth,
        &self.origin_pix[row_top][col_lhs].first_ray.clone(),
        OBJECT_ID_NONE,
        1.0,
      );

      // Top Right
      self.raytrace(
        &mut pxl_tr,
        self.depth,
        &self.origin_pix[row_top][col_rhs].first_ray.clone(),
        OBJECT_ID_NONE,
        1.0,
      );

      // Bottom Left
      self.raytrace(
        &mut pxl_bl,
        self.depth,
        &self.origin_pix[row_bot][col_lhs].first_ray.clone(),
        OBJECT_ID_NONE,
        1.0,
      );

      // Bottom Right
      self.raytrace(
        &mut pxl_br,
        self.depth,
        &self.origin_pix[row_bot][col_rhs].first_ray.clone(),
        OBJECT_ID_NONE,
        1.0,
      );

      // Check to see if we can fill the square with black
      let all_elements_are_zero =
        pxl_tl.add(&pxl_tr).add(&pxl_bl).add(&pxl_br).sum_elements() <= 0.0001;

      // Fill the square with colour (or black)
      for r in 0..SQUARE_SIZE {
        for c in 0..SQUARE_SIZE {
          if all_elements_are_zero {
            static_colour = COL_BACKGROUND;
          } else {
            // Don't need to calculate those that have already be calculated
            if r == 0 && c == 0 {
              // Top Left
              static_colour = pxl_tl;
            } else if r == 0 && c == SQUARE_SIZE - 1 {
              // Top Right
              static_colour = pxl_tr;
            } else if r == SQUARE_SIZE - 1 && c == 0 {
              // Bottom Left
              static_colour = pxl_bl;
            } else if r == SQUARE_SIZE - 1 && c == SQUARE_SIZE - 1 {
              // Bottom Right
              static_colour = pxl_br;
            } else {
              self.raytrace(
                &mut static_colour,
                self.depth,
                &self.origin_pix[row + r][col + c].first_ray.clone(),
                OBJECT_ID_NONE,
                1.0,
              );
            }
            static_colour.scale_in_place(255.0);
            static_colour.max_val_in_place(255.0);
          }

          let pnt = (r * NUM_COLS + c + col) * 4;
          strip_data[pnt] = static_colour.x as u8;
          strip_data[pnt + 1] = static_colour.y as u8;
          strip_data[pnt + 2] = static_colour.z as u8;
          strip_data[pnt + 3] = 255u8;
        }
      }

      col_lhs += SQUARE_SIZE;
      col_rhs += SQUARE_SIZE;
      col += SQUARE_SIZE;
    }
  }

  /**
   * Recursive function that returns the shade of a pixel.
   * @param {Object} colour    The colour - self value gets changed in place
   * @param {number} depth     How many iterations left
   * @param {Ray} ray          The ray
   * @param {number} this_obj_id  The ID of the object the ray comes from
   * @param {number} rindex    Refractivity
   */
  fn raytrace(&self, colour: &mut Colour, depth: i32, ray: &Ray, this_obj_id: usize, rindex: f64) {
    if depth == 0 {
      colour.set(&COL_BACKGROUND);
      return;
    }

    let mut closest_obj_id: usize = OBJECT_ID_NONE;
    let mut closest_obj_t = f64::MAX;
    let mut closest_obj_colour = COL_BACKGROUND;
    let mut closest_obj_pi = ORIGIN;

    for (obj_id, obj) in self.scene.objs.iter().enumerate() {
      // Don't intersect object with itself
      if obj_id != this_obj_id {
        let intersection = obj.intersect(&ray);
        if let HasIntersection::Yes { col, t, pi } = intersection {
          if closest_obj_id == OBJECT_ID_NONE || t < closest_obj_t {
            closest_obj_t = t;
            closest_obj_id = obj_id;
            closest_obj_colour = col;
            closest_obj_pi = pi
          }
        }
      }
    }

    if closest_obj_id == OBJECT_ID_NONE {
      colour.set(&COL_BACKGROUND);
    } else {
      colour.set(&closest_obj_colour);
      let closest_obj = &self.scene.objs[closest_obj_id as usize];
      // If we found an object, get the shade for the object.  Otherwise return the background
      self.get_shade_at_point(
        colour,
        depth,
        &ray,
        closest_obj,
        closest_obj_id,
        closest_obj_pi,
        rindex,
      );
    }
  }

  /**
   * Get the shade of the pixel - where the work is done
   * @param colour    The colour - self value gets changed in place
   * @param depth     How many iterations left
   * @param ray       The ray
   * @param obj_id    The ID of the object the ray just hit
   * @param pi        The intersection point
   * @param rindex    Refractivity
   */
  fn get_shade_at_point(
    &self,
    colour: &mut Colour,
    depth: i32,
    ray: &Ray,
    obj: &Object,
    obj_id: usize,
    pi: Vector,
    rindex: f64,
  ) {
    colour.scale_in_place(obj.ambient_light);

    let light = &self.scene.lights[0];

    // handle point light source -
    let mut l = light.c.sub(&pi);
    let shade = self.get_shading(&l, &pi, obj, obj_id);

    // calculate diffuse shading
    l.normalise_in_place();
    let v = ray.direction;
    let norm = obj.get_norm(&pi);
    let dot_ln = l.dot(&norm);
    let dot_vn = ray.direction.dot(&norm);
    if obj.diff > 0.0 && dot_ln > 0.0 {
      let diff = dot_ln * obj.diff * shade;
      // add diffuse component to ray color
      colour.add_in_place(&light.col.product(&obj.col).scale(diff));
    }

    // determine specular component
    if obj.spec > 0.0001 {
      // point light source: sample once for specular highlight

      let mut r = l; // NOTE: don't use L after self;
      r.sub_in_place(&norm.scale(2.0 * dot_ln));
      let dot_vr = v.dot(&r);
      if dot_vr > 0.0001 {
        let spec = dot_vr.powf(20.0) * obj.spec * shade;
        // add specular component to ray color
        colour.add_in_place(&light.col.scale(spec));
      }
    }

    // calculate reflection
    if obj.rfl > 0.0 && depth > 0 {
      let r = ray.direction.sub(&norm.scale(2.0 * dot_vn));
      let new_ray = Ray::new(pi.add(&r.scale(EPSILON)), r);

      let mut rcol = COL_BACKGROUND;
      self.raytrace(&mut rcol, depth - 1, &new_ray, obj_id, 1.0);
      rcol.product_in_place(&obj.col);
      rcol.scale_in_place(obj.rfl);
      colour.add_in_place(&rcol);
    }

    // calculate refraction
    if obj.rfr > 0.0 {
      let n = rindex / obj.rfr;
      let result = if (rindex - 1.0).abs() < EPSILON {
        1.0
      } else {
        -1.0
      };
      let mut r_norm = norm;
      r_norm.scale_in_place(result); // NOTE: Don't use N after self point
      let cos_i = -dot_vn;
      let cos_t2 = 1.0 - n * n * (1.0 - cos_i * cos_i);
      if cos_t2 > 0.0 {
        r_norm.scale_in_place(n * cos_i - cos_t2.sqrt());
        let mut t = ray.direction;
        t = t.scale(n);
        t.add_in_place(&r_norm);
        let refr_ray = Ray::new(pi.add(&t.scale(EPSILON)), t);
        let mut rfr_colour = COL_BACKGROUND;
        self.raytrace(&mut rfr_colour, depth - 1, &refr_ray, obj_id, obj.rfr);
        colour.add_in_place(&rfr_colour);
      }
    }
  }

  fn get_shading(&self, l: &Vector, pi: &Vector, that_obj: &Object, that_obj_id: usize) -> f64 {
    let tdist = l.length();
    let lt = l.scale(1.0 / tdist);
    let r = Ray::new(pi.add(&lt.scale(EPSILON)), lt);
    for (this_obj_id, this_obj) in self.scene.objs.iter().enumerate() {
      // Don't intersect with self...
      // ... and check if an object is in the way of the light source
      if that_obj_id != this_obj_id && that_obj.can_receive_shadow && this_obj.can_create_shadow {
        match this_obj.intersect(&r) {
          HasIntersection::No => {}
          _ => return 0.0,
        }
      }
    }

    1.0
  }
}
