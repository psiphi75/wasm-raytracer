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

extern crate time;
extern crate wasm_bindgen;

pub mod constants;
pub mod objects;
mod physics;
pub mod raytracer;
pub mod vector;

use crate::constants::{NUM_COLS, SQUARE_SIZE};
use crate::raytracer::RayTracer;

fn main() {
  let mut rt = RayTracer::new(5);
  rt.increment(10.0);
  let mut strip_data = vec![0; NUM_COLS * SQUARE_SIZE];
  rt.render(110, &mut strip_data);
}
