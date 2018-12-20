/* globals Worker */

const WorkUnit = require('./WorkUnit');

Array.prototype.removeItem = function removeItem(expression) {
  const arr = [];
  let idx = 0;
  let item;
  for (; idx < this.length; idx++) {
    const currentItem = this[idx];
    if (!expression(currentItem)) {
      arr.push(currentItem);
    } else {
      item = currentItem;
    }
  }
  for (; idx < this.length; idx++) {
    arr.push(this[idx]);
  }
  return { arr, item };
};

const MAX_WORK_UNIT_QUEUE = 1;

class AbruptWorker {
  constructor(workerUri) {
    this.worker = null;
    this.workerUri = workerUri;
    this.remainingWork = 0;
  }

  loadWorker() {
    this.worker = new Worker(this.workerUri);
    const self = this;
    return new Promise(resolve => {
      self.worker.addEventListener('message', function handleFirstMessage(msg) {
        if (msg.data !== 'started') throw new Error('Invalid start message');
        self.remainingWork = 0;
        self.worker.removeEventListener('message', handleFirstMessage);
        resolve(self);
      });
    });
  }

  addHandler(handleWorkerComplete) {
    this.worker.addEventListener('message', msg => {
      this.workComplete();
      return handleWorkerComplete(msg);
    });
    return this;
  }

  addWork(workUnit) {
    if (this.remainingWork + 1.0 > MAX_WORK_UNIT_QUEUE) {
      throw new Error('Cannot handle more than one unit of work');
    }
    this.worker.postMessage(workUnit.toObject());
    this.remainingWork += 1.0;
    return this;
  }

  workComplete() {
    this.remainingWork -= 1.0;
    return this;
  }

  terminate() {
    this.worker.terminate();
  }
}

class Abrupt {
  constructor({ maxDiffWorkId = Infinity, maxConcurrent = Infinity } = {}) {
    this.inProgress = [];

    this.nextWorkUnitId = 0;
    this.workUnits = [];

    this.nextWorkerId = 0;
    this.workers = undefined;

    this.maxDiffWorkId = maxDiffWorkId;
    this.maxConcurrent = maxConcurrent;

    this.onWorkUnitComplete = () => {};
    this.onNearComplete = () => {};
    this.onAllComplete = () => {};
  }

  setWorkers(webWorkerUris, messageHandler) {
    if (this.workers) {
      throw new Error('Can only set the workers once');
    }
    this.workers = webWorkerUris.map(
      webWorkerUri => new AbruptWorker(webWorkerUri)
    );

    return Promise.all(this.workers.map(worker => worker.loadWorker())).then(
      workers =>
        workers.map(worker =>
          worker.addHandler(msg => {
            const workUnit = WorkUnit.fromObject(msg.data);
            this.handleWorkerComplete(messageHandler, workUnit);
          })
        )
    );
  }

  addWorkUnits(units) {
    if (!(units instanceof Array)) {
      throw new Error('addWorkUnits() expects an array as the parameter');
    }
    this.workUnits.push(
      ...units.map(unit => new WorkUnit(unit, this.nextWorkUnitId++))
    );
    while (this.scheduleWork() !== null);
  }

  getNextWorker() {
    if (this.inProgress.length >= this.maxConcurrent) {
      return null;
    }

    for (let id = 0; id < this.workers.length; id += 1) {
      const worker = this.workers[id];
      if (worker.remainingWork === 0) {
        return worker;
      }
    }

    return null;
  }

  getNextWorkUnit() {
    const workUnit = this.workUnits.shift();
    return workUnit;
  }

  scheduleWork(oldWorkUnit) {
    const worker = this.getNextWorker();
    if (!worker) return null;
    const workUnit = this.getNextWorkUnit();
    if (!workUnit) return null;
    if (oldWorkUnit) oldWorkUnit.supersededBy(workUnit);
    worker.addWork(workUnit);
    this.inProgress.push(workUnit);
    return workUnit.workerId;
  }

  rescheduleOverdueWorkItems() {
    const maxInProgressWorkUnitId = this.inProgress.reduce(
      (acc, workUnit) => Math.max(acc, workUnit.workUnitId),
      0
    );
    return this.inProgress
      .filter(
        workUnit =>
          maxInProgressWorkUnitId - workUnit.workUnitId > this.maxDiffWorkId
      )
      .map(workUnit => {
        workUnit.replacedByWorkId = this.scheduleWork(workUnit);
        return workUnit;
      });
  }

  handleWorkerComplete(messageHandler, completedWorkUnit) {
    const { arr, item: origWorkUnit } = this.inProgress.removeItem(
      wu => wu.workUnitId === completedWorkUnit.workUnitId
    );
    this.inProgress = arr;

    if (!origWorkUnit) {
      console.log('Dropped work unit');
      return;
    }

    // Check if the work unit has been replaced
    if (typeof origWorkUnit.replacedByWorkId === 'number') {
      const replacedByWorkUnit = this.inProgress.find(
        wu => wu.workUnitId === origWorkUnit.replacedByWorkId
      );

      // Cancel the replaced work unit
      if (replacedByWorkUnit) {
        const { arr2 } = this.inProgress.removeItem(
          wu => wu.workUnitId === completedWorkUnit._abrupt.workUnitId
        );
        this.inProgress = arr2;
      }
    }

    this.rescheduleOverdueWorkItems();
    this.scheduleWork();
    messageHandler(null, completedWorkUnit.message);
    if (this.inProgress.length === 0) {
      this.onAllComplete(null, []);
    }
  }

  terminateAll() {
    this.workers.forEach(worker => worker.terminate());
  }
}

if (module.exports) {
  module.exports = Abrupt;
}
