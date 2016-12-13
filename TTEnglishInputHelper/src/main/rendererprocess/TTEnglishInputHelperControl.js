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
import * as tt from './tt.js';
import * as ttUst from './tt.ust.js';
import {Progress} from './Progress.js';
import {FilePicker} from './filepicker.js';
import {parseCMUdict} from './parseCMUdict.js';
import {transFromText} from './transFromText.js';
import {VoiceMap} from './VoiceMap.js';
import {convUnknownEnglishWord} from './ConvUnknownWord.js';
import {convForPresamp} from './convForPresamp.js';

export class TTEnglishInputHelper {
  constructor(appEnv, fs, fileUtils) {
    this._appEnv = appEnv;
    this._fs = fs;
    this._fileUtils = fileUtils;
    this._filePicker = new FilePicker(document);
    this._progressObj = Progress.getInstance();
    this._cmdLineOps = new Map();
    this._cmdLineArgs = [];
    this._cfg = null;
    this._voicemaps = null;
    this._ustFileName = null;
    this._ust = null;
    this._plugInMode = false;
    this._voMapSet = null;
    this._dictEn = null;

    this._convNote = null;
    this._insertTextMode = null;
    this._pronunciation = null;
  }

  init() {
    console.log("TTEnglishInputHelper.init()");
    tt.pp("TTEnglishInputHelper.init()");
    return this.initUi()
      .then(() => this.fetchCmdLineArgs())
      .then(() => this.loadConfigFile())
      .then(() => this.configure())
      .then(() => this.loadFileSet())
      .then(() => this.initUiAfter())
      .then(() => this.loadInputFile())
      .then(() => tt.pp("ready"));
  }

  initUi() {
    return new Promise((resolve, reject) => {
      tt.pp("start EnglishInputPlugin");

      this._progressObj.setDomElement(document.querySelector("#progressPage .progressBar"));

      var btnExec = document.getElementById("btnTranslate");
      btnExec.addEventListener("click", () => this.doTranslate(), false);
      tt.pp("btnExec.addEventListener(\"click\")");

      var btnCancel = document.getElementById("btnCancel");
      btnCancel.addEventListener("click", () => this.doCancel(), false);
      tt.pp("btnCancel.addEventListener(\"click\")");

      var btnSave = document.getElementById("btnSave");
      btnSave.addEventListener("click", () => this.doSave(), false);

      var btnBack = document.getElementById("btnBack");
      btnBack.addEventListener("click", () => this.doBack(), false);

      var btnForPresamp = document.getElementById("btnForPresamp");
      btnForPresamp.addEventListener("click", () => this.doForPresamp(), false);

      var btnSaveForPresamp = document.getElementById("btnSaveForPresamp");
      btnSaveForPresamp.addEventListener("click", () => this.doSaveForPresamp(), false);

      var btnCancelForPresamp = document.getElementById("btnCancelForPresamp");
      btnCancelForPresamp.addEventListener("click", () => this.doCancelForPresamp(), false);

      var btnProgressCancel = document.getElementById("btnProgressCancel");
      btnProgressCancel.addEventListener("click", () => this.doProgressCancel(), false);

      var btnOpenLicense = document.getElementById("btnOpenLicense");
      btnOpenLicense.addEventListener("click", () => this.doOpenLicense(), false);

      var btnLicenseOk = document.getElementById("btnLicenseOk");
      btnLicenseOk.addEventListener("click", () => this.doLicenseOk(), false);

      resolve();
    });
  }

  fetchCmdLineArgs() {
    tt.pp("fetchCmdLineArgs");
    return this._appEnv.getArgv().then((cmdLine) => {
      return new Promise((resolve, reject) => {
        var data;
        var i1, z1, arg, skip = false,
          args = [];
        tt.pp("cmdLine.length: " + cmdLine.length);

        z1 = cmdLine.length;
        for (i1 = 1; i1 < z1; ++i1) {
          tt.pp("cmdLine[" + i1 + "]: " + cmdLine[i1]);
          arg = cmdLine[i1];
          if (skip) {
            skip = false;
          } else if (arg.substring(0, 1) === "-") {
            skip = true;
          } else {
            args.push(arg);
          }
        }
        this._cmdLineArgs = args;
        resolve();
      });
    });
  }

