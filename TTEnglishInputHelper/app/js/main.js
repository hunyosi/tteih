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

require(["tt"
 , "tt.ust"
 , "tt.xul"
 , "ConvUnknownWord"
],
function(tt
 , ttUst
 , ttXul
 , ConvUnknownWord
){
try {
 tt.pp("start EnglishInputPlugin");

 var progressCancelFlag = false;
 var progressObj;

 function Progress(docElm) {
  this._elm = docElm;
  this.clear();
 }
 Progress.prototype.init = function(minVal, maxVal, curVal){
  this._progressMin = minVal;
  this._progressMax = maxVal;
  this.setCur(curVal);
 }
 Progress.prototype.setCur = function(curVal){
  var progress;
  this._progressCur = curVal;
  progress = (this._progressCur - this._progressMin) / (this._progressMax - this._progressMin) * 100.0;
  if (100.0 < progress) {
   progress = 100;
  } 
  this._elm.style.width = progress + "%";
 }
 Progress.prototype.getCur = function(){ return this._progressCur; }
 Progress.prototype.clear = function(){
  this._progressMin = 0;
  this._progressMax = 0;
  this._progressCur = 0;
  this._elm.style.width = "0%";
 }


 var ustFileName, ust;
 var cfg;
 var pronunciation;

 var convNote;
 var insertTextMode;

 (function(){
  var data;
  var i1, z1, arg, skip = false, args = [];
  var cmdLine;

  if ("arguments" in window &&
    "QueryInterface" in window.arguments[0]) {
   cmdLine = window.arguments[0].QueryInterface(
     Components.interfaces.nsICommandLine);

   tt.printLn("cmdLine.length: " + cmdLine.length);

   z1 = cmdLine.length;
   for (i1 = 0; i1 < z1; ++ i1) {
    tt.pp("cmdLine.getArgument(" + i1 + "): " + cmdLine.getArgument(i1));
    arg = cmdLine.getArgument(i1);
    if (skip) {
     skip = false;
    } else if (arg.substring(0, 1) === "-") {
     skip = true;
    } else {
     args.push(arg);
    }
   }

   if (0 < args.length) {
    ustFileName = args[0];
    tt.pp("ustFileName=", ustFileName);
    data = ttXul.loadText(ustFileName, "Shift_JIS");
tt.pp("data.length=", data.length);
    ust = ttUst.parse(data);
   }
  }
 })();


 tt.loadFile("data/config.json", "json", "", {
  success: function(data){
try {
   var i, z;

   cfg = data;

   progressObj = new Progress(
     document.querySelector("#progressPage .progressBar"));

   var selType = document.getElementById("selType");
   var opt;
   var voicemaps = cfg["voicemaps"], voicemap;
   for (i = 0, z = voicemaps.length; i < z; ++ i) {
    voicemap = voicemaps[i];
    opt = document.createElement("option");
    opt.appendChild(document.createTextNode(voicemap["name"]));
    opt.setAttribute('value', voicemap["file"]);
    selType.appendChild(opt);
   }

   var btnExec = document.getElementById("btnTranslate");
   btnExec.addEventListener("click", doTranslate, false);
   tt.pp("btnExec.addEventListener(\"click\")");

   var btnCancel = document.getElementById("btnCancel");
   btnCancel.addEventListener("click", doCancel, false);
   tt.pp("btnCancel.addEventListener(\"click\")");

   var btnSave = document.getElementById("btnSave");
   btnSave.addEventListener("click", doSave, false);

   var btnBack = document.getElementById("btnBack");
   btnBack.addEventListener("click", doBack, false);


   var btnForPresamp = document.getElementById("btnForPresamp");
   btnForPresamp.addEventListener("click", doForPresamp, false);

   var btnSaveForPresamp = document.getElementById("btnSaveForPresamp");
   btnSaveForPresamp.addEventListener("click", doSaveForPresamp, false);

   var btnCancelForPresamp = document.getElementById("btnCancelForPresamp");
   btnCancelForPresamp.addEventListener("click", doCancelForPresamp, false);

   var btnProgressCancel = document.getElementById("btnProgressCancel");
   btnProgressCancel.addEventListener("click", doProgressCancel, false);

   var btnOpenLicense = document.getElementById("btnOpenLicense");
   btnOpenLicense.addEventListener("click", doOpenLicense, false);

   var btnLicenseOk = document.getElementById("btnLicenseOk");
   btnLicenseOk.addEventListener("click", doLicenseOk, false);

   tt.pp("ready");

} catch (ex) {
 alert(ex + "\n" + ex.stack);
 window.close();
}
  }
 });

 function doTranslateImpl(){
  tt.pp("btnTranslate: onclick");

//  document.querySelector("#textPage").style.display = "none";
  progressCancelFlag = false;
  document.querySelector("#progressPage").style.display = "block";
  tt.setCurPrintElement(document.querySelector(
    "#progressPage .console"));

  var tbody = document.querySelector(
    "#tablePage table > tbody");
  while (tbody.lastChild) {
   tbody.removeChild(tbody.lastChild);
  }

  convNote = document.getElementById("chkConvNote").checked;

  var selInsertTextMode = document.getElementById("selInsertTextMode");
  insertTextMode = selInsertTextMode.options[selInsertTextMode.selectedIndex].value | 0;

  var selType = document.getElementById("selType");
  var voicemapFile = selType.options[selType.selectedIndex].value;

  var useFiles = {};
  useFiles["cmudict"] = cfg.files["cmudict"];
  useFiles[voicemapFile] = cfg.files[voicemapFile];

  tt.loadFiles(useFiles, {
   success: function (dataSet) {
try {
    tt.pp("load dict success");

    var dictEn = parseCMUdict(dataSet["cmudict"]);
    var voMap = VoiceMap.parse(dataSet[voicemapFile]);
tt.pp("VoiceMap.warns=", voMap.warns);
    var txt = document.getElementById("txtInput").value;

    transFromText(ust, txt, dictEn, voMap).then(function(translated){
     pronunciation = translated;

     var tbody = document.querySelector(
       "#tablePage table > tbody");

     var apPrevIdx = null;

     var i1, z1, i2, z2;
     for (i1 = 0, z1 = pronunciation.length; i1 < z1; ++ i1) {
      var anotherPronunciations = null, ap, apElm;
      var p = pronunciation[i1];
      var words = "", wordIdx = null;
      var arpabets = "", s, prevIdx = null;
      for (i2 = 0, z2 = p.src.length; i2 < z2; ++ i2) {
       s = p.src[i2];
       if (0 < arpabets.length) {
        arpabets += " ";
       }
       arpabets += s.val;

       if (prevIdx !== s.src.idx) {
        if (! wordIdx) {
         wordIdx = s.src.idx;
        }

        if (apPrevIdx !== s.src.idx) {
         if ("anotherPronunciations" in s.src) {
          apPrevIdx = s.src.idx;
          anotherPronunciations = s.src.anotherPronunciations;
         }
        }

        if (0 < words.length) {
         words += " ";
        }
        words += s.src.val;
        prevIdx = s.src.idx;
       }
      }

      var record = document.createElement("tr");

      var fldNoteNo = document.createElement("td");
      fldNoteNo.classList.add("fldNoteNo");
      fldNoteNo.appendChild(document.createTextNode(wordIdx));
      record.appendChild(fldNoteNo);

      var fldSrcWord = document.createElement("td");
      fldSrcWord.classList.add("fldSrcWord");
      fldSrcWord.appendChild(document.createTextNode(words));

      if (anotherPronunciations) {
       for (i2 = 0, z2 = anotherPronunciations.length; i2 < z2; ++ i2) {
        ap = anotherPronunciations[i2];
        apElm = document.createElement("p");
        apElm.appendChild(document.createTextNode(ap.word + ":" + ap.pronun));
        fldSrcWord.appendChild(apElm);
       }
      }

      record.appendChild(fldSrcWord);

      var fldArpabet = document.createElement("td");
      fldArpabet.classList.add("fldArpabet");
      fldArpabet.appendChild(document.createTextNode(arpabets));
      record.appendChild(fldArpabet);

      var fldNote = document.createElement("td");
      fldNote.classList.add("fldNote");
      fldNote.appendChild(document.createTextNode(p.val.voName));
      record.appendChild(fldNote);

      tbody.appendChild(record);
//      tbody.style.width = "100%";

       var h, mh = -1;
       var flds = record.childNodes;
       for (i2 = 0, z2 = flds.length; i2 < z2; ++ i2) {
        h = flds[i2].offsetHeight;
        if (mh < h) {
         mh = h;
        }
       }

       mh = mh + "px";
       for (i2 = 0, z2 = flds.length; i2 < z2; ++ i2) {
        flds[i2].style.height = mh;
       }
     }

//     document.querySelector("#tablePage").style.display = "block";
     document.querySelector("#progressPage").style.display = "none";
     progressObj.clear();
     var console = tt.setCurPrintElement(null);
     while (console.lastChild) {
      console.removeChild(console.lastChild);
     }
    },

    function(ex){
     if (progressCancelFlag) {
//      document.querySelector("#textPage").style.display = "block";
      document.querySelector("#progressPage").style.display = "none";
      var console = tt.setCurPrintElement(null);
      while (console.lastChild) {
       console.removeChild(console.lastChild);
      }
      return;
     }

     if (ex) {
      alert(ex.toString() + "\n" + ex.stack);
      window.close();
     }
    });
} catch (ex) {
 alert(ex.message + "\n" + ex.stack);
 window.close();
}
   }
  });
 }

 function doTranslate(){
  try {
   doTranslateImpl();
  } catch (ex) {
   alert(ex.stack);
   window.close();
  }
 }

 function doCancel(){
  window.close();
 }

 function doSave(){
try {
/*
  document.querySelector("#progressPage").style.display = "block";
  tt.setCurPrintElement(document.querySelector(
    "#progressPage .console"));
  var btnProgressCancel =  document.getElementById("btnProgressCancel");
  btnProgressCancel.firstChild.nodeValue = "ok";
  btnProgressCancel.disabled = true;
*/
  if (! ustFileName) {
   ust = new ttUst.USTDocument();
  }

  if (convNote || insertTextMode === 3) {
   ust.each(function(elm){
    if (/^#\d+$/.test(elm.name)) {
     elm.name = "#DELETE";
    }
   });
  }

  var p, srcUstElm;
  var prevElm = null;
  var elmsIdx, elmsLen, curElm, allElms;

  var i1, z1, lyric, elm;
  z1 = pronunciation.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   p = pronunciation[i1];

   lyric = p.val.voName;
   elm = ust.createElement();
   elm.setLyric(lyric);
   elm.setLength(240);

   srcUstElm = p.src[0].src.src;
   if (srcUstElm) {
    elm.setNoteNum(srcUstElm.items["NoteNum"]);
   } else {
    elm.setNoteNum(60);
   }

   if (prevElm) {
     prevElm.after(elm);
     prevElm = elm;

   } else {
    allElms = ust.allElms;

    if (! convNote && insertTextMode === 2) {
     for (elmsIdx = allElms.length - 1; 0 <= elmsIdx; -- elmsIdx) {
      curElm = allElms[elmsIdx];
      if (curElm.name !== "#NEXT" && curElm.name !== "#DELETE") {
       curElm.after(elm);
       prevElm = elm;
       break;
      }
     }
    }

    if (! prevElm) {
     for (elmsIdx = 0, elmsLen = allElms.length; elmsIdx < elmsLen; ++ elmsIdx) {
      curElm = allElms[elmsIdx];
      if (curElm.name !== "#SETTING" && curElm.name !== "#PREV") {
       curElm.before(elm);
       prevElm = elm;
       break;
      }
     }

     if (! prevElm) {
      ust.insertContentEnd(elm);
      prevElm = elm;
     }
    }
   }
  }

  if (ustFileName) {
   tt.pp(ust.toString());
/*
   btnProgressCancel.disabled = false;
   btnProgressCancel.onclick = function() {
*/
    ttXul.saveText(ustFileName, "Shift_JIS", ust.toString());
    window.close();
/*
   };
*/
  } else {
   var noteIdx = 0, noteIdxStr;
   z1 = ust.allElms.length;
   for (i1 = 0; i1 < z1; ++ i1) {
    elm = ust.allElms[i1];
    if (/^#(\d+|INSERT)$/.test(elm.name)) {
     noteIdxStr = "0000" + noteIdx;
     elm.name = "#" + noteIdxStr.substring(noteIdxStr.length - 4);
     ++ noteIdx;
    }
   }
   elm = ust.createElement();
   elm.name = "#TRACKEND";
   ust.append(elm);

   var nsFilePicker = Components.interfaces.nsIFilePicker;
   var outputFilePath;

   var outfp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsFilePicker);
   outfp.init(window, "Input a output .ust file name", nsFilePicker.modeSave);
   outfp.appendFilter("output file", "*.ust");
   var resOut = outfp.show();
   if (resOut !== nsFilePicker.returnOK && resOut !== nsFilePicker.returnReplace) {
    return false;
   }

   outputFilePath = outfp.file.path;
   ttXul.saveText(outputFilePath, "Shift_JIS", ust.toString());

//   alert(ust.toString());
//   tt.pp(ust.toString());
  }

} catch (ex) {
 alert(ex + "\n" + ex.stack);
 window.close();
}
 }

 function doBack() {
/*
  document.querySelector("#tablePage").style.display = "none";
  document.querySelector("#textPage").style.display = "block";
*/
 }


 function getHeadTailPron(str) {
  var prons = [
"O",
"A",
"i",
"u",
"E",
"e",
"I",
"U",
"V",
"@",
"@",
"{",
"eI",
"aI",
"oU",
"aU",
"OI",
"3",
"@",
"p",
"b",
"t",
"d",
"k",
"g",
"tS",
"dZ",
"f",
"v",
"T",
"D",
"s",
"z",
"S",
"Z",
"h",
"m",
"m",
"n",
"n",
"N",
"N",
"l",
"l",
"r",
"r\\",
"4",
"4~",
"j",
"w",
"?"];
  var i, z = prons.length, plen, pron, p = {head:null, tail:null};
  for (i = 0; i < z; ++ i) {
   pron = prons[i];
   plen = pron.length;
   if (str.substring(0, plen) === pron && (!p.head || p.head.length < plen)) {
    p.head = pron;
   }
   if (str.substring(str.length - plen) === pron && (!p.tail || p.tail.length < plen)) {
    p.tail = pron;
   }
  }
  return p;
 }

 function getProns(str) {
  var prons = [], p;
  var pos = 0, endPos = str.length;
  while (pos < endPos) {
   p = getHeadTailPron(str.substring(pos));
   prons.push(p.head);
   pos += p.head.length;
  }

  return prons;
 }

 function isLongVowel(p) {
  var longVowels = {
"i": true,
"u": true,
"e": true,
"eI": true,
"aI": true,
"oU": true,
"aU": true,
"OI": true};
  return !(!(longVowels[p]));
 }

 function isShortVowel(p) {
  var shortVowels = {
"O": true,
"A": true,
"E": true,
"I": true,
"U": true,
"V": true,
"{": true,
"3": true,
"@": true};
  return !(!(shortVowels[p]));
 }

 function isVowel(p) {
  return isShortVowel(p) || isLongVowel(p);
 }

 function findVowel(ps) {
  var i, z, c = 0;
  for (i = 0, z = ps.length; i < z; ++ i) {
   if (isShortVowel(ps[i])) {
    return {type:1, pos:i};
   } else if (isLongVowel(ps[i])) {
    return {type:2, pos:i};
   }
  }
  return null;
 }

 function cntVowels(ps) {
  var i, z, c = 0;
  for (i = 0, z = ps.length; i < z; ++ i) {
   if (isVowel(ps[i])) {
    ++ c;
   }
  }
  return c;
 }

 function doForPresamp() {
try {
  var i1, z1, p, lyric, presampText = "";
  var s, prevIdx = null, pht, prevPHT = null;
  z1 = pronunciation.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   p = pronunciation[i1];
   s = p.src[p.src.length - 1];
   if (prevIdx !== s.src.idx) {
    prevIdx = s.src.idx;
    presampText += " ";
   }

   lyric = p.val.voName;
   pht = getHeadTailPron(lyric);
   if (prevPHT) {
    if (pht.head && prevPHT.tail === pht.head) {
     lyric = lyric.substring(pht.head.length);
    }
   }

   prevPHT = pht;

   presampText += lyric.replace(/[ -]+/g, "");
  }

  var words = presampText.trim().split(/ /), syllable, syllables = [];
  var word, ps;
  var i2, z2, p2, ps2, vt;
  var i3, z3, p3, ps3;
  for (i1 = 0, z1 = words.length; i1 < z1; ++ i1) {
   word = words[i1];
   ps = getProns(word);
   if (cntVowels(ps) < 2) {
    syllables.push(word);
    continue;
   }

   ps2 = [];
   for (i2 = 0, z2 = ps.length; i2 < z2; ++ i2) {
    p2 = ps[i2];
    if (isVowel(p2)) {
     if ((2 <= ps2.length) && (vt = findVowel(ps2))) {
      if (vt.type === 1) { // short vowel
       if (vt.pos < ps2.length - 1) {
        z3 = vt.pos + 1;
       } else {
        z3 = vt.pos;
       }
      } else { // long vowel
       z3 = vt.pos;
      }

      ps3 = [];
      for (i3 = 0; i3 <= z3; ++ i3) {
       p3 = ps2.shift();
       ps3.push(p3);
      }

      syllable = ps3.join("");
      syllables.push(syllable);
     }

     ps2.push(p2);

    } else {
     ps2.push(p2);
    }
   }

   syllable = ps2.join("");
   syllables.push(syllable);
  }

  document.getElementById("txtForPresamp").value = syllables.join(" ");

  document.querySelector("#textPage").style.display = "none";
  document.querySelector("#forPresampPage").style.display = "block";
} catch (ex) {
 alert(ex + "\n" + ex.stack);
 window.close();
}
 }

 function doSaveForPresamp(){
try {
/*
  document.querySelector("#progressPage").style.display = "block";
  tt.setCurPrintElement(document.querySelector(
    "#progressPage .console"));
  var btnProgressCancel =  document.getElementById("btnProgressCancel");
  btnProgressCancel.firstChild.nodeValue = "ok";
  btnProgressCancel.disabled = true;
*/
  if (! ustFileName) {
   ust = new ttUst.USTDocument();
  }

  if (convNote || insertTextMode === 3) {
   ust.each(function(elm){
    if (/^#\d+$/.test(elm.name)) {
     elm.name = "#DELETE";
    }
   });
  }

  var txtForPresamp = document.getElementById("txtForPresamp");
  var syllablesTxt = txtForPresamp.value;
  var syllables = syllablesTxt.split(/\s+/);

  var prevElm = null;
  var elmsIdx, elmsLen, curElm, allElms;

  var i1, z1, lyric, elm;
  z1 = syllables.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   lyric = syllables[i1];
   elm = ust.createElement();
   elm.setLyric(lyric);
   elm.setLength(240);
   elm.setNoteNum(60);

   if (prevElm) {
     prevElm.after(elm);
     prevElm = elm;

   } else {
    allElms = ust.allElms;

    if (! convNote && insertTextMode === 2) {
     for (elmsIdx = allElms.length - 1; 0 <= elmsIdx; -- elmsIdx) {
      curElm = allElms[elmsIdx];
      if (curElm.name !== "#NEXT" && curElm.name !== "#DELETE") {
       curElm.after(elm);
       prevElm = elm;
       break;
      }
     }
    }

    if (! prevElm) {
     for (elmsIdx = 0, elmsLen = allElms.length; elmsIdx < elmsLen; ++ elmsIdx) {
      curElm = allElms[elmsIdx];
      if (curElm.name !== "#SETTING" && curElm.name !== "#PREV") {
       curElm.before(elm);
       prevElm = elm;
       break;
      }
     }

     if (! prevElm) {
      ust.insertContentEnd(elm);
      prevElm = elm;
     }
    }
   }
  }

  if (ustFileName) {
   tt.pp(ust.toString());
/*
   btnProgressCancel.disabled = false;
   btnProgressCancel.onclick = function() {
*/
    ttXul.saveText(ustFileName, "Shift_JIS", ust.toString());
    window.close();
/*
   };
*/
  } else {
   var noteIdx = 0, noteIdxStr;
   z1 = ust.allElms.length;
   for (i1 = 0; i1 < z1; ++ i1) {
    elm = ust.allElms[i1];
    if (/^#(\d+|INSERT)$/.test(elm.name)) {
     noteIdxStr = "0000" + noteIdx;
     elm.name = "#" + noteIdxStr.substring(noteIdxStr.length - 4);
     ++ noteIdx;
    }
   }
   elm = ust.createElement();
   elm.name = "#TRACKEND";
   ust.append(elm);

   var nsFilePicker = Components.interfaces.nsIFilePicker;
   var outputFilePath;

   var outfp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsFilePicker);
   outfp.init(window, "Input a output .ust file name", nsFilePicker.modeSave);
   outfp.appendFilter("output file", "*.ust");
   var resOut = outfp.show();
   if (resOut !== nsFilePicker.returnOK && resOut !== nsFilePicker.returnReplace) {
    return false;
   }

   outputFilePath = outfp.file.path;
   ttXul.saveText(outputFilePath, "Shift_JIS", ust.toString());

//   alert(ust.toString());
//   tt.pp(ust.toString());
  }

} catch (ex) {
 alert(ex + "\n" + ex.stack);
 window.close();
}
 }

 function doCancelForPresamp() {
  document.querySelector("#forPresampPage").style.display = "none";
  document.querySelector("#textPage").style.display = "block";
 }


 function doProgressCancel() {
  progressCancelFlag = true;
 }

 function doOpenLicense() {
  document.querySelector("#licensePage").style.display = "block";
 }

 function doLicenseOk() {
  document.querySelector("#licensePage").style.display = "none";
 }


 function parseCMUdict(str) {
  tt.pp("parseCMUdict");
  var dict = {};
  var lines = str.split(/\u000D\u000A|\u000A|\u000D/);
  var line, pair;
  var i1, z1;
  var word, wordBody, pronun, m, pObj, pObj2, anotherPronunciations;

//  tt.printLn(lines[0]);
  z1 = lines.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   line = lines[i1];
   if (/^;;;/.test(line)) {
    continue;
   }
   if (/^\s*$/.test(line)) {
    continue;
   }

   pair = line.split(/  /);
   word = pair[0];
   pronun = pair[1];

   if (m = /^([A-Z']+)\(\d+\)$/.exec(word)) {
    wordBody = m[1];
    if (! (wordBody in dict)) {
     dict[wordBody] = pronun;
    }

    pObj = dict[wordBody];
    if (typeof(pObj) === "string") {
     anotherPronunciations = [{word: wordBody, pronun: pObj}];
     dict[wordBody] = {pronun: pObj, another: anotherPronunciations};
    } else {
     anotherPronunciations = pObj.another;
    }

    anotherPronunciations.push({word: word, pronun: pronun});

    dict[word] = {pronun: pronun, another: anotherPronunciations};

   } else {
    dict[word] = pronun;
   }
  }
  return dict;
 }

 function stripNumber(src) {
  var dst = [];
  var i1, z1 = src.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   dst[i1] = src[i1].replace(/^([A-Za-z]+)\d*$/, "$1");
  }
  return dst;
 }


 function VoiceMapRule(
   lookbehind, patternBody, lookahead, voElmsToRepl) {

  if (! lookbehind || ! (lookbehind instanceof Array)) {
   lookbehind = [];
  }
  if (! patternBody || ! (patternBody instanceof Array)) {
   patternBody = [];
  }
  if (! lookahead || ! (lookahead instanceof Array)) {
   lookahead = [];
  }
  if (! voElmsToRepl || ! (voElmsToRepl instanceof Array)) {
   voElmsToRepl = [];
  }

  this.lookbehind = lookbehind;
  this.patternBody = patternBody;
  this.lookahead = lookahead;
  this.voElmsToRepl = voElmsToRepl;
 }

 VoiceMapRule.prototype.toString = function(){
  return this.lookbehind.join(" ") +
    "/" + this.patternBody.join(" ") + "/" +
    this.lookahead.join(" ") +
    + "//" + this.voElmsToRepl.join(" ");
 };


 function VoiceMap() {
  this.rules = {};
  this.warns = [];
 }

 VoiceMap.prototype.rules = null;
 VoiceMap.prototype.warns = null;

 VoiceMap.prototype.add = function (
   lookbehind, patternBody, lookahead, voElmsToRepl) {
  var key = "";
  var rule = new VoiceMapRule(lookbehind, patternBody, lookahead, voElmsToRepl);

  if (rule.voElmsToRepl.length < 1) {
   return;
  }

  if (0 < rule.patternBody.length) {
   key = rule.patternBody[0];
  } else {
   key = "";
  }

  if (! (key in this.rules)) { 
   this.rules[key] = [];
  }

  this.rules[key].push(rule);
 };

 VoiceMap.parse = function (str, srcElmSet, dstElmSet) {
  var obj = new VoiceMap();
  var warns = [];
  var lines, line, i1, z1;
  var flds, prons, pron, ptnw, ptn0, ptn1, ptn, i2, z2, i3, z3;
  var pronObj, pairs, pair;

  lines = str.split(/\u000D\u000A|\u000A|\u000D/);
  z1 = lines.length;
  for (i1 = 0; i1 < z1; ++ i1) {
   line = lines[i1].trim();
   if (line.length < 1 || /^\s*#/.test(line)) {
    continue;
   }

   flds = line.split(/\t/);
   if (flds.length < 2) {
    warns.push("WARNNING: line " + (i1 + 1) +
      ": Number of separators is illegal.");
    continue;
   }

   ptn0 = flds.shift().split(/\//);
   if (ptn0.length !== 3) {
    warns.push("WARNNING: line " + (i1 + 1) +
      ": Number of slashes in pattern is illegal.");
    continue;
   }

   ptn = [];
   for (i2 = 0; i2 < 3; ++ i2) {
    ptnw = ptn0[i2].trim();
    if (ptnw.length < 1) {
     ptn1 = [];
    } else {
     ptn1 = ptnw.split(/\s+/);
     for (i3 =0, z3 = ptn1.length; i3 < z3; ++ i3) {
      if (srcElmSet && ! (ptn1[i3] in srcElmSet)) {
       warns.push("WARNNING: line " + (i1 + 1) +
         ": A pattern element '" + ptn1[i3] + "' is nothing in source element set.");
      }
     }
    }
    ptn.push(ptn1);
   }

   prons = [];
   for (i2 = 0, z2 = flds.length; i2 < z2; ++ i2) {
    pron = flds[i2].trim();
    pronObj = {voName: pron};

    ++ i2;
    if (i2 < z2) {
     pairs = flds[i2].split('/');
     for (i3 = 0, z3 = pairs; i3 < z3; ++ i3) {
      pair = pairs[i3].split('=', 2);
      if (pair.length === 1 && 0 < pair[0].length) {
       pronObj[pair[0]] = true;
      } else if (pair.length === 2) {
       pronObj[pair[0]] = pair[1];
      }
     }
    }

    if (0 < pron.length) {
     prons.push(pronObj);
    }
   }

   z2 = prons.length;
   if (z2 < 1) {
    warns.push("WARNNING: line " + (i1 + 1) +
      ": replacing pronunation element is empty.");
    continue;
   }
   if (dstElmSet) {
    for (i2 = 0; i2 < z2; ++ i2) {
     if (! (prons[i2] in dstElmSet)) {
      warns.push("WARNNING: line " + (i1 + 1) +
        ": A replacing pronunation element '" + prons[i2] + "' is nothing in target element set.");
     }
    }
   }

   obj.add(ptn[0], ptn[1], ptn[2], prons);
  }

  obj.warns = warns;

  return obj;
 }


 VoiceMap.prototype.pronunationsToVoiceNames = function(src) {
  tt.pp('VoiceMap.prototype.pronunationsToVoiceNames');

  if (! (src instanceof Array)) {
   return null;
  }

  var self = this;
  var dst = [];
  var srcLen = src.length, pos = 0;

  function translateImpl() {
   var p2, p3;
   var subset;
   var loop, loopEnd;
   var matched;

   if (! (pos < srcLen)) {
    return true;
   }

//   if (pos < srcLen) {
    subset = self.rules[src[pos].val];
    loopEnd = 2;
//   } else {
//    subset = self.rules[""];
//    loopEnd = 1;
//   }

   matched = false;
   for (loop = 0; ! matched && loop < loopEnd; ++ loop) {
    if (subset) {
     var i1, z1;
     z1 = subset.length;
     for (i1 = 0; ! matched && i1 < z1; ++ i1) {
      var rule = subset[i1];
      var lb = rule.lookbehind;
      var pb = rule.patternBody;
      var la = rule.lookahead;
      var ve = rule.voElmsToRepl;
      var i2, z2;

      i2 = 0;
      z2 = lb.length;
      p2 = pos - z2;
      if (lb[0] === "^") {
       if (p2 !== -1) {
        continue;  
       }
       i2 = 1;
       p2 = 0;
      }
      if (p2 < 0) {
       continue;
      }
      for (; p2 < srcLen && i2 < z2; ++ i2, ++ p2) {
       if (lb[i2] !== src[p2].val) {
        break;
       }
      }
      if (i2 < z2) {
       continue;
      }

      p2 = pos;
      z2 = pb.length;
      if (srcLen <= p2 + z2 - 1) {
       continue;
      }
      for (i2 = 0; p2 < srcLen && i2 < z2; ++ i2, ++p2) {
       if (pb[i2] !== src[p2].val) {
        break;
       }
      }
      if (i2 < z2) {
       continue;
      }

      p3 = p2;
      z2 = la.length;
      if (la[z2 - 1] === "$") {
       -- z2;
       if (p2 + z2 !== srcLen) {
        continue;
       }
      } 
      if (srcLen <= p2 + z2 - 1) {
       continue;
      }
      for (i2 = 0; p2 < srcLen && i2 < z2; ++ i2, ++ p2) {
       if (la[i2] !== src[p2].val) {
        break;
       }
      }
      if (i2 < z2) {
       continue;
      }

   tt.pp('pos=', pos, ', srcLen=', srcLen, ', src.val=', src[pos].val, 'rule=' + rule);

      var i3, z3, srcAry = [];
      for (i3 = pos, z3 = p3; i3 < z3; ++ i3) {
       srcAry.push(src[i3]);
      }
      for (i3 = 0, z3 = ve.length; i3 < z3; ++ i3) {
       dst.push({val: ve[i3], src: srcAry, err: false});
      }
      pos = p3;
      matched = true;
     }
    }
    subset = self.rules[""];
   }

//   if (loopEnd == 1) {
//    break;
//   }

   if (! matched) {
    dst.push({val: "(" + src[pos].val + ")", src: [src[pos]], err: true});
    ++ pos;
   }

   return false;
  }

  return new Promise(function(resolve, reject){
   function translateLoop() {
    var resolved;

    try {

     if (progressCancelFlag) {
      reject(null);
      return;
     }

     resolved = translateImpl();

     if (pos < src.length) {
      progressObj.setCur(src[pos].src.no);
     }

     if (resolved) {
tt.pp("resolve: dst=", dst);
      resolve(dst);
     } else {
      setTimeout(translateLoop, 0);
     }

    } catch (ex) {
     reject(ex);
    }
   }

   setTimeout(translateLoop, 0);
  });
 };




 function transFromText(ust, txt, dict, voMap) {
  tt.pp("transFromText");

  var push = Array.prototype.push;

  var words = [], fromUst = [], fromTxt = [];

  if (ust && convNote && insertTextMode !== 3) {
   fromUst = getWordsFromUst(ust);
  }

  if (insertTextMode !== 0) {
   fromTxt = parseText(txt);
  }
  
  switch (insertTextMode) {
   case 0: words = fromUst; break;
   case 1:
    push.apply(words, fromTxt);
    push.apply(words, fromUst);
    break;
   case 2:
    push.apply(words, fromUst);
    push.apply(words, fromTxt);
    break;
   case 3: words = fromTxt; break;
  }

  var i, z;
  for(i = 0, z = words.length; i < z; ++ i) {
   words[i].no = i + 1;
  }

  return wordsToVoiceNames(words, dict, voMap);
 }


 function parseText(txt) {
  var i1, z1;
  var words = [];
  var rawWords = txt.split(/[^0-9A-Za-z'\(\)]+/);
  var wordObj;

  for (i1 = 0, z1 = rawWords.length; i1 < z1; ++ i1) {
   wordObj = {
    val: rawWords[i1],
    idx: "text." + i1
   };
   words.push(wordObj);
  }
  
  return words;
 }


 function getWordsFromUst(ust) {
  var words = [];

  ust.each(function(elm){
   var word, wordObj;
   word = elm.items["Lyric"];
   if (word === "R") {
    word = "(" + word + ")";
   }

   wordObj = {
    val: word,
    idx: "ust." + elm.name,
    src: elm
   };
   words.push(wordObj);
  });

  return words;
 }

 function wordsToVoiceNames(words, dict, voMap) {
  var push = Array.prototype.push;
  var arpabetAry = [];
  var p = [];
  var i1, z1;
  var unknown;

  tt.pp("wordsToVoiceNames");

  progressObj.init(0, words.length, 0);

  z1 = words.length;
  i1 = 0;

  function transFromTextImpl() {
   var word;
   var srcObj;
   var arpabetStr;
   var arpabetTmpAry;
   var i2, z2;
   var m;

   for (; i1 < z1; ++ i1) {
    srcObj = words[i1];
    word = srcObj.val.trim();
    if (word && 0 < word.length) {
     if (m = /^\((.*)\)$/.exec(word)) {
      unknown = {
       val: {voName: m[1].trim()},
       src: [{val: "(through)", src: srcObj, err: false}],
       err: false
      };
      ++ i1;
      return false;
     } else {
      arpabetTmpAry = null;

      arpabetStr = dict[word.toUpperCase()];
tt.pp(i1 + ": word=" + word + ", arpabetStr=" + arpabetStr);
      if (arpabetStr) {
       if (arpabetStr.another) {
        srcObj.anotherPronunciations = arpabetStr.another;
        arpabetStr = arpabetStr.pronun;
       }

       arpabetTmpAry = stripNumber(arpabetStr.split(/ /));
      } else {
       arpabetTmpAry = ConvUnknownWord.convUnknownEnglishWord(word);
tt.pp(i1 + ": word=" + word + ", arpabetTmpAry=[" + arpabetTmpAry + "]");
      }

      if (arpabetTmpAry) {
       for (i2 = 0, z2 = arpabetTmpAry.length; i2 < z2; ++ i2) {
        arpabetAry.push(
          {val: arpabetTmpAry[i2], src: srcObj, err: false});
       }

      } else {
       unknown = {
        val: {voName: "#" + word + "#"},
        src: [{val: "(unknown)", src: srcObj, err: true}],
        err: true
       };
       ++ i1;
       return false;
      }
     }
    }
   }

   return true;
  }

  return new Promise(function(resolve, reject){
   function transFromTextLoop() {
    try {
     if (progressCancelFlag) {
      reject(null);
      return;
     }

     if (transFromTextImpl()) {
      voMap.pronunationsToVoiceNames(arpabetAry).then(function(translated){
       push.apply(p, translated);
       arpabetAry = [];
       resolve(p);
      },
      function(ex){
       reject(ex);
      });

     } else {
      voMap.pronunationsToVoiceNames(arpabetAry).then(function(translated){
tt.pp("p=", p, ", translated=", translated);
try{
       push.apply(p, translated);
       p.push(unknown);
       arpabetAry = [];
tt.pp("p=", p);
       setTimeout(transFromTextLoop, 0);
}catch(ex){
 reject(ex);
}
      },
      function(ex){
       reject(ex);
      });
     }
    } catch (ex) {
     reject(ex);
    }
   }

   setTimeout(transFromTextLoop, 0);
  });
 }


} catch (ex) {
 alert(ex + "\n" + ex.stack);
 window.close();
}
});


