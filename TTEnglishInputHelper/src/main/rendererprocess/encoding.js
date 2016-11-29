'use strict';

import * as utils from '../common/utils.js';
import * as typedvector from '../common/typedvector.js';

const LOOP_TIMES = 16384;

let Windows31JEncodingMap = null;

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
    let byte1st = rowIdx < numOfRowsHalf ? rowIdx + 0x81 : (rowIdx - numOfRowsHalf) + 0xE0;
    let byte2nd = cellIdx < numOfCellsHalf ? cellIdx + 0x40 : (cellIdx - numOfCellsHalf) + 0x80;
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


export function encode(text, charset, unknownCode) {
  const lcCharSet = (charset + '').toLowerCase().trim();
  if (lcCharSet === 'utf-32'
      || lcCharSet === 'utf32'
      || lcCharSet === 'utf-32be'
      || lcCharSet === 'utf32be'
      || lcCharSet === 'iso-10646-ucs-4'
      || lcCharSet === 'ucs-4'
      || lcCharSet === 'ucs4') {
    return encode_UTF_32BE(text);
  } else if (lcCharSet === 'utf-32le' || lcCharSet === 'utf32le') {
    return encode_UTF_32LE(text);
  } else if (lcCharSet === 'utf-16'
      || lcCharSet === 'utf-16be'
      || lcCharSet === 'utf16'
      || lcCharSet === 'utf16be'
      || lcCharSet === 'iso-10646-ucs-2'
      || lcCharSet === 'ucs-2'
      || lcCharSet === 'ucs2') {
    return encode_UTF_16BE(text);
  } else if (lcCharSet === 'utf-16le' || lcCharSet === 'utf16le') {
    return encode_UTF_16LE(text);
  } else if (lcCharSet === 'utf-8' || lcCharSet === 'utf8') {
    return encode_UTF_8(text);
  } else if (lcCharSet === 'windows-31j'
      || lcCharSet === 'shift_jis'
      || lcCharSet === 'sjis'
      || lcCharSet === 'x-sjis'
      || lcCharSet === 'ms932') {
    return encode_Windows_31J(text, unknownCode);
  } else {
    return new Promise(()=>{
      throw Error('Unsupported charset: ' + charset);
    });
  }

}


