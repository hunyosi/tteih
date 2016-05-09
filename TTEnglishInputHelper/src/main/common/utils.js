'use strict';
/*
# [COPYING]
#     TTEnglishInputHelper
#     Copyright (C) 2015 ASAKURA, Hunyosi
#
#     This Source Code Form is subject to the terms of
#     the Mozilla Public License, v. 2.0.
#     If a copy of the MPL was not distributed with this file,
#     You can obtain one at http://mozilla.org/MPL/2.0/.
# [/COPYING]
*/

export function isLittleEndian() {
  var u8buf = new Uint8Array(2);
  u8buf[0] = 0xCD;
  u8buf[1] = 0xAB;
  var u16buf = new Uint16Array(u8buf.buffer);
  return (u16buf[0] === 0xABCD);
}


export function arrayBufferToString(aryBuf, header, byteLength, outputAsLittleEndian) {
  var machineByteOrderIsLE = isLittleEndian();
  var dataByteOrderIsLE = machineByteOrderIsLE;

  if (aryBuf.constructor != ArrayBuffer) {
    aryBuf = aryBuf.buffer;
  }

  var bytes = aryBuf.byteLength;
  if (arguments.length >= 3) {
    byteLength = byteLength | 0;
    if (byteLength < 0) {
      throw new Error('byteLength < 0');
    }

    if (byteLength < bytes) {
      bytes = byteLength;
    }

    if (arguments.length >= 4) {
      dataByteOrderIsLE = outputAsLittleEndian;
    }
  }

  var padding = ((bytes % 2) === 1);

  var len = (padding ? bytes - 1 : bytes) / 2;

  var u16Ary = new Uint16Array(aryBuf, 0, len);
  var str;
  if (dataByteOrderIsLE === machineByteOrderIsLE) {
    str = String.fromCharCode.apply(null, u16Ary);
  } else {
    str = '';
    for (var idx = 0; idx < len; ++len) {
      var elm = u16Ary[idx];
      var c = ((elm & 0xFF) << 8) | ((elm >> 8) & 0xFF);
      str += String.fromCharCode.apply(null, c);
    }
  }

  if (padding) {
    var u8Ary = new Uint8Array(aryBuf);
    str += String.fromCharCode(u8Ary[bytes - 1]);
  }

  if (header) {
    var headBuf = (padding ? 0x0101 : 0x0202) |
      (dataByteOrderIsLE ? 0xF000 : 0x00F0);
    var headStr = String.fromCharCode(headBuf);
    return headStr + str;
  } else {
    return str;
  }
}


export function stringToArrayBuffer(str, header, offsetInStr, byteLength, inputAsLittleEndian) {
  var strLen = str.length;
  if (header && strLen < 1) {
    throw new Error('argument error in stringArrayBuffer');
  }

  var offset = 0;
  if (arguments.length >= 3) {
    offsetInStr = offsetInStr | 0;
    if (offsetInStr < 0) {
      throw new Error('offsetInStr < 0');
    }

    offset = offsetInStr;
  }

  var padding = 0;
  var machineByteOrderIsLE = isLittleEndian();
  var dataByteOrderIsLE = machineByteOrderIsLE;
  if (header) {
    var hdr = str.charCodeAt(offset);
    offset += 1;
    padding = hdr & 0x0001;
    dataByteOrderIsLE = (hdr & 0xF000) != 0;
  }

  var words = (strLen - offset) - padding;
  var bytes = (strLen - offset) * 2 - padding;

  if (arguments.length >= 4) {
    byteLength = byteLength | 0;
    if (byteLength < 0) {
      throw new Error('byteLength < 0');
    }

    if (byteLength < bytes) {
      bytes = byteLength;
      padding = byteLength % 2;
      words = (byteLength - padding) / 2;
    }

    if (arguments.length >= 5) {
      dataByteOrderIsLE = inputAsLittleEndian;
    }
  }

  var aryBuf = new ArrayBuffer(bytes);

  var u16Ary = new Uint16Array(aryBuf, 0, words);
  var idx;
  if (dataByteOrderIsLE === machineByteOrderIsLE) {
    for (idx = 0; idx < words; ++idx) {
      u16Ary[idx] = str.charCodeAt(offset + idx);
    }
  } else {
    for (idx = 0; idx < words; ++idx) {
      var c = str.charCodeAt(offset + idx);
      u16Ary[idx] = ((c & 0xFF) << 8) | ((c >> 8) & 0xFF);
    }
  }

  if (padding !== 0) {
    var u8Ary = new Uint8Array(aryBuf);
    u8Ary[bytes - 1] = str.charCodeAt(offset + words) & 0xFF;
  }

  return aryBuf;
}