  loadConfigFile() {
    return this._fileUtils.readTextResource("data/config.json", "UTF-8")
      .then((data)=>{
        return new Promise((resolve, reject)=>{
          this._cfg = JSON.parse(data);
          resolve();
        });
      });
  }

  configure() {
    return new Promise((resolve, reject) => {
      this._voicemaps = this._cfg["voicemaps"]

      if (0 < this._cmdLineArgs.length) {
        this._ustFileName = this._cmdLineArgs[0];
        this._plugInMode = true;
      }

      resolve();
    });
  }

  loadFileSet() {
    return this._fileUtils.readResources(this._cfg.files)
      .then((dataSet)=>{
        return new Promise((resolve, reect) => {
          tt.pp("load dict success");

          this._dictEn = parseCMUdict(dataSet["cmudict"]);

          this._voMapSet = new Map();
          for (let voicemap of this._voicemaps) {
            const voicemapFile = voicemap.file;
            const voMap = VoiceMap.parse(dataSet[voicemapFile]);
            this._voMapSet.set(voicemapFile, voMap);
            tt.pp(`VoiceMaps[${voicemapFile}].warns=`, voMap.warns);
          }

          resolve();
        });
      });
  }

  initUiAfter() {
    return new Promise((resolve, reject) => {
      this.setVoiceMaps(this._voicemaps);
      resolve();
    });
  }

  loadInputFile() {
    if (this._ustFileName != null) {
      tt.pp("ustFileName=", this._ustFileName);
      return this._fileUtils.readTextFile(this._ustFileName, "Shift_JIS")
        .then((data) => {
          tt.pp("data.length=", data.length);
          this._ust = ttUst.parse(data);
        });
    }
  }

  setVoiceMaps(voicemaps) {
    var i, z;
    var selType = document.getElementById("selType");
    var opt;
    var voicemap;
    for (i = 0, z = voicemaps.length; i < z; ++i) {
      voicemap = voicemaps[i];
      opt = document.createElement("option");
      opt.appendChild(document.createTextNode(voicemap["name"]));
      opt.setAttribute('value', voicemap["file"]);
      selType.appendChild(opt);
    }
  }


