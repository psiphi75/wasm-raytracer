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

/* globals document window ImageData */

const constants = require('./common/Constants');
const ManageRayTracing = require('./ManageRayTracing');
const FPSTimer = require('./common/FPSTimer');

// Let the page load.
window.onload = () => {
  function loadRTManager() {
    return ManageRayTracing(
      constants.NUM_WORKERS,
      false,
      numStrips,
      constants.DEPTH,
      images,
      renderCallback,
      document.getElementById('selectRenderMethod').value
    );
  }

  let animationIsPaused = false;
  const timer = FPSTimer();

  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  context.font = '30px Arial';

  context.canvas.height = constants.HEIGHT;
  context.canvas.width = constants.WIDTH;
  const images = [new ImageData(constants.WIDTH, constants.HEIGHT), new ImageData(constants.WIDTH, constants.HEIGHT)];

  // Set the colour to white
  for (let p = 0; p < images[0].data.length; p += 4) {
    images[0].data[p + 3] = 255;
    images[1].data[p + 3] = 255;
  }

  const numStrips = constants.HEIGHT / constants.SQUARE_SIZE;

  let rtMan = loadRTManager();

  timer.start();

  // Attach runPause
  document.getElementById('run_button').addEventListener(
    'click',
    () => {
      animationIsPaused = !animationIsPaused;
      rtMan.pause(animationIsPaused);
      console.log(animationIsPaused ? 'Let us take a break' : 'Go!');
    },
    false
  );

  // Attach runPause
  document.getElementById('selectRenderMethod').addEventListener(
    'change',
    () => {
      timer.stop();
      timer.reset();
      rtMan.cancel();
      rtMan = loadRTManager();
    },
    false
  );

  function renderCallback(imgId) {
    const fps = timer.stop();
    timer.start();

    context.putImageData(images[imgId], 0, 0);

    context.fillStyle = 'white';
    context.fillText(`FPS: ${fps.toFixed(1)}`, 5, 12);
    context.fillText(`avg: ${timer.average().toFixed(2)}`, 5, 22);
  }
};