export function escapeJSStr(str) {
  str = str + '';
  var xStr;
  var i, z = str.length,
    c, buf = '';
  var highSurrogate = null,
    codePoint, cpLow;
  for (i = 0; i < z; ++i) {
    c = str.charCodeAt(i);

    if (highSurrogate !== null) {
      if (0xDC00 <= c && c <= 0xDFFF) {
        codePoint = 0x10000 + (highSurrogate - 0xD800) * 0x400 + (c - 0xDC00);
        cpLow = codePoint & 0xFFFF;
        if (cpLow === 0xFFFE || cpLow === 0xFFFF) {
          xStr = '000' + highSurrogate.toString(16);
          buf += '\\u' + xStr.substring(xStr.length - 4);
          xStr = '000' + c.toString(16);
          buf += '\\u' + xStr.substring(xStr.length - 4);
        } else {
          buf += String.fromCharCode(highSurrogate);
          buf += String.fromCharCode(c);
        }
        continue;
      } else {
        xStr = '000' + highSurrogate.toString(16);
        buf += '\\u' + xStr.substring(xStr.length - 4);
      }
      highSurrogate = null;
    }

    if (c <= 0xFF) {
      if (c === 0x5C) {
        buf += '\\\\';
      } else if (c === 0x21) {
        buf += '\\\"';
      } else if (c === 0x27) {
        buf += '\\\'';
      } else if (c === 0x09) {
        buf += '\\t';
      } else if (c === 0x0A) {
        buf += '\\n';
      } else if (c === 0x0D) {
        buf += '\\r';
      } else if (c === 0x08) {
        buf += '\\b';
      } else if (c === 0x0B) {
        buf += '\\v';
      } else if (c === 0x0C) {
        buf += '\\f';
      } else if (c === 0x00) {
        buf += '\\0';
      } else if (c <= 0x1F || (0x7F <= c && c <= 0x9F)) {
        xStr = '0' + c.toString(16);
        buf += '\\x' + xStr.substring(xStr.length - 2);
      } else {
        buf += String.fromCharCode(c);
      }
    } else if (0xD800 <= c && c <= 0xDBFF) {
      highSurrogate = c;
    } else if (c === 0x2028 || c === 0x2029 || (0xDC00 <= c && c <= 0xDFFF) || (0xFDD0 <= c && c <= 0xFDEF) || c === 0xFFFE || c === 0xFFFF) {
      xStr = '000' + c.toString(16);
      buf += '\\u' + xStr.substring(xStr.length - 4);
    } else {
      buf += String.fromCharCode(c);
    }
  }

  if (highSurrogate !== null) {
    xStr = '000' + highSurrogate.toString(16);
    buf += '\\u' + xStr.substring(xStr.length - 4);
  }

  return buf;
}


export function trim(str) {
  str = str + '';
  return str.replace(/^\s*|\s*$/g, '');
}


export function getName(obj) {
  if ('name' in obj) {
    var name = obj.name;
    if (typeof name === 'string') {
      return name;
    }
  }

  var objStr = obj + '';

  var funcStringMatched = /^\s*function\s+([^\(]+)\(/.exec(objStr);
  if (funcStringMatched) {
    return trim(funcStringMatched[1]);
  }

  var classStringMatched = /^\s*class\s+([^ \t\r\n\{]+)\s*\{/.exec(objStr);
  if (classStringMatched) {
    return trim(classStringMatched[1]);
  }

  return null;
}

export function getType(obj) {
  var typeString = typeof obj;
  if (typeString !== 'object') {
    return typeString;
  }
  if (obj === null) {
    return 'null';
  }
  var c = obj.constructor;
  if (c instanceof Function) {
    var clsName = getName(c);
    if (clsName !== null) {
      return clsName;
    }
  }

  var toStringMatched = /^\s*\[object\s+([^\]]+)\]/.exec(
    Object.prototype.toString.call(obj));
  if (toStringMatched) {
    return trim(toStringMatched[1]);
  }

  return null;
}


export function getDump(obj) {
  var buf = '';

  function dumpImpl(obj, depth, name) {
    var t = getType(obj);
    var indent = '';
    var i1, z1, f;
    for (i1 = 0; i1 < depth; ++i1) {
      indent += ' ';
    }
    buf += indent;
    if (name) {
      buf += '"' + escapeJSStr(name) + '": ';
    }
    if (100 < depth) {
      buf += '/* TOO DEEP */\n';
      return false;
    }

    if (/^[a-z]/.test(t)) {
      if (t === 'undefined' || t === 'null') {
        buf += t;
        return true;
      } else if (t === 'string') {
        buf += '"' + escapeJSStr(obj) + '"';
        return true;
      } else {
        buf += obj;
        return true;
      }
    }

    if (t === 'String') {
      buf += 'String("' + escapeJSStr(obj) + '")';
      return true;
    }
    if (t === 'Number' || t === 'Boolean') {
      buf += t + '(' + obj + ')';
      return true;
    }
    if (t === 'Array') {
      z1 = obj.length;
      buf += '[';
      if (0 < z1) {
        buf += '\n';
        if (!dumpImpl(obj[0], depth + 1, null)) {
          return false;
        }
      }
      for (i1 = 1; i1 < z1; ++i1) {
        buf += ',\n';
        if (!dumpImpl(obj[i1], depth + 1, null)) {
          return false;
        }
      }
      buf += '\n' + indent + ']';
      return true;
    }

    if (t !== 'Object') {
      buf += '/* ' + t + ' */ '
    }
    buf += '{';
    f = false;
    for (i1 in obj) {
      if (i1 !== 'prototype' && i1 !== '__proto__') {
        if (f) {
          buf += ',';
        }
        f = false;
        buf += '\n';
        if (!dumpImpl(obj[i1], depth + 1, i1)) {
          return false;
        }
      }
    }
    buf += '\n' + indent + '}';
    return true;
  }

  dumpImpl(obj, 0, null);
  return buf;
}
