'use strict';

import * as utils from '../common/utils.js';

export function initCodePointMap() {
  const numOfRowsHalf = (0x9F - 0x81 + 1);
  const numOfRows = numOfRowsHalf + (0xFC - 0xE0 + 1);
  const numOfCellsHalf = (0x7E - 0x40 + 1);
  const numOfCells = numOfCellsHalf + (0xFC - 0x80 + 1);
  const aryBuf = new ArrayBuffer(2);
  const buf = new Uint8Array(aryBuf);
  let rowIdx = 0;
  let cellIdx = 0;

  function initCodePointMapLoop() {
    buf[0] = rowIdx < numOfRowsHalf ? rowIdx + 0x81 : rowIdx + 0xE0;
    buf[1] = cellIdx < numOfCellsHalf ? cellIdx + 0x40 : cellIdx + 0x80;
    return decode(aryBuf, "Windows-31J").then((data)=>{
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
