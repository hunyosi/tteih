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

module.exports = (function () {

 function damyFunc(){
 }

 function getFunc(obj, name) {
  return (typeof (obj[name]) === "function") ? obj[name] : damyFunc;
 }

 function forceObject(obj) {
  return (obj && obj.constructor === Object) ? obj : {};
 }


 function isEmpty(v) {
  return (typeof (v) === "undefined" || v === null || v === "");
 }


 function escapeJSStr(str) {
  str = str + "";
  return str.replace(/\\/g, "\\\\"
    ).replace(/'/g, "\\'"
    ).replace(/"/g, '\\"'
    ).replace(/\r/g, "\\r"
    ).replace(/\n/g, "\\n");
 }


 function escapeHTML(str) {
  str = str + "";
  return str.replace(/&/g, "&amp;"
    ).replace(/</g, "&lt;"
    ).replace(/>/g, "&gt;"
    ).replace(/"/g, "&quot;");
 }


 function escapeHTMLSpace(str) {
  return escapeHTML(str).replace(/ |\u00A0/g, "&nbsp;");
 }

 function trim(str) {
  str = str + "";
  return str.replace(/^\s*|\s*$/g, "");
 }


 function getType(obj) {
  var c, regExAry;
  if (typeof (obj) === "undefined") {
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

   regExAry = /^\s*function\s+([^\(]+)\(/.exec(c+"");
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


 function getDump(obj) {
  var buf = "";

  function dumpImpl(obj, depth, name) {
   var t = getType(obj);
   var indent = "";
   var i1, z1, f;
   for (i1 = 0; i1 < depth; ++ i1) {
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
   if ( t === "Number"
     || t === "Boolean"
     || t === "Function"
     ) {
    buf += obj;
    return true;
   }
   if (t === "Array") {
    z1 = obj.length;
    buf += "[";
    if (0 < z1) {
     buf += "\n";
     if (! dumpImpl(obj[0], depth + 1, null)) {
      return false;
     }
    }
    for (i1 = 1; i1 < z1; ++ i1) {
     buf += ",\n";
     if (! dumpImpl(obj[i1], depth + 1, null)) {
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
     if (! dumpImpl(obj[i1], depth + 1, i1)) {
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


 function drawGraph(canvas, ary, param) {
 }

 function drawGraphScaleY(canvas, ary, scaley)
 {
 }


 function drawGraphScaleXY(canvas, ary, scalex, scaley)
 {
 }

 function drawDftGraphScaleXY(canvas, ary, scalex, scaley)
 {
 }


 class tt {
   tt()  {
   }

  setCurPrintElement(elm) {
   var oldPrintElement = curPrintElement;
   curPrintElement = elm;
   return oldPrintElement;
  }

  function newCurPrintElement(elm) {
   var oldPrintElement = curPrintElement;
   var body = document.getElementsByTagName("body").item(0);
   div = document.createElement("div");
   body.appendChild(div);
   curPrintElement = div;
   return oldPrintElement;
  }

  function getCurPrintElement() {
   return curPrintElement;
  }

  function printLn(str) {
   str = str + "";
   var div = getCurPrintElement();
   if (div) {
    var line, lines = str.split(/\r\n|\n|\r/);
    var i1, z1;
    for (i1 = 0, z1 = lines.length; i1 < z1; ++ i1) {
     line = lines[i1].replace(/ /g, "\u00A0");
     div.appendChild(document.createTextNode(line));
     div.appendChild(document.createElement("br"));
    }
   }
  }

  function print(str) {
   str = str + "";
   var div = getCurPrintElement();
   if (div) {
    var line, lines = str.split(/\r\n|\n|\r/);
    var i1, z1 = lines.length;
    if (0 < z1) {
     line = lines[0].replace(/ /g, "\u00A0");
     div.appendChild(document.createTextNode(line));
    }
    for (i1 = 1; i1 < z1; ++ i1) {
     line = lines[i1].replace(/ /g, "\u00A0");
     div.appendChild(document.createElement("br"));
     div.appendChild(document.createTextNode(line));
    }
   }
  }

  function putnl() {
   var div = getCurPrintElement();
   if (div) {
    div.appendChild(document.createElement("br"));
   }
  }

  function pp() {
   var i1, z1 = arguments.length, elm;
   var f = true;
   for (i1 = 0; i1 < z1; ++ i1) {
    elm = arguments[i1];
    if (f && getType(elm) === "String") {
     print(elm);
     f = false;
    } else {
     print(getDump(elm));
     f = true;
    }
   }
   putnl();
  }


  function putDump(obj) {
   printLn(getDump(obj));
  }

  function printGraphLn(ary, param) {
   var div = getCurPrintElement();
   var canvas = document.createElement("canvas");
   canvas.width = 1280;
   canvas.height = 100;
   drawGraph(canvas, ary, param);
   div.appendChild(canvas);
   div.appendChild(document.createElement("br"));
  }

  this.pp = pp;
  this.printLn = printLn;
  this.print = print;
  this.putnl = putnl;
  this.getCurPrintElement = getCurPrintElement;
  this.setCurPrintElement = setCurPrintElement;
  this.newCurPrintElement = newCurPrintElement;

  this.trim = trim;

  this.escapeJSStr = escapeJSStr;
  this.escapeHTML = escapeHTML;
  this.escapeHTMLSpace = escapeHTMLSpace;

  this.getType = getType;
  this.getDump = getDump;
  this.putDump = putDump;

  this.drawGraph = drawGraph;
  this.drawGraphScaleY = drawGraphScaleY;
  this.drawGraphScaleXY = drawGraphScaleXY;
  this.drawDftGraphScaleXY = drawDftGraphScaleXY;
  this.printGraphLn = printGraphLn;

  this.isEmpty = isEmpty;
 }

 tt.prototype.tt = tt;

 return new tt(document);
});
