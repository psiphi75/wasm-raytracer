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

use std::f64;

use crate::objects::Object;

// A **very** simple physics implimentation.

#[derive(Clone)]
pub struct Physics {}

impl Physics {
  pub fn apply_forces(obj: &mut Object) {
    let angle = 5.0 / 180.0 * f64::consts::PI;
    let sin_t = f64::sin(angle);
    let cos_t = f64::cos(angle);

    let x = obj.c.x;
    let z = obj.c.z;
    obj.c.x = x * cos_t - z * sin_t;
    obj.c.z = z * cos_t + x * sin_t;
  }
}
