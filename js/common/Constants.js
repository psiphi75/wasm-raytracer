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

const Vector = require('./Vector');

const constants = {
  NUM_WORKERS: 8,

  // Raytracing Depth
  DEPTH: 5,

  // Used to make sure we are on the near side of point of intersection
  EPSILON: 0.00001,

  // Canvas size - NOTE: Must be a factor of SQUARE_SIZE
  WIDTH: 696,
  HEIGHT: 696,

  // How big a grid size to use for checking contents (in pixels)
  SQUARE_SIZE: 8,

  // Named Colours
  COL_SILVER: new Vector(0.85, 0.85, 0.85),
  COL_BLUE: new Vector(0.6, 1.0, 1.0),
  COL_BLACK: new Vector(0.0, 0.0, 0.0),
  COL_WHITE: new Vector(1.0, 1.0, 1.0),
  COL_RED: new Vector(1.0, 0.0, 0.0),
  COL_GREEN: new Vector(0.0, 1.0, 0.0),

  // Colours of objects/scene
  COL_SQUARE_1: new Vector(0, 0.5, 0),
  COL_SQUARE_2: new Vector(0, 0, 0),
  COL_BACKGROUND: new Vector(0, 0, 0),

  // Where the ground plane sits
  GROUND_PLANE: new Vector(0, 0, 0),
};

if (constants.WIDTH % constants.SQUARE_SIZE) console.error('WIDTH must be a factor of SQUARE_SIZE');
if (constants.HEIGHT % constants.SQUARE_SIZE) console.error('HEIGHT must be a factor of SQUARE_SIZE');

module.exports = constants;
