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
  window.tt.xul = fn(window.tt);
 }
}


define(["tt"], function (tt) {


 function loadText(fileName, charset) {
  var data = "";

  var file = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath(fileName);

  var fis = Components.classes["@mozilla.org/network/file-input-stream;1"]
    .createInstance(Components.interfaces.nsIFileInputStream);
  fis.init(file, -1, 0, 0);

  var cis = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
    .createInstance(Components.interfaces.nsIConverterInputStream);
  cis.init(fis, charset, 0, Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

  var readInfo = {};
  while (cis.readString(4096, readInfo) > 0) {
   data += readInfo.value;
  }

  cis.close();
  fis.close();
  return data;
 }


 function saveText(fileName, charset, data) {
  var file = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath(fileName);

  var fos = Components.classes["@mozilla.org/network/file-output-stream;1"]
    .createInstance(Components.interfaces.nsIFileOutputStream);
  fos.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate

  var cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
    .createInstance(Components.interfaces.nsIConverterOutputStream);
  cos.init(fos, charset, 0, 0x0000);

  cos.writeString(data);

  cos.close();
  fos.close();
 }



 function xul () {
 }

 xul.loadText = loadText;
 xul.saveText = saveText;

 return xul;
});
