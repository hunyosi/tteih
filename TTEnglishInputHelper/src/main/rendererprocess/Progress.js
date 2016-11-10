'use strict';

let progressObj;

export class Progress {
  constructor() {
    this._elm = null;
    this.clear();
  }

  static getInstance() {
    if (!progressObj) {
      progressObj = new Progress();
    }
    return progressObj;
  }

  setDomElement(elm) {
    this._elm = elm;
  }

  init(minVal, maxVal, curVal) {
    this._progressMin = minVal;
    this._progressMax = maxVal;
    this.setCur(curVal);
  }

  setCur(curVal) {
    var progress;
    this._progressCur = curVal;
    progress = (this._progressCur - this._progressMin) / (this._progressMax - this._progressMin) * 100.0;
    if (100.0 < progress) {
      progress = 100;
    }
    if (this._elm) {
      this._elm.style.width = progress + "%";
    }
  }

  getCur() {
    return this._progressCur;
  }

  clear() {
    this._progressMin = 0;
    this._progressMax = 0;
    this._progressCur = 0;
    if (this._elm) {
      this._elm.style.width = "0%";
    }
    this.cancelFlag = false;
  }
}
