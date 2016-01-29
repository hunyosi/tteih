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

if (typeof (define) === "undefined") {
 window.define = function() {
  var fn = arguments[arguments.length - 1];
  window.tt = fn();
 }
}


define(function (require) {


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
  if (param == null) {
   param = {};
  }
  var ctx = canvas.getContext("2d");
  var max_val = +0;
  var abs_val = +0;
  var i1 = 0|0, z1 = ary.length|0;
  var scalex = z1 - 1;
  var w, h, zeroy;
  var offset = 0;
  if (param.offset != null) {
   offset = param.offset|0;
  }

  if (param.length != null) {
   z1 = param.length|0;
  }

  if (param.scaleY != null) {
   max_val = +param.scaleY;
  } else {
   for (i1 = 0; i1 < z1; ++ i1) {
    abs_val = ary[offset + i1];
    if (abs_val < 0) { abs_val = -abs_val; }
    if (max_val < abs_val) { max_val = abs_val; }
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
  for (i1 = 1; i1 < z1; ++ i1) {
   ctx.lineTo(i1 * w / scalex,
     h - (zeroy + ary[offset + i1] * zeroy / max_val));
  }
  ctx.stroke();
 }

 function drawGraphScaleY(canvas, ary, scaley)
 {
  scaley = +scaley;
  var ctx = canvas.getContext("2d");
  var i1 = 0|0, z1 = ary.length|0;
  var w, h, zeroy;

  w = canvas.width;
  h = canvas.height;
  zeroy = h / 2;
  ctx.beginPath();
  ctx.moveTo(0, h - (zeroy + ary[0] * zeroy / scaley));
  for (i1 = 1; i1 < z1; ++ i1) {
   ctx.lineTo(i1 * w / (z1 - 1),
     h - (zeroy + ary[i1] * zeroy / scaley));
  }
  ctx.stroke();
 }


 function drawGraphScaleXY(canvas, ary, scalex, scaley)
 {
  scalex = +scalex;
  scaley = +scaley;
  var ctx = canvas.getContext("2d");
  var i1 = 0|0, z1 = ary.length|0;
  var w, h, zeroy;

  w = canvas.width;
  h = canvas.height;
  zeroy = h / 2;
  ctx.beginPath();
  ctx.moveTo(0, h - (zeroy + ary[0] * zeroy / scaley));
  for (i1 = 1; i1 < z1; ++ i1) {
   ctx.lineTo(i1 * w / scalex,
     h - (zeroy + ary[i1] * zeroy / scaley));
  }
  ctx.stroke();
 }

 function drawDftGraphScaleXY(canvas, ary, scalex, scaley)
 {
  scalex = +scalex;
  scaley = +scaley;
  var ctx = canvas.getContext("2d");
  var i1 = 0|0, z1 = ary.length|0;
  var w, h, zeroy;
  var x;

  w = canvas.width;
  h = canvas.height;
  zeroy = h / 2;
  ctx.beginPath();
  for (i1 = 0; i1 < z1; ++ i1) {
   x = i1 * w / scalex;
   ctx.moveTo(x, h - zeroy);
   ctx.lineTo(x, h - (zeroy + ary[i1] * zeroy / scaley));
   ctx.stroke();
  }
 }


 function tt(document) {
  var undefined;

  var curPrintElement = null;

  function setCurPrintElement(elm) {
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

 function loadText(path, encoding, callback) {
pp("loadText: 0");
  path = path+"";
  callback = (callback && callback.constructor === Object ?
    callback : {});
  var win = window;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", path, true);
  xhr.overrideMimeType("text/plain;charset=" + encoding);
  xhr.addEventListener("load", function() {
   var text = xhr.responseText;
   if (typeof (callback.success) === "function") {
    win.setTimeout(function(){
     callback.success(text);
    }, 0);
   }
  }, false);
  xhr.addEventListener("error", function(e) {
   if (typeof (callback.error) === "function") {
    win.setTimeout(function(){
     callback.error(xhr);
    }, 0);
   }
  }, false);
  xhr.addEventListener("abort", function(e) {
   if (typeof (callback.abort) === "function") {
    win.setTimeout(function(){
     callback.abort(text);
    }, 0);
   }
  }, false);
  xhr.send();
 }

 function loadFile(path, type, encoding, callback) {
pp("loadFile: path=" + path);
  callback = forceObject(callback);
  var onSuccess = getFunc(callback, "success");
  var onFailure = getFunc(callback, "failure");
  var resType = 0;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", path, true);
  type = (""+type).toLowerCase()
  if (type === "text" || type === "json") {
   encoding = (isEmpty(encoding) ? "UTF-8" : encoding);
   xhr.overrideMimeType("text/plain;charset=" + encoding);
   resType = 0;
  } else if (type === "document") {
   xhr.responseType = "document";
   resType = 1;
  } else if (type === "arraybuffer") {
   xhr.responseType = "ArrayBuffer";
   resType = 2;
  } else if (type === "blob") {
   xhr.responseType = "blob";
   resType = 2;
  }
  xhr.addEventListener("load", function() {
   try{
    var data;
    if (resType === 0) {
     data = xhr.responseText;
    } if (resType === 1) {
     data = xhr.responseXML;
    } else {
     data = xhr.response;
    }
    if (type === "json") {
     if (typeof JSON !== "undefined" && "parse" in JSON) {
      data = JSON.parse(data);
     } else {
      data = eval("(function(){return " + data + ";})()");
     }
    }
    window.setTimeout(function(){ onSuccess(data); }, 0);
   } catch(e) {
    pp("exception="+e);
   }
  }, false);
  xhr.addEventListener("error", function(e) {
   onFailure();
  }, false);
  xhr.send();
 }


 function loadFiles(fileSet, callback) {
pp("loadFiles: 0");
  callback = forceObject(callback);
  var onSuccess = getFunc(callback, "success");
  var onFailure = getFunc(callback, "failure");
  var fileList = createFileList(fileSet);
  var fileListLen = fileList.length;
  var fileListIdx = 0;
  var dataSet = {};
  loadFilesImpl();

  function createFileList(fileSet) {
   var fileInfo;
   var fileList = [];
   var k;
   for (k in fileSet) {
    fileInfo = fileSet[k];
    if (isEmpty(fileInfo["path"]) ||
      isEmpty(fileInfo["type"])) {
     throw "loadFiles: illegal file set.";
    }
    if (fileInfo["type"] === "text" && 
      isEmpty(fileInfo["encoding"])) {
     throw "loadFiles: illegal file set.";
    }
    fileList.push({
     name: k,
     path: fileInfo["path"],
     type: fileInfo["type"],
     encoding: (isEmpty(fileInfo["encoding"]) ? 
       fileInfo["encoding"] : null)
    });
   }
   return fileList;
  }

  function loadFilesImpl() {
   var fileInfo = fileList[fileListIdx];
   var name = fileInfo.name;
   loadFile(fileInfo.path, fileInfo.type, fileInfo.encoding, {
    success: function(data){
     dataSet[name] = data;
     ++ fileListIdx;
     if (fileListIdx < fileListLen) {
      loadFilesImpl();
     } else {
      onSuccess(dataSet);
     }
    },
    failure: function(){
     onFailure();
    }
   });
  }
 }

  function id(idStr) {
   return document.getElementById(idStr);
  }

  function name(nameStr) {
   return document.getElementsByName(nameStr);
  }

  function tag(nameStr) {
   return document.getElementsByTagName(nameStr);
  }

  function query(queryStr) {
   return document.querySelectorAll(queryStr);
  }

  this.id = id;
  this.name = name;
  this.tag = tag;
  this.query = query;

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

  this.loadText = loadText;
  this.loadFile = loadFile;
  this.loadFiles = loadFiles;

 }

 tt.prototype.tt = tt;

 return new tt(document);
});
