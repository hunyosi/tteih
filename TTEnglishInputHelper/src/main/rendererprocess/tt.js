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

function damyFunc() {}

export function getFunc(obj, name) {
  return (typeof(obj[name]) === "function") ? obj[name] : damyFunc;
}

export function forceObject(obj) {
  return (obj && obj.constructor === Object) ? obj : {};
}


export function isEmpty(v) {
  return (typeof(v) === "undefined" || v === null || v === "");
}


export function escapeJSStr(str) {
  str = str + "";
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}


export function escapeHTML(str) {
  str = str + "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}


export function escapeHTMLSpace(str) {
  return escapeHTML(str).replace(/ |\u00A0/g, "&nbsp;");
}

export function trim(str) {
  str = str + "";
  return str.replace(/^\s*|\s*$/g, "");
}


export function getType(obj) {
  var c, regExAry;
  if (typeof(obj) === "undefined") {
    return "undefined";
  }
  if (obj === null) {
    return "null";
  }
  c = obj.constructor;
  if (c instanceof Function) {
    if ("name" in c) {
      return c.name;
    }

    regExAry = /^\s*function\s+([^\(]+)\(/.exec(c + "");
    if (regExAry) {
      return trim(regExAry[1]);
    }
  }

  regExAry = /^\s*\[object\s+([^\]]+)\]/.exec(
    Object.prototype.toString.call(obj));
  if (regExAry) {
    return trim(regExAry[1]);
  }

  return null;
}


export function getDump(obj) {
  var buf = "";

  function dumpImpl(obj, depth, name) {
    var t = getType(obj);
    var indent = "";
    var i1, z1, f;
    for (i1 = 0; i1 < depth; ++i1) {
      indent += " ";
    }
    buf += indent;
    if (name) {
      buf += '"' + escapeJSStr(name) + '": ';
    }
    if (100 < depth) {
      buf += "/* TOO DEEP */\n";
      return false;
    }
    if (t === "undefined" || t === "null") {
      buf += t;
      return true;
    }
    if (t === "String") {
      buf += '"' + escapeJSStr(obj) + '"';
      return true;
    }
    if (t === "Number" || t === "Boolean" || t === "Function") {
      buf += obj;
      return true;
    }
    if (t === "Array") {
      z1 = obj.length;
      buf += "[";
      if (0 < z1) {
        buf += "\n";
        if (!dumpImpl(obj[0], depth + 1, null)) {
          return false;
        }
      }
      for (i1 = 1; i1 < z1; ++i1) {
        buf += ",\n";
        if (!dumpImpl(obj[i1], depth + 1, null)) {
          return false;
        }
      }
      buf += "\n" + indent + "]";
      return true;
    }

    if (t !== "Object") {
      buf += "/* " + t + " */ "
    }
    buf += "{";
    f = false;
    for (i1 in obj) {
      if (i1 !== "prototype" && i1 !== "__proto__") {
        if (f) {
          buf += ",";
        }
        f = false;
        buf += "\n";
        if (!dumpImpl(obj[i1], depth + 1, i1)) {
          return false;
        }
      }
    }
    buf += "\n" + indent + "}";
    return true;
  }

  dumpImpl(obj, 0, null);
  return buf;
}



export function drawGraph(canvas, ary, param) {
  if (param == null) {
    param = {};
  }
  var ctx = canvas.getContext("2d");
  var max_val = +0;
  var abs_val = +0;
  var i1 = 0 | 0,
    z1 = ary.length | 0;
  var scalex = z1 - 1;
  var w, h, zeroy;
  var offset = 0;
  if (param.offset != null) {
    offset = param.offset | 0;
  }

  if (param.length != null) {
    z1 = param.length | 0;
  }

  if (param.scaleY != null) {
    max_val = +param.scaleY;
  } else {
    for (i1 = 0; i1 < z1; ++i1) {
      abs_val = ary[offset + i1];
      if (abs_val < 0) {
        abs_val = -abs_val;
      }
      if (max_val < abs_val) {
        max_val = abs_val;
      }
    }
  }

  if (param.scaleX != null) {
    scalex = +param.scaleX;
  }

  w = canvas.width;
  h = canvas.height;
  zeroy = h / 2;
  ctx.beginPath();
  ctx.moveTo(0, h - (zeroy + ary[offset] * zeroy / max_val));
  for (i1 = 1; i1 < z1; ++i1) {
    ctx.lineTo(i1 * w / scalex,
      h - (zeroy + ary[offset + i1] * zeroy / max_val));
  }
  ctx.stroke();
}

export function drawGraphScaleY(canvas, ary, scaley) {
  scaley = +scaley;
  var ctx = canvas.getContext("2d");
  var i1 = 0 | 0,
    z1 = ary.length | 0;
  var w, h, zeroy;

  w = canvas.width;
  h = canvas.height;
  zeroy = h / 2;
  ctx.beginPath();
  ctx.moveTo(0, h - (zeroy + ary[0] * zeroy / scaley));
  for (i1 = 1; i1 < z1; ++i1) {
    ctx.lineTo(i1 * w / (z1 - 1),
      h - (zeroy + ary[i1] * zeroy / scaley));
  }
  ctx.stroke();
}


export function drawGraphScaleXY(canvas, ary, scalex, scaley) {
  scalex = +scalex;
  scaley = +scaley;
  var ctx = canvas.getContext("2d");
  var i1 = 0 | 0,
    z1 = ary.length | 0;
  var w, h, zeroy;

  w = canvas.width;
  h = canvas.height;
  zeroy = h / 2;
  ctx.beginPath();
  ctx.moveTo(0, h - (zeroy + ary[0] * zeroy / scaley));
  for (i1 = 1; i1 < z1; ++i1) {
    ctx.lineTo(i1 * w / scalex,
      h - (zeroy + ary[i1] * zeroy / scaley));
  }
  ctx.stroke();
}

export function drawDftGraphScaleXY(canvas, ary, scalex, scaley) {
  scalex = +scalex;
  scaley = +scaley;
  var ctx = canvas.getContext("2d");
  var i1 = 0 | 0,
    z1 = ary.length | 0;
  var w, h, zeroy;
  var x;

  w = canvas.width;
  h = canvas.height;
  zeroy = h / 2;
  ctx.beginPath();
  for (i1 = 0; i1 < z1; ++i1) {
    x = i1 * w / scalex;
    ctx.moveTo(x, h - zeroy);
    ctx.lineTo(x, h - (zeroy + ary[i1] * zeroy / scaley));
    ctx.stroke();
  }
}

export class PrintWriter {
  constructor(doc) {
    this._document = doc;
    this._curPrintElement = null;
  }

  setCurPrintElement(elm) {
    var oldPrintElement = this._curPrintElement;
    this._curPrintElement = elm;
    return oldPrintElement;
  }

  newCurPrintElement() {
    var oldPrintElement = this._curPrintElement;
    var body = this._document.getElementsByTagName("body").item(0);
    var div = this._document.createElement("div");
    body.appendChild(div);
    this._curPrintElement = div;
    return oldPrintElement;
  }

  getCurPrintElement() {
    return this._curPrintElement;
  }

  clear() {
    const con = this._curPrintElement;
    if (con) {
      while (con.lastChild) {
        con.removeChild(con.lastChild);
      }
    }
  }

  printLn(str) {
    str = str + "";
    var div = this.getCurPrintElement();
    if (div) {
      var line, lines = str.split(/\r\n|\n|\r/);
      var i1, z1;
      for (i1 = 0, z1 = lines.length; i1 < z1; ++i1) {
        line = lines[i1].replace(/ /g, "\u00A0");
        div.appendChild(document.createTextNode(line));
        div.appendChild(document.createElement("br"));
      }
    }
  }

  print(str) {
    str = str + "";
    var div = this.getCurPrintElement();
    if (div) {
      var line, lines = str.split(/\r\n|\n|\r/);
      var i1, z1 = lines.length;
      if (0 < z1) {
        line = lines[0].replace(/ /g, "\u00A0");
        div.appendChild(this._document.createTextNode(line));
      }
      for (i1 = 1; i1 < z1; ++i1) {
        line = lines[i1].replace(/ /g, "\u00A0");
        div.appendChild(this._document.createElement("br"));
        div.appendChild(this._document.createTextNode(line));
      }
    }
  }

  putnl() {
    var div = this.getCurPrintElement();
    if (div) {
      div.appendChild(this._document.createElement("br"));
    }
  }

  pp() {
    var i1, z1 = arguments.length,
      elm;
    var f = true;
    var buf = '';
    for (i1 = 0; i1 < z1; ++i1) {
      elm = arguments[i1];
      if (f && getType(elm) === "String") {
        buf += elm;
        f = false;
      } else {
        buf += getDump(elm);
        f = true;
      }
    }
    console.log(buf);
    this.print(buf);
    this.putnl();
  }


  putDump(obj) {
    this.printLn(getDump(obj));
  }

  printGraphLn(ary, param) {
    var div = this.getCurPrintElement();
    var canvas = this._document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 100;
    drawGraph(canvas, ary, param);
    div.appendChild(canvas);
    div.appendChild(this._document.createElement("br"));
  }
}

const defaultPrintWriter = new PrintWriter(document);

export function pp(...args) {
  PrintWriter.prototype.pp.apply(defaultPrintWriter, args);
}

export function setCurPrintElement(...args) {
  return PrintWriter.prototype.setCurPrintElement.apply(defaultPrintWriter, args);
}

export function clear(...args) {
  PrintWriter.prototype.clear.apply(defaultPrintWriter, args);
}
