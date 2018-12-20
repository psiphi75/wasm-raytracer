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

/* globals self */

const RayTracer = require('./RayTracer');
const constants = require('../common/Constants');
const WorkUnit = require('../lib/WorkUnit');

const rt = new RayTracer(constants.WIDTH, constants.HEIGHT);
const queue = [];

function next() {
  if (queue.length > 0) {
    const workUnit = queue.shift();
    switch (workUnit.message.type) {
      case 'raytrace':
        raytrace(workUnit);
        break;

      case 'inc':
        increment(workUnit);
        break;

      default:
        console.error('Oops!');
    }
  }
}
function handleNext() {
  setTimeout(next, 0);
}

function raytrace(workUnit) {
  const buffer = rt.render(workUnit.message.stripId);
  workUnit.message.buffer = buffer;
  self.postMessage(workUnit.toObject());
  handleNext();
}

function increment(workUnit) {
  rt.increment();
  workUnit.message = {
    type: 'inc_done',
  };
  self.postMessage(workUnit.toObject());
  handleNext();
}

self.addEventListener('message', e => {
  const workUnit = WorkUnit.fromObject(e.data);
  switch (workUnit.message.type) {
    case 'raytrace':
    case 'inc':
      queue.push(workUnit);
      break;

    default:
      console.error('Unexpected value: ', workUnit.message);
  }
  handleNext();
});

self.postMessage('started');
