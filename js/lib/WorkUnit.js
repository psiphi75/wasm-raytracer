class WorkUnit {
  constructor(message, workUnitId) {
    this.message = message;
    this.workUnitId = workUnitId;
    this.replacesWorkId = null;
    this.replacedByWorkId = null;
  }
  toObject() {
    return {
      message: this.message,
      abrupt: { workUnitId: this.workUnitId }
    };
  }
  static fromObject(obj) {
    return new WorkUnit(obj.message, obj.abrupt.workUnitId);
  }
  supersededBy(workUnit) {
    this.replacedByWorkId = workUnit.workUnitId;
    workUnit.replacesWorkId = this.replacesWorkId;
  }
}

if (module.exports) {
  module.exports = WorkUnit;
}
