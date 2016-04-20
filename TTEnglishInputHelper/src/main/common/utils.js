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

export function escapeJSStr(str) {
  str = str + '';
  var i, z = str.length, c, buf = '';
  for (i = 0; i < z; ++ i) {
    c = str.charCodeAt(i);
    if (c <= 0xFF) {
      if (c == 0x5C) {
        buf += '\\\\';
      } else if (c == 0x21) {
        buf += '\\\"';
      } else if (c == 0x27) {
        buf += '\\\'';
      } else if (c == 0x09) {
        buf += '\\t';
      } else if (c == 0x0A) {
        buf += '\\n';
      } else if (c == 0x0D) {
        buf += '\\r';
      } else if (c == 0x08) {
        buf += '\\b';
      } else if (c == 0x0B) {
        buf += '\\v';
      } else if (c == 0x0C) {
        buf += '\\f';
      } else if (c == 0x00) {
        buf += '\\0';
      } else if (c < 0x20 || (0x7F <= c && c < 0xA0)) {
        var xStr = '0' + c.toString(16);
        buf += '\\x' + xStr.substring(xStr.length - 2);
      } else {
        buf += String.fromCharCode(c);
      }
    } else if (c == 0x2028) {
      buf += '\\u2028';
    } else if (c == 0x2029) {
      buf += '\\u2029';
    } else {
      var uStr = '000' + c.toString(16);
      buf += '\\u' + uStr.substring(uStr.length - 4);
    }
  }
  return buf;
}


export function trim(str) {
  str = str + '';
  return str.replace(/^\s*|\s*$/g, '');
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
    if ('name' in c) {
      return c.name;
    }

    var funcStringMatched = /^\s*function\s+([^\(]+)\(/.exec(c + '');
    if (funcStringMatched) {
      return trim(funcStringMatched[1]);
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
