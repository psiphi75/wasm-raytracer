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

use crate::constants::EPSILON;

fn min(a: f64, b: f64) -> f64 {
  if a < b {
    a
  } else {
    b
  }
}

#[derive(Clone, Copy)]
pub struct Vector {
  pub x: f64,
  pub y: f64,
  pub z: f64,
}

impl Vector {
  pub fn new(x: f64, y: f64, z: f64) -> Vector {
    Vector { x, y, z }
  }

  // Set the values to the given vector
  pub fn set(&mut self, w: &Vector) {
    self.x = w.x;
    self.y = w.y;
    self.z = w.z;
  }

  // Dot product
  pub fn dot(&self, w: &Vector) -> f64 {
    self.x * w.x + self.y * w.y + self.z * w.z
  }

  // Add two vectors
  pub fn add(&self, w: &Vector) -> Vector {
    Vector {
      x: self.x + w.x,
      y: self.y + w.y,
      z: self.z + w.z,
    }
  }

  // Add two vectors, but don't create a new one
  pub fn add_in_place(&mut self, w: &Vector) {
    self.x += w.x;
    self.y += w.y;
    self.z += w.z;
  }

  // Subtract two vectors
  pub fn sub(&self, w: &Vector) -> Vector {
    Vector {
      x: self.x - w.x,
      y: self.y - w.y,
      z: self.z - w.z,
    }
  }

  // Subtract two vectors, but don't create a new one
  pub fn sub_in_place(&mut self, w: &Vector) {
    self.x -= w.x;
    self.y -= w.y;
    self.z -= w.z;
  }

  // Get the length of a Vector
  pub fn length(&self) -> f64 {
    self.dot(self).sqrt()
  }

  // Normalise a vector
  pub fn normalise(&self) -> Vector {
    let s = 1.0 / self.dot(self).sqrt();
    Vector {
      x: self.x * s,
      y: self.y * s,
      z: self.z * s,
    }
  }

  // normalise a vector in situ
  pub fn normalise_in_place(&mut self) {
    let s = 1.0 / self.dot(self).sqrt();
    self.scale_in_place(s);
  }

  // Scale a vector by f and return the object
  pub fn scale(&self, f: f64) -> Vector {
    Vector {
      x: self.x * f,
      y: self.y * f,
      z: self.z * f,
    }
  }

  // Scale a vector by f, in situ
  pub fn scale_in_place(&mut self, f: f64) {
    self.x *= f;
    self.y *= f;
    self.z *= f;
  }

  // The product of each element
  pub fn product(&self, w: &Vector) -> Vector {
    Vector {
      x: self.x * w.x,
      y: self.y * w.y,
      z: self.z * w.z,
    }
  }

  // The product of each element, in situ
  pub fn product_in_place(&mut self, w: &Vector) {
    self.x *= w.x;
    self.y *= w.y;
    self.z *= w.z;
  }

  // Check if the vectors have the same values
  pub fn equals(&self, w: &Vector) -> bool {
    (self.x - w.x).abs() < EPSILON
      && (self.y - w.y).abs() < EPSILON
      && (self.z - w.z).abs() < EPSILON
  }

  // Sum each element together and return the result
  pub fn sum_elements(&self) -> f64 {
    self.x + self.y + self.z as f64
  }

  // limit the values in place
  pub fn max_val_in_place(&mut self, max: f64) {
    self.x = min(self.x, max);
    self.y = min(self.y, max);
    self.z = min(self.z, max);
  }

