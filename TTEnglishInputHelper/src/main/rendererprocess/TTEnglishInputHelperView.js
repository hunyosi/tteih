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
import {Progress} from './Progress.js';
import {FilePicker} from './filepicker.js';


export class TTEnglishInputHelperView {
  constructor(model) {
    this._model = model;
    this._filePicker = new FilePicker(document);
    this._progressObj = Progress.getInstance();

    this._pronunciation = null;
  }

  init() {
    tt.pp("TTEnglishInputHelperView.init()");
    return this.initUi()
      .then(() => this._model.init())
      .then(() => this.initUiAfter())
      .then(() => tt.pp("TTEnglishInputHelperView ready"));
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
    });
  }

  initUiAfter() {
    return new Promise((resolve, reject) => {
      this.setVoiceMaps(this._model.voiceMaps);
    });
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

    this._model.convNote = document.getElementById("chkConvNote").checked;

    var selInsertTextMode = document.getElementById("selInsertTextMode");
    this._model.insertTextMode = selInsertTextMode.options[selInsertTextMode.selectedIndex].value | 0;

    var selType = document.getElementById("selType");
    var voicemapFile = selType.options[selType.selectedIndex].value;

    var txt = document.getElementById("txtInput").value;

    this._model.translate(txt /*, voicemapFile*/)
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
      document.querySelector("#progressPage").style.display = "block";
      tt.setCurPrintElement(document.querySelector(
        "#progressPage .console"));
      var btnProgressCancel =  document.getElementById("btnProgressCancel");
      btnProgressCancel.firstChild.nodeValue = "ok";
      btnProgressCancel.disabled = true;

      this._model.save().then((saved, data)=>{
        if (!saved) {
          return this._filePicker.saveTextFile("untitled.ust", "Shift_JIS", data);
        } else {
          window.close();
        }
      }).then(()=>{
        btnProgressCancel.disabled = false;
        btnProgressCancel.onclick = () => {
          this.doProgressCancel();
        };
      }).catch((err)=>{
        alert(ex + "\n" + ex.stack);
        window.close();
      });
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
      document.querySelector("#progressPage").style.display = "block";
      tt.setCurPrintElement(document.querySelector(
        "#progressPage .console"));
      var btnProgressCancel =  document.getElementById("btnProgressCancel");
      btnProgressCancel.firstChild.nodeValue = "ok";
      btnProgressCancel.disabled = true;

      var txtForPresamp = document.getElementById("txtForPresamp");
      var syllablesTxt = txtForPresamp.value;
      this._model.saveForPresamp(syllablesTxt).then((saved, data)=>{
        if (!saved) {
          return this._filePicker.saveTextFile("untitled.ust", "Shift_JIS", data);
        } else {
          window.close();
        }
      }).then(()=>{
        btnProgressCancel.disabled = false;
        btnProgressCancel.onclick = () => {
          this.doProgressCancel();
        };
      }).catch((err)=>{
        alert(ex + "\n" + ex.stack);
        window.close();
      });
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
