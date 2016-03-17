'use strict';

var progressObj;

export default function Progress() {
  this._elm = null;
  this.clear();
}
Progress.getInstance = function() {
  if (!progressObj) {
    progressObj = new Progress();
  }
  return progressObj;
};
Progress.prototype.setDomElement = function(elm) {
  this._elm = elm;
};
Progress.prototype.init = function(minVal, maxVal, curVal) {
  this._progressMin = minVal;
  this._progressMax = maxVal;
  this.setCur(curVal);
};
Progress.prototype.setCur = function(curVal) {
  var progress;
  this._progressCur = curVal;
  progress = (this._progressCur - this._progressMin) / (this._progressMax - this._progressMin) * 100.0;
  if (100.0 < progress) {
    progress = 100;
  }
  if (this._elm) {
    this._elm.style.width = progress + "%";
  }
};
Progress.prototype.getCur = function() {
  return this._progressCur;
};
Progress.prototype.clear = function() {
  this._progressMin = 0;
  this._progressMax = 0;
  this._progressCur = 0;
  if (this._elm) {
    this._elm.style.width = "0%";
  }
  this.cancelFlag = false;
};
