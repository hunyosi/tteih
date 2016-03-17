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
import tt from './tt.js';

 function USTElement(parent) {
  this.parent = parent;
  this.items = {};
  this.setLength(null);
  this.setLyric(null);
  this.setNoteNum(null);
  this.setPreUtterance(null);
 }

 USTElement.prototype.name = null;
 USTElement.prototype.items = null;
 USTElement.prototype.parent = null;
 USTElement.prototype.index = null;
 USTElement.prototype.no = null;
 USTElement.prototype.deleted = false;
 USTElement.prototype.inserted = false;

 USTElement.prototype.after = function(elm){
  var p = this.parent;
  var idx = this.index + 1;
  p.insert(idx, elm);
 };

 USTElement.prototype.before = function(elm){
  var p = this.parent;
  var idx = this.index;
  p.insert(idx, elm);
 };

 USTElement.prototype.has = function(key){
  return key in this.items;
 };

 USTElement.prototype.keys = function(){
  var a = [], k, o = this.items;
  for (k in o) {
   a.push(k);
  }
  return a;
 };

 USTElement.prototype.toString = function(){
  var buf = "";
  var s, k, v;
  buf += "[" + this.name + "]\n";
  s = this.items;
  for (k in s) {
   v = s[k];
   if (tt.isEmpty(v)) {
    v = "";
   }
   buf += k + "=" + v + "\n";
  }
  return buf;
 };

 USTElement.prototype.set = function(k, v){
  var m = "set" + k;
  if (m in this && this[m] instanceof Function) {
   this[m].call(this, v);
   return;
  }
  this.items[k] = v;
  return;
 };

 USTElement.prototype.setLength = function(v){
  if (tt.isEmpty(v)) {
   this.items["Length"] = null;
  } else {
   this.items["Length"] = v|0;
  }
 };

 USTElement.prototype.setLyric = function(v){
  if (tt.isEmpty(v)) {
   this.items["Lyric"] = "";
  } else {
   this.items["Lyric"] = v+"";
  }
 };

 USTElement.prototype.setNoteNum = function(v){
  if (tt.isEmpty(v)) {
   this.items["NoteNum"] = null;
  } else {
   this.items["NoteNum"] = v|0;
  }
 };

 USTElement.prototype.setPreUtterance = function(v){
  if (tt.isEmpty(v)) {
   this.items["PreUtterance"] = null;
  } else {
   this.items["PreUtterance"] = +v;
  }
 };


 function USTDocument() {
  this.enableElms = [];
  this.allElms = [];
  this.nameElmMap = {};
 }


 USTDocument.prototype.path = "";
 USTDocument.prototype.name = "";
 USTDocument.prototype.enableElms = null;
 USTDocument.prototype.allElms = null;
 USTDocument.prototype.nameElmMap = null;
 USTDocument.prototype.lastContentElm = null;


 USTDocument.prototype.renumIndexAndNo = function () {
  var i1, z1;

  z1 = this.enableElms.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   this.enableElms[i1].no = i1 + 1;
  }

  z1 = this.allElms.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   this.allElms[i1].index = i1;
  }
 };


 USTDocument.prototype.findLastContentElm = function () {
  var i1;
  var elm;

  this.lastContentElm = null;
  i1 = this.enableElms.length - 1;
  for (; 0 <= i1; -- i1) {
   elm = this.enableElms[i1];
   if (/^#\d+$|^#INSERT$/.test(elm.name)) {
    this.lastContentElm = elm;
    break;
   }
  }

 };


 USTDocument.prototype.recalc = function () {
  this.renumIndexAndNo();
  this.findLastContentElm();
 }


 USTDocument.prototype.insert = function (index, elm) {
  index = index|0;
  var no;
  if (elm instanceof USTElement) {
   elm.name = "#INSERT";

   if (this.allElms.length <= index) {
    this.append(elm);
    return;
   }

   no = this.allElms[index].no;
   this.enableElms.splice(no - 1, 0, elm);

   this.allElms.splice(index, 0, elm);

   if (! (elm.name in this.nameElmMap)) {
    this.nameElmMap[elm.name] = [];
   }
   this.nameElmMap[elm.name].push(elm);

   this.recalc();

   elm.parent = this;
   elm.deleted = false;
   elm.inserted = true;
  }
 };


 USTDocument.prototype.insertContentEnd = function (elm) {
  if (this.lastContentElm) {
   this.lastContentElm.after(elm);
  } else {
   this.insert(this.allElms.length, elm);
  }
 };


 USTDocument.prototype.append = function (elm) {
  if (elm instanceof USTElement) {
   elm.index = this.allElms.length;
   this.allElms.push(elm);

   this.enableElms.push(elm);
   elm.no = this.enableElms.length;
   this.lastContentElm = elm;

   if (! (elm.name in this.nameElmMap)) {
    this.nameElmMap[elm.name] = [];
   }
   this.nameElmMap[elm.name].push(elm);
  }
 };

 USTDocument.prototype.toString = function(){
  var buf = "";
  var i1, z1, a1;
  a1 = this.enableElms;
  z1 = a1.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   buf += a1[i1].toString();
  }
  return buf;
 };

 USTDocument.parse = function (str) {
  str = str + "";
  var obj = new USTDocument();
  var cnvnl = str.replace(/\u000D\u000A|\u000A|\u000D/g, "\n");
  var nocmnt = cnvnl.replace(/(^|\n)\s*[;#][^\n]*/g, "\n");
  var secs = nocmnt.split(/((?:^|\n)\s*\[[^\]]*\])/);
  var elm, items, elms = [];
  var i1, z1, i2, z2;
  var k, v;
  z1 = secs.length;
  for (i1 = 1; i1 < z1; i1 += 2) {
   elm = obj.createElement();
   elm.name = secs[i1].replace(/^(\s|\[)*|(\]|\s)*$/g, "");
   items = secs[i1 + 1].split(/((?:^|\n)[^=]+=)/);
   z2 = items.length;
   for (i2 = 1; i2 < z2; i2 += 2) {
    k = items[i2].replace(/^\s*|(\=|\s)*$/g, "");
    v = items[i2 + 1].trim();
    elm.set(k, v);
   }
   obj.append(elm);
  }
  return obj;
 };

 USTDocument.prototype.each = function (fn) {
  var i1, z1, ary = [];
  var elms = this.enableElms, elm;
  var res;
  z1 = elms.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   elm = elms[i1];
   if (/^#\d+$/.test(elm.name)) {
    ary.push(elm);
   }
  }
  z1 = ary.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   res = fn.call(ary[i1], ary[i1]);
   if (res === false) {
    return false;
   }
  }
tt.pp("USTDocument.prototype.each: end");
  return true;
 };

 USTDocument.prototype.createElement = function () {
  return new USTElement(this);
 };

export default function ust() {
 }
 ust.prototype = USTDocument;
 ust.USTDocument = USTDocument;
 ust.USTElement = USTElement;
 ust.parse = USTDocument.parse