  pub fn max_val(&mut self, max: f64) -> Vector {
    Vector {
      x: min(self.x, max),
      y: min(self.y, max),
      z: min(self.z, max),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::constants::EPSILON;
  use crate::vector::Vector;

  fn assert_f64(a: f64, b: f64) {
    let abs_a = a.abs();
    let abs_b = b.abs();
    let diff = (a - b).abs();

    if a == b {
      // Handle infinities.
    } else if a == 0.0 || b == 0.0 || diff < 0.0001 {
      // One of a or b is zero (or both are extremely close to it,) use absolute error.
      assert!(diff < 0.0001);
    } else {
      // Use relative error.
      assert!((diff / f64::min(abs_a + abs_b, std::f64::MAX)) < EPSILON);
    }
  }

  #[test]
  fn vector_values_retained() {
    let v = Vector::new(1.0, 2.0, 3.0);
    assert_f64(v.x, 1.0);
    assert_f64(v.y, 2.0);
    assert_f64(v.z, 3.0);
  }

  #[test]
  fn vector_set() {
    let mut v1 = Vector {
      x: 1.0,
      y: 2.0,
      z: 3.0,
    };
    v1.set(&Vector {
      x: -1.0,
      y: -2.0,
      z: -3.0,
    });
    assert_f64(v1.x, -1.0);
    assert_f64(v1.y, -2.0);
    assert_f64(v1.z, -3.0);
  }

  #[test]
  fn vector_dot() {
    let v1 = Vector {
      x: 1.0,
      y: 2.0,
      z: 3.0,
    };
    let d = v1.dot(&Vector {
      x: -1.0,
      y: -2.0,
      z: -3.0,
    });
    let d_ans: f64 = 1.0 * (-1.0) + 2.0 * (-2.0) + 3.0 * (-3.0);
    assert_f64(d_ans, d);
  }

  #[test]
  fn vector_add() {
    let v1 = Vector {
      x: 1.0,
      y: 2.0,
      z: 3.0,
    };
    let v3 = v1.add(&Vector {
      x: -1.0,
      y: -2.0,
      z: -3.0,
    });
    assert_f64(v3.x, 0.0);
    assert_f64(v3.y, 0.0);
    assert_f64(v3.z, 0.0);
  }

  #[test]
  fn vector_add_in_place() {
    let mut v1 = Vector {
      x: 1.0,
      y: 2.0,
      z: 3.0,
    };
    v1.add_in_place(&Vector {
      x: -1.0,
      y: -2.0,
      z: -3.0,
    });
    assert_f64(v1.x, 0.0);
    assert_f64(v1.y, 0.0);
    assert_f64(v1.z, 0.0);
  }

  #[test]
  fn vector_sub() {
    let v1 = Vector {
      x: 1.0,
      y: 2.0,
      z: 3.0,
    };
    let v3 = v1.sub(&Vector {
      x: -1.0,
      y: -2.0,
      z: -3.0,
    });
    assert_f64(v3.x, 2.0);
    assert_f64(v3.y, 4.0);
    assert_f64(v3.z, 6.0);
  }

  #[test]
  fn vector_sub_in_place() {
    let mut v1 = Vector {
      x: 1.0,
      y: 2.0,
      z: 3.0,
    };
    v1.sub_in_place(&Vector {
      x: -1.0,
      y: -2.0,
      z: -3.0,
    });
    assert_f64(v1.x, 2.0);
    assert_f64(v1.y, 4.0);
    assert_f64(v1.z, 6.0);
  }

  #[test]
  fn vector_length() {
    let v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 0.0,
    };
    assert_f64(5.0, v1.length());
  }

  #[test]
  fn vector_normalise() {
    let v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 0.0,
    };
    let v2 = v1.normalise();
    assert_f64(v2.x, 3.0 / 5.0);
    assert_f64(v2.y, 4.0 / 5.0);
    assert_f64(v2.z, 0.0 / 5.0);
  }

  #[test]
  fn vector_normalise_in_place() {
    let mut v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 0.0,
    };
    v1.normalise_in_place();
    assert_f64(v1.x, 3.0 / 5.0);
    assert_f64(v1.y, 4.0 / 5.0);
    assert_f64(v1.z, 0.0 / 5.0);
  }

  #[test]
  fn vector_scale() {
    let v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 5.0,
    };
    let v2 = v1.scale(-1.1);
    assert_f64(v2.x, -3.3);
    assert_f64(v2.y, -4.4);
    assert_f64(v2.z, -5.5);
  }

  #[test]
  fn vector_scale_in_place() {
    let mut v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 5.0,
    };
    v1.scale_in_place(-1.1);
    assert_f64(v1.x, -3.3);
    assert_f64(v1.y, -4.4);
    assert_f64(v1.z, -5.5);
  }

  #[test]
  fn vector_product() {
    let v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 5.0,
    };
    let v3 = v1.product(&Vector {
      x: -1.1,
      y: -1.1,
      z: -1.1,
    });
    assert_f64(v3.x, -3.3);
    assert_f64(v3.y, -4.4);
    assert_f64(v3.z, -5.5);
  }

  #[test]
  fn vector_product_in_place() {
    let mut v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 5.0,
    };
    v1.product_in_place(&Vector {
      x: -1.1,
      y: -1.1,
      z: -1.1,
    });
    assert_f64(v1.x, -3.3);
    assert_f64(v1.y, -4.4);
    assert_f64(v1.z, -5.5);
  }

  #[test]
  fn vector_equals() {
    let v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 5.0,
    };
    let mut v2 = Vector {
      x: 3.0,
      y: 4.0,
      z: 5.0,
    };
    assert_eq!(true, v1.equals(&v2));
    v2.x = -0.123;
    assert_eq!(false, v1.equals(&v2));
  }

  #[test]
  fn vector_sum_elements() {
    let v1 = Vector {
      x: 3.1,
      y: 4.0,
      z: 5.1,
    };
    assert_f64(12.2, v1.sum_elements());
  }

  #[test]
  fn vector_max_val_in_place() {
    let mut v1 = Vector {
      x: 3.0,
      y: 4.0,
      z: 5.0,
    };
    v1.max_val_in_place(4.5);
    assert_f64(v1.x, 3.0);
    assert_f64(v1.y, 4.0);
    assert_f64(v1.z, 4.5);
  }
}
