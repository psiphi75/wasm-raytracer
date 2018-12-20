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

use time::PreciseTime;

use crate::constants::*;
use crate::raytracer::RayTracer;

fn main() {
  let start = PreciseTime::now();
  // whatever you want to do
  let mut rt = RayTracer::new(5);
  let mut strip_data = vec![0; NUM_COLS * SQUARE_SIZE];
  const NUM_FRAMES: usize = 20;
  for _ in 0..NUM_FRAMES {
    for i in 0..NUM_STRIPS {
      rt.render(i as u32, &mut strip_data);
    }
  }
  let end = PreciseTime::now();
  let spf = start.to(end).num_milliseconds() as f64 / 1000.0 / (NUM_FRAMES as f64);
  let fps = 1.0 / spf;

  println!(
    "Rendered {} frames in {} seconds on one CPU.  Hence it's running at {} fps",
    NUM_FRAMES,
    start.to(end).num_milliseconds() as f64 / 1000.0,
    fps
  );
}