  doTranslateImpl() {
    tt.pp("btnTranslate: onclick");

    //  document.querySelector("#textPage").style.display = "none";
    this._progressObj.cancelFlag = false;
    document.querySelector("#progressPage").style.display = "block";
    tt.setCurPrintElement(document.querySelector(
      "#progressPage .console"));

    var tbody = document.querySelector(
      "#tablePage table > tbody");
    while (tbody.lastChild) {
      tbody.removeChild(tbody.lastChild);
    }

    this._convNote = document.getElementById("chkConvNote").checked;

    var selInsertTextMode = document.getElementById("selInsertTextMode");
    this._insertTextMode = selInsertTextMode.options[selInsertTextMode.selectedIndex].value | 0;

    var selType = document.getElementById("selType");
    var voicemapFile = selType.options[selType.selectedIndex].value;

    var txt = document.getElementById("txtInput").value;

    const ust = this._ust;
    const dictEn = this._dictEn;
    const voMap = this._voMapSet.get(this._voicemaps[0].file);

    transFromText(ust, txt, dictEn, voMap, this._insertTextMode)
      .then(
        (translated) => {
          this._pronunciation = translated;

          var tbody = document.querySelector(
            "#tablePage table > tbody");

          var apPrevIdx = null;

          var i1, z1, i2, z2;
          for (i1 = 0, z1 = this._pronunciation.length; i1 < z1; ++i1) {
            var anotherPronunciations = null,
              ap, apElm;
            var p = this._pronunciation[i1];
            var words = "",
              wordIdx = null;
            var arpabets = "",
              s, prevIdx = null;
            for (i2 = 0, z2 = p.src.length; i2 < z2; ++i2) {
              s = p.src[i2];
              if (0 < arpabets.length) {
                arpabets += " ";
              }
              arpabets += s.val;

              if (prevIdx !== s.src.idx) {
                if (!wordIdx) {
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
              for (i2 = 0, z2 = anotherPronunciations.length; i2 < z2; ++i2) {
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
            for (i2 = 0, z2 = flds.length; i2 < z2; ++i2) {
              h = flds[i2].offsetHeight;
              if (mh < h) {
                mh = h;
              }
            }

            mh = mh + "px";
            for (i2 = 0, z2 = flds.length; i2 < z2; ++i2) {
              flds[i2].style.height = mh;
            }
          }

          //     document.querySelector("#tablePage").style.display = "block";
          document.querySelector("#progressPage").style.display = "none";
          this._progressObj.clear();
          tt.clear();
          tt.setCurPrintElement(null);
        },

        (ex) => {
          if (this._progressObj.cancelFlag) {
            //      document.querySelector("#textPage").style.display = "block";
            document.querySelector("#progressPage").style.display = "none";
            tt.clear();
            tt.setCurPrintElement(null);
            return;
          }

          if (ex) {
            alert(ex.toString() + "\n" + ex.stack);
            window.close();
          }
        });
  }


  doTranslate() {
    try {
      this.doTranslateImpl();
    } catch (ex) {
      alert(ex.stack);
      window.close();
    }
  }

  doCancel() {
    window.close();
  }

  doSave() {
    try {
      /*
        document.querySelector("#progressPage").style.display = "block";
        tt.setCurPrintElement(document.querySelector(
          "#progressPage .console"));
        var btnProgressCancel =  document.getElementById("btnProgressCancel");
        btnProgressCancel.firstChild.nodeValue = "ok";
        btnProgressCancel.disabled = true;
      */
      if (!this._ustFileName) {
        this._ust = new ttUst.USTDocument();
      }

      if (this._convNote || this._insertTextMode === 3) {
        this._ust.each((elm) => {
          if (/^#\d+$/.test(elm.name)) {
            elm.name = "#DELETE";
          }
        });
      }

      var p, srcUstElm;
      var prevElm = null;
      var elmsIdx, elmsLen, curElm, allElms;

      var i1, z1, lyric, elm;
      z1 = this._pronunciation.length;
      for (i1 = 0; i1 < z1; ++i1) {
        p = this._pronunciation[i1];

        lyric = p.val.voName;
        elm = this._ust.createElement();
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
          allElms = this._ust.allElms;

          if (!this._convNote && this._insertTextMode === 2) {
            for (elmsIdx = allElms.length - 1; 0 <= elmsIdx; --elmsIdx) {
              curElm = allElms[elmsIdx];
              if (curElm.name !== "#NEXT" && curElm.name !== "#DELETE") {
                curElm.after(elm);
                prevElm = elm;
                break;
              }
            }
          }

          if (!prevElm) {
            for (elmsIdx = 0, elmsLen = allElms.length; elmsIdx < elmsLen; ++elmsIdx) {
              curElm = allElms[elmsIdx];
              if (curElm.name !== "#SETTING" && curElm.name !== "#PREV") {
                curElm.before(elm);
                prevElm = elm;
                break;
              }
            }

            if (!prevElm) {
              this._ust.insertContentEnd(elm);
              prevElm = elm;
            }
          }
        }
      }

      if (this._ustFileName) {
        tt.pp(this._ust.toString());
        /*
           btnProgressCancel.disabled = false;
           btnProgressCancel.onclick = () => {
        */
        this._fileUtils.writeTextFile(this._ustFileName, "Shift_JIS", this._ust.toString()).then(()=>{
          window.close();
        });
        /*
           };
        */
      } else {
        var noteIdx = 0,
          noteIdxStr;
        z1 = this._ust.allElms.length;
        for (i1 = 0; i1 < z1; ++i1) {
          elm = this._ust.allElms[i1];
          if (/^#(\d+|INSERT)$/.test(elm.name)) {
            noteIdxStr = "0000" + noteIdx;
            elm.name = "#" + noteIdxStr.substring(noteIdxStr.length - 4);
            ++noteIdx;
          }
        }
        elm = this._ust.createElement();
        elm.name = "#TRACKEND";
        this._ust.append(elm);

        this._filePicker.saveTextFile("untitled.ust", "Shift_JIS", this._ust.toString());
      }

    } catch (ex) {
      alert(ex + "\n" + ex.stack);
      window.close();
    }
  }

  doBack() {
    /*
      document.querySelector("#tablePage").style.display = "none";
      document.querySelector("#textPage").style.display = "block";
    */
  }

  doForPresamp() {
    try {
      const syllables = convForPresamp(this._pronunciation);

      document.getElementById("txtForPresamp").value = syllables.join(" ");

      document.querySelector("#textPage").style.display = "none";
      document.querySelector("#forPresampPage").style.display = "block";
    } catch (ex) {
      alert(ex + "\n" + ex.stack);
      window.close();
    }
  }

  doSaveForPresamp() {
    try {
      /*
        document.querySelector("#progressPage").style.display = "block";
        tt.setCurPrintElement(document.querySelector(
          "#progressPage .console"));
        var btnProgressCancel =  document.getElementById("btnProgressCancel");
        btnProgressCancel.firstChild.nodeValue = "ok";
        btnProgressCancel.disabled = true;
      */
      if (!this._ustFileName) {
        this._ust = new ttUst.USTDocument();
      }

      if (this._convNote || this._insertTextMode === 3) {
        this._ust.each((elm) => {
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
      for (i1 = 0; i1 < z1; ++i1) {
        lyric = syllables[i1];
        elm = this._ust.createElement();
        elm.setLyric(lyric);
        elm.setLength(240);
        elm.setNoteNum(60);

        if (prevElm) {
          prevElm.after(elm);
          prevElm = elm;

        } else {
          allElms = this._ust.allElms;

          if (!this._convNote && this._insertTextMode === 2) {
            for (elmsIdx = allElms.length - 1; 0 <= elmsIdx; --elmsIdx) {
              curElm = allElms[elmsIdx];
              if (curElm.name !== "#NEXT" && curElm.name !== "#DELETE") {
                curElm.after(elm);
                prevElm = elm;
                break;
              }
            }
          }

          if (!prevElm) {
            for (elmsIdx = 0, elmsLen = allElms.length; elmsIdx < elmsLen; ++elmsIdx) {
              curElm = allElms[elmsIdx];
              if (curElm.name !== "#SETTING" && curElm.name !== "#PREV") {
                curElm.before(elm);
                prevElm = elm;
                break;
              }
            }

            if (!prevElm) {
              this._ust.insertContentEnd(elm);
              prevElm = elm;
            }
          }
        }
      }

      if (this._ustFileName) {
        tt.pp(this._ust.toString());
        /*
           btnProgressCancel.disabled = false;
           btnProgressCancel.onclick = () => {
        */
        this._fileUtils.writeTextFile(this._ustFileName, "Shift_JIS", this._ust.toString());
        window.close();
        /*
           };
        */
      } else {
        var noteIdx = 0,
          noteIdxStr;
        z1 = this._ust.allElms.length;
        for (i1 = 0; i1 < z1; ++i1) {
          elm = this._ust.allElms[i1];
          if (/^#(\d+|INSERT)$/.test(elm.name)) {
            noteIdxStr = "0000" + noteIdx;
            elm.name = "#" + noteIdxStr.substring(noteIdxStr.length - 4);
            ++noteIdx;
          }
        }
        elm = this._ust.createElement();
        elm.name = "#TRACKEND";
        this._ust.append(elm);

        this._filePicker.saveTextFile("untitled.ust", "Shift_JIS", this._ust.toString());
      }

    } catch (ex) {
      alert(ex + "\n" + ex.stack);
      window.close();
    }
  }

  doCancelForPresamp() {
    document.querySelector("#forPresampPage").style.display = "none";
    document.querySelector("#textPage").style.display = "block";
  }


  doProgressCancel() {
    this._progressObj.cancelFlag = true;
  }

  doOpenLicense() {
    document.querySelector("#licensePage").style.display = "block";
  }

  doLicenseOk() {
    document.querySelector("#licensePage").style.display = "none";
  }
}
