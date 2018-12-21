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

/**
 * A **very** simple physics implimentation.
 * @constructor
 */
function Physics() {
  this.obj_list = [];
}

Physics.prototype.addObject = function addObject(obj) {
  this.obj_list[this.obj_list.length] = obj;
};

function rotateOnPlane(p, angle) {
  const sinT = Math.sin(angle);
  const cosT = Math.cos(angle);

  const x = p.x;
  const z = p.z;
  p.x = x * cosT - z * sinT;
  p.z = z * cosT + x * sinT;
}

Physics.prototype.applyForces = function applyForces(angle) {
  angle *= Math.PI / 180.0;
  for (let i = 0; i < this.obj_list.length; i += 1) {
    rotateOnPlane(this.obj_list[i].c, angle);
  }
};

module.exports = Physics;