function encode_UTF_16BE(text) {
  const src = text + '';
  const srcLen = src.length;
  let srcIdx = 0;
  const dst = new typedvector.Uint8Vector(0, srcLen);
  function encodeLoop() {
    return new Promise((resolve, reject)=>{
      window.setTimeout(()=>{
        try {
          for (let loopCnt = 0; loopCnt < LOOP_TIMES; ++ loopCnt) {
            if (srcLen <= srcIdx) {
              dst.trimToLength();
              resolve(dst.buffer);
              return;
            }

            let chr = src.charCodeAt(srcIdx);
            dst.add(chr >> 8, chr & 0xFF);

            ++srcIdx;
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 0);
    }).then((result)=>{
      if (!result) {
        return encodeLoop();
      } else {
        return result;
      }
    });
  }

  return encodeLoop();
}


function encode_UTF_16LE(text) {
  const src = text + '';
  const srcLen = src.length;
  let srcIdx = 0;
  const dst = new typedvector.Uint8Vector(0, srcLen);
  function encodeLoop() {
    return new Promise((resolve, reject)=>{
      window.setTimeout(()=>{
        try {
          for (let loopCnt = 0; loopCnt < LOOP_TIMES; ++ loopCnt) {
            if (srcLen <= srcIdx) {
              dst.trimToLength();
              resolve(dst.buffer);
              return;
            }

            let chr = src.charCodeAt(srcIdx);
            dst.add(chr & 0xFF, chr >> 8);

            ++srcIdx;
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 0);
    }).then((result)=>{
      if (!result) {
        return encodeLoop();
      } else {
        return result;
      }
    });
  }

  return encodeLoop();
}

function surrogatePairToCodePoint(high, low) {
  return (((high & 0x03FF) + 0x40) << 10) | (low & 0x03FF);
}

function encode_UTF_32BE(text) {
  const src = text + '';
  const srcLen = src.length;
  let srcIdx = 0;
  const dst = new typedvector.Uint8Vector(0, srcLen);
  let prevChr = 0;
  function encodeLoop() {
    return new Promise((resolve, reject)=>{
      window.setTimeout(()=>{
        try {
          for (let loopCnt = 0; loopCnt < LOOP_TIMES; ++ loopCnt) {
            if (srcLen <= srcIdx) {
              if (prevChr !== 0) {
                dst.add(0, 0, prevChr >> 8, prevChr & 0xFF);
              }
              dst.trimToLength();
              resolve(dst.buffer);
              return;
            }

            let chr = src.charCodeAt(srcIdx);
            if (chr < 0xD800 || 0xDFFF < chr) {
              dst.add(0, 0, chr >> 8, chr & 0xFF);
              prevChr = 0;
            } else if (chr < 0xDC00) {
              if (prevChr !== 0) {
                dst.add(0, 0, prevChr >> 8, prevChr & 0xFF);
              }
              prevChr = chr;
            } else {
              if (prevChr === 0) {
                dst.add(0, 0, chr >> 8, chr & 0xFF);
              } else {
                let codePoint = surrogatePairToCodePoint(prevChr, chr);
                dst.add(codePoint >> 24, (codePoint >> 16) & 0xFF, (codePoint >> 8) & 0xFF, codePoint & 0xFF);
                prevChr = 0;
              }
            }

            ++srcIdx;
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 0);
    }).then((result)=>{
      if (!result) {
        return encodeLoop();
      } else {
        return result;
      }
    });
  }

  return encodeLoop();
}


function encode_UTF_32LE(text) {
  const src = text + '';
  const srcLen = src.length;
  let srcIdx = 0;
  const dst = new typedvector.Uint8Vector(0, srcLen);
  let prevChr = 0;
  function encodeLoop() {
    return new Promise((resolve, reject)=>{
      window.setTimeout(()=>{
        try {
          for (let loopCnt = 0; loopCnt < LOOP_TIMES; ++ loopCnt) {
            if (srcLen <= srcIdx) {
              if (prevChr !== 0) {
                dst.add(prevChr & 0xFF, prevChr >> 8, 0, 0);
              }
              dst.trimToLength();
              resolve(dst.buffer);
              return;
            }

            let chr = src.charCodeAt(srcIdx);
            if (chr < 0xD800 || 0xDFFF < chr) {
              dst.add(chr & 0xFF, chr >> 8, 0, 0);
              prevChr = 0;
            } else if (chr < 0xDC00) {
              if (prevChr !== 0) {
                dst.add(prevChr & 0xFF, prevChr >> 8, 0, 0);
              }
              prevChr = chr;
            } else {
              if (prevChr === 0) {
                dst.add(chr & 0xFF, chr >> 8, 0, 0);
              } else {
                let codePoint = surrogatePairToCodePoint(prevChr, chr);
                dst.add(codePoint & 0xFF, (codePoint >> 8) & 0xFF, (codePoint >> 16) & 0xFF, codePoint >> 24);
                prevChr = 0;
              }
            }

            ++srcIdx;
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 0);
    }).then((result)=>{
      if (!result) {
        return encodeLoop();
      } else {
        return result;
      }
    });
  }

  return encodeLoop();
}


function addUtf8(dst, codePoint) {
  if (codePoint <= 0x7F) {
    dst.add(codePoint);
  } else if (codePoint <= 0x7FF) {
    dst.add(
      ((codePoint >> 6) & 0x1F) | 0xC0,
      (codePoint & 0x3F) | 0x80
    );
  } else if (codePoint <= 0xFFFF) {
    dst.add(
      ((codePoint >> 12) & 0x0F) | 0xE0,
      ((codePoint >> 6) & 0x3F) | 0x80,
      (codePoint & 0x3F) | 0x80
    );
  } else if (codePoint <= 0x1FFFFF) {
    dst.add(
      ((codePoint >> 18) & 0x07) | 0xF0,
      ((codePoint >> 12) & 0x3F) | 0x80,
      ((codePoint >> 6) & 0x3F) | 0x80,
      (codePoint & 0x3F) | 0x80
    );
  } else if (codePoint <= 0x3FFFFFF) {
    dst.add(
      ((codePoint >> 24) & 0x03) | 0xF8,
      ((codePoint >> 18) & 0x3F) | 0x80,
      ((codePoint >> 12) & 0x3F) | 0x80,
      ((codePoint >> 6) & 0x3F) | 0x80,
      (codePoint & 0x3F) | 0x80
    );
  } else if (codePoint <= 0x7FFFFFFF) {
    dst.add(
      ((codePoint >> 30) & 0x01) | 0xFC,
      ((codePoint >> 24) & 0x3F) | 0x80,
      ((codePoint >> 18) & 0x3F) | 0x80,
      ((codePoint >> 12) & 0x3F) | 0x80,
      ((codePoint >> 6) & 0x3F) | 0x80,
      (codePoint & 0x3F) | 0x80
    );
  } else {
    dst.add(
      0xFE,
      ((codePoint >> 30) & 0x03) | 0x80,
      ((codePoint >> 24) & 0x3F) | 0x80,
      ((codePoint >> 18) & 0x3F) | 0x80,
      ((codePoint >> 12) & 0x3F) | 0x80,
      ((codePoint >> 6) & 0x3F) | 0x80,
      (codePoint & 0x3F) | 0x80
    );
  }
}

function encode_UTF_8(text) {
  const src = text + '';
  const srcLen = src.length;
  let srcIdx = 0;
  const dst = new typedvector.Uint8Vector(0, srcLen);
  let prevChr = 0;

  function encodeLoop() {
    return new Promise((resolve, reject)=>{
      window.setTimeout(()=>{
        try {
          for (let loopCnt = 0; loopCnt < LOOP_TIMES; ++ loopCnt) {
            if (srcLen <= srcIdx) {
              if (prevChr !== 0) {
                addUtf8(dst, prevChr);
              }
              dst.trimToLength();
              resolve(dst.buffer);
              return;
            }

            let chr = src.charCodeAt(srcIdx);
            if (chr < 0xD800 || 0xDFFF < chr) {
              addUtf8(dst, chr);
              prevChr = 0;
            } else if (chr < 0xDC00) {
              if (prevChr !== 0) {
                addUtf8(dst, prevChr);
              }
              prevChr = chr;
            } else {
              if (prevChr === 0) {
                addUtf8(dst, chr);
              } else {
                let codePoint = surrogatePairToCodePoint(prevChr, chr);
                addUtf8(dst, codePoint);
                prevChr = 0;
              }
            }

            ++srcIdx;
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 0);
    }).then((result)=>{
      if (!result) {
        return encodeLoop();
      } else {
        return result;
      }
    });
  }

  return encodeLoop();
}


function encode_Windows_31J(text, unknownCode) {
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

  const src = text + '';
  const srcLen = src.length;
  let srcIdx = 0;
  const dst = new typedvector.Uint8Vector(0, srcLen);
  function encodeLoop() {
    return new Promise((resolve, reject)=>{
      window.setTimeout(()=>{
        try {
          for (let loopCnt = 0; loopCnt < LOOP_TIMES; ++loopCnt) {
            if (srcLen <= srcIdx) {
              dst.trimToLength();
              resolve(dst.buffer);
              return;
            }

            let chr = src.charCodeAt(srcIdx);
            if (chr < 0x80) {
              dst.add(chr);
            } else if (0xFF61 <= chr && chr <= 0xFF9F) {
              dst.add(chr - 0xFF61 + 0xA1);
            } else if (chr in Windows31JEncodingMap) {
              let chr2 = Windows31JEncodingMap[chr];
              dst.add((chr2 >> 8) & 0xFF, chr2 & 0xFF);
            } else {
              dst.add(...unknownCodeBytes);
            }

            ++srcIdx;
          }
          resolve(null);
        } catch (e) {
          reject(e);
        }
      }, 0);
    }).then((result)=>{
      if (!result) {
        return encodeLoop();
      } else {
        return result;
      }
    });
  }

  if (Windows31JEncodingMap === null) {
    return initCodePointMap()
        .then(()=>encodeLoop());
  } else {
    return encodeLoop();
  }
}
