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

/* globals performance */

const Abrupt = require('./lib/Abrupt.js');
const constants = require('./common/Constants');

function ManageRayTracing(numWorkers, isPaused, numStrips, depth, images, renderCallback, workerUri) {
  let activeImage = 0;
  const abrupt = new Abrupt({ maxDiffWorkId: 30, maxConcurrent: constants.NUM_WORKERS });
  const rotationSpeed = 360 / 10; // Degrees per second

  const createWorkUnitsFn = imgId =>
    [...Array(numStrips).keys()].reverse().map(stripId => ({
      type: 'raytrace',
      stripId,
      imgId,
    }));
  const renderWorkUnits = {
    0: createWorkUnitsFn(0),
    1: createWorkUnitsFn(1),
  };
  const incWorkUnit = {
    type: 'inc',
    angle: 0.0,
  };

  // Load the workers
  const workerUris = [...Array(numWorkers)].map(() => workerUri);
  abrupt.setWorkers(workerUris, handleMessageFromWorker).then(() => {
    next();
  });
  abrupt.onAllComplete = err => {
    if (err) {
      throw new Error('Something wicked happened!');
    }
    next();
  };

  //
  // Functions
  //

  function startRenderWork(imgId) {
    abrupt.addWorkUnits([...Array(numWorkers)].map(() => incWorkUnit));
    abrupt.addWorkUnits(renderWorkUnits[imgId]);
  }

  let startTime = performance.now();
  function next() {
    if (isPaused) return;

    const endTime = performance.now();
    const elapsedTimeSeconds = (endTime - startTime) / 1000;
    startTime = endTime;
    incWorkUnit.angle = rotationSpeed * elapsedTimeSeconds;
    console.log(incWorkUnit.angle);

    startRenderWork(activeImage === 0 ? 1 : 0);
    renderCallback(activeImage);
    activeImage = activeImage === 0 ? 1 : 0;
  }

  function handleMessageFromWorker(err, message) {
    switch (message.type) {
      case 'raytrace':
        handleRenderUpdate(message);
        break;

      case 'inc_done':
        break;

      case 'error':
        console.error('There was an error from the worker.');
        break;

      default:
        console.error(`Unexpected msg type: ${message.type}`);
    }
  }

  function handleRenderUpdate({ stripId, imgId, buffer }) {
    const startPnt = stripId * buffer.byteLength;
    images[imgId].data.set(new Uint8ClampedArray(buffer), startPnt);
  }

  return {
    pause: setPause => {
      if (setPause === isPaused) return;
      isPaused = setPause;

      // Need to resume
      if (!isPaused) {
        startRenderWork(activeImage);
      }
    },
    cancel: () => {
      abrupt.terminateAll();
    },
  };
}

module.exports = ManageRayTracing;
