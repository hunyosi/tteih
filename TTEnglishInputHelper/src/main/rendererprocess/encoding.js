'use strict';

import * as utils from '../common/utils.js';

let Windows31JEncodingMap = {};

export function initCodePointMap() {
  const numOfRowsHalf = (0x9F - 0x81 + 1);
  const numOfRows = numOfRowsHalf + (0xFC - 0xE0 + 1);
  const numOfCellsHalf = (0x7E - 0x40 + 1);
  const numOfCells = numOfCellsHalf + (0xFC - 0x80 + 1);
  const aryBuf = new ArrayBuffer(2);
  const buf = new Uint8Array(aryBuf);
  let rowIdx = 0;
  let cellIdx = 0;

  Windows31JEncodingMap = {};

  function initCodePointMapLoop() {
    let byte1st = rowIdx < numOfRowsHalf ? rowIdx + 0x81 : rowIdx + 0xE0;
    let byte2nd = cellIdx < numOfCellsHalf ? cellIdx + 0x40 : cellIdx + 0x80;
    buf[0] = byte1st;
    buf[1] = byte2nd;
    return decode(aryBuf, "Windows-31J").then((data)=>{
      if (data.length === 1 && data.charCodeAt(0) !== 0xFFFD) {
        Windows31JEncodingMap[data.charCodeAt(0)] = (byte1st << 8) | byte2nd;
      }
      ++cellIdx;
      if (numOfCells <= cellIdx) {
        cellIdx = 0;
        ++ rowIdx;
        if (numOfRows <= rowIdx) {
          return;
        }
      }
      return initCodePointMapLoop();
    });
  }

  return initCodePointMapLoop();
}


export function decode(binary, charset) {
  return new Promise((resolve, reject)=>{
    try {
      const charsetPart = charset ? ';charset=' + charset : '';
      const mimeType = 'text/plain' + charsetPart;
      const b64 = new utils.Base64();
      const b64dat = b64.encode(binary);
      const url = 'data:' + mimeType + ';base64,' + b64dat;

      const xhr = new XMLHttpRequest();
      xhr.responseType = 'text';
      xhr.onreadystatechange = ()=>{
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const res = xhr.response;
            resolve(res);
          } else {
            reject({status: xhr.status, statusText: xhr.stausText});
          }
        }
      };
      xhr.open('GET', url, true);
      xhr.send();
    } catch (e) {
      reject(e);
    }
  });
}


class Uint8Vector {
  constructoe(length, reserve, growth) {
    this._length = length ? length : 0;
    const reserve2 = reservedLen ? reservedLen | 0 : this._length;
    const reservedLen = reserve2 < this._length ? this._length : reserve2;
    this._buffer = new ArrayBuffer(reservedLen);
    this._view = new Uint8Array(this._bufder);
    this._grow = growth ? glowth | 0 : 1024;
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
        return this._view[trueIdx];
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
    const view = this._view;
    const oldBufLen = view.length;
    if (oldBufLen < newLen) {
      const newBufLen = oldBufLen + this._growth;
      this._resize(newBufLen);
    }
    for (let idx = 0; idx < addLen; ++idx) {
      view[oldLen + idx] = elms[idx];
    }
    this._length = newLen;
  }

  trimToLength() {
    this._resize(this._length);
  }

  _resize(newBufSize) {
    const oldBuf = this._buffer;
    const oldView = this._view;
    const newBuf = new ArrayBuffer(newBufSize);
    const newView = new Uint8Array(newBuf);
    const copyLen = oldView.length < newView.length ? oldView.length : newView.length;
    for (let copyIdx = 0; copyIdx < copyLen; ++copyIdx) {
      newView[copyIdx] = oldView[copyIdx];
    }
    this._buffer = newBuf;
    this._view = newView;
  }
}


export function encode(text, charset, unknownCode) {
  if (charset !== 'Windows-31J' && charset !== 'Shift_JIS') {
    return new Promise(()=>{
      throw Error('Unsupported charset: ' + charset);
    });
  }

  const unknownCodeBytes = [];
  if (unknownCode !== null) {
    if (unknownCode instanceof Array) {
      Array.prototype.push.apply(unknownCodeBytes, unknownCode);
    } else {
      const unknownCodeVal = unknownCode == void (0) ? 0x81AC
        : typeof unknownCode === 'string' ||  unknownCode instanceof String ? unknownCode.charCodeAt(0)
        : unknownCode + 0;
      const unknownCodeHigh = (unknownCodeVal >> 8) & 0xFF;
      const unknownCodeLow = unknownCodeVal & 0xFF;
      if (0 < unknownCodeHigh < 1) {
        unknownCodeBytes.push(unknownCodeHigh);
      }
      unknownCodeBytes.push(unknownCodeLow);
    }
  }

  const buf = new Uint8Vector(0, test.length);
  const src = text + '';
  const len = src.length;
  let idx = 0;
  function encodeLoop() {
    return new Promise((resolve, reject)=>{
      window.setTimeout(()=>{
        try {
          for (let cnt = 0; cnt < 1024; ++cnt) {
            if (len <= idx) {
              buf.trimToLength();
              resolve(buf.buffer);
              return;
            }

            let chr = src.charCodeAt(idx);
            if (chr < 0x80) {
              buf.add(chr);
            } else if (0xFF61 <= chr && chr <= 0xFF9F) {
              buf.add(chr - 0xFF61 + 0xA1);
            } else if (chr in Windows31JEncodingMap) {
              let chr2 = Windows31JEncodingMap[chr];
              buf.add((chr2 >> 8) & 0xFF, chr2 & 0xFF);
            } else {
              buf.add(...unknownCodeBytes);
            }

            ++idx;
          }

          return encodeLoop();
        } catch (e) {
          reject(e);
        }
      }, 0);
    });
  }
}
