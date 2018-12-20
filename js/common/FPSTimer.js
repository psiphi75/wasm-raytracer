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

/**
 * A simple timer that stores the FPS (Frames Per Second) as a list.
 */
function FPSTimer() {
  let fpsTimes = [];
  const times = [];
  let startTime;
  let pauseStart = 0;
  let counter = 0;

  const now = performance.now.bind(performance);

  return {
    count: () => {
      counter += 1;
    },
    start: () => {
      startTime = now();
    },
    reset: () => {
      fpsTimes = [];
    },
    pause: () => {
      pauseStart = now();
    },
    resume: () => {
      const pausedTime = pauseStart - now();
      startTime -= pausedTime;
    },
    stop: () => {
      if (startTime === undefined) return NaN;
      const stopTime = now();
      times.push(stopTime - startTime);
      const fpsTime = 1000 / (stopTime - startTime);
      startTime = undefined;
      fpsTimes.push(fpsTime);
      return fpsTime;
    },
    getFPSList: () => fpsTimes,
    average: () => {
      if (fpsTimes.length === 0) return 0;
      const sum = fpsTimes.reduce((a, b) => a + b);
      return sum / fpsTimes.length;
    },
    totalTime: () => {
      return times.reduce((a, b) => {
        return a + b;
      });
    },
    getCounter: () => {
      return counter;
    },
  };
}

module.exports = FPSTimer;
