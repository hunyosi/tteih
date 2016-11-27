'use strict';

export class Uint8Vector {
  constructor(length, reserve, growth) {
    this._length = length ? length : 0;
    const reserve2 = reserve ? reserve | 0 : 1;
    const reservedLen = reserve2 < this._length ? this._length : reserve2;
    this._buffer = new ArrayBuffer(reservedLen);
    this._view = new Uint8Array(this._buffer);
    this._growth = growth ? glowth | 0 : 1024;
  }

  get length() {
    return this._length;
  }

  get buffer() {
    return this._buffer;
  }

  at(index, val) {
    if (arguments.length === 1 || arguments.length === 2) {
      const trueIdx = index | 0;
      const view = this._view;
      const length = this._length;
      if (trueIdx < 0 || length < trueIdx) {
        throw new Error('Out of bounds: index=' + trueIdx + ', length=' + length);
      }

      if (arguments.length === 2) {
        const oldVal = view[trueIdx];
        view[trueIdx] = val;
        return oldVal;
      } else {
        return view[trueIdx];
      }
    } else {
      throw new Error('Illegal arguments');
    }
  }

  add(...elms) {
    const addLen = elms.length;
    if (addLen < 1) {
      return;
    }

    const oldLen = this._length;
    const newLen = oldLen + addLen;
    if (this._view.length < newLen) {
      const growth = this._growth;
      const bufLen = this._buffer.byteLength;
      const reqGrowth = newLen - bufLen;
      const actualGrowth = (((reqGrowth + growth - 1) / growth) | 0) * growth;
      this._resize(bufLen + actualGrowth);
    }

    const view = this._view;
    for (let idx = 0; idx < addLen; ++idx) {
      view[oldLen + idx] = elms[idx];
    }

    this._length = newLen;
  }

  trimToLength() {
    this._resize(this._length);
  }

  _resize(newBufLen) {
    const oldBuf = this._buffer;
    const oldBufLen = oldBuf.byteLength;
    const oldView = this._view;
    const oldViewLen = oldView.length;
    if (newBufLen === oldBufLen) {
      return;
    }

    const newBuf = new ArrayBuffer(newBufLen);
    const newView = new Uint8Array(newBuf);
    const newViewLen = newView.length;
    const copyLen = oldViewLen < newViewLen ? oldViewLen : newViewLen;
    for (let copyIdx = 0; copyIdx < copyLen; ++copyIdx) {
      newView[copyIdx] = oldView[copyIdx];
    }

    this._buffer = newBuf;
    this._view = newView;
  }
}
