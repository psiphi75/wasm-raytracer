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

use crate::vector::Vector as Colour;
use crate::vector::Vector;
use std::usize;

// Used to make sure we are on the near side of point of intersection
pub const EPSILON: f64 = 0.00001;

// How big a grid size to use for checking contents (in pixels)
pub const SQUARE_SIZE: usize = 8;

// No object will have this ID
pub const OBJECT_ID_NONE: usize = usize::MAX;

pub const NUM_ROWS: usize = 696;
pub const NUM_COLS: usize = 696;
pub const NUM_STRIPS: usize = NUM_ROWS / SQUARE_SIZE;

// Named Colours
pub const COL_SILVER: Colour = Colour {
  x: 0.85,
  y: 0.85,
  z: 0.85,
};
pub const COL_BLUE: Colour = Colour {
  x: 0.6,
  y: 1.0,
  z: 1.0,
};
pub const COL_BLACK: Colour = Colour {
  x: 0.0,
  y: 0.0,
  z: 0.0,
};
pub const COL_WHITE: Colour = Colour {
  x: 1.0,
  y: 1.0,
  z: 1.0,
};
pub const COL_RED: Colour = Colour {
  x: 1.0,
  y: 0.0,
  z: 0.0,
};
pub const COL_GREEN: Colour = Colour {
  x: 0.0,
  y: 1.0,
  z: 0.0,
};

// Colours of objects/scene
pub const COL_SQUARE_1: Colour = Colour {
  x: 0.0,
  y: 0.5,
  z: 0.0,
};
pub const COL_SQUARE_2: Colour = Colour {
  x: 0.0,
  y: 0.0,
  z: 0.0,
};
pub const COL_BACKGROUND: Colour = Colour {
  x: 0.0,
  y: 0.0,
  z: 0.0,
};

// Where the ground plane sits
pub const GROUND_PLANE: Vector = Vector {
  x: 0.0,
  y: 0.0,
  z: 0.0,
};

pub const ORIGIN: Vector = Vector {
  x: 0.0,
  y: 0.0,
  z: 0.0,
};
