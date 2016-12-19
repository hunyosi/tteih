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

export class TTEnglishInputHelperModel {
  constructor(appEnv, fs, fileUtils) {
    this._appEnv = appEnv;
    this._fs = fs;
    this._fileUtils = fileUtils;
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
    tt.pp("TTEnglishInputHelperModel.init()");
    return this.fetchCmdLineArgs()
      .then(() => this.loadConfigFile())
      .then(() => this.configure())
      .then(() => this.loadFileSet())
      .then(() => this.loadInputFile())
      .then(() => tt.pp("TTEnglishInputHelperModel ready"));
  }

  fetchCmdLineArgs() {
    tt.pp("fetchCmdLineArgs");
    return this._appEnv.getArgv().then((cmdLine) => {
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
    });
  }

  loadConfigFile() {
    return this._fileUtils.readTextResource("data/config.json", "UTF-8")
      .then((data)=>{
        this._cfg = JSON.parse(data);
      });
  }

  configure() {
    return new Promise((resolve, reject) => {
      this._voicemaps = this._cfg["voicemaps"]

      if (0 < this._cmdLineArgs.length) {
        this._ustFileName = this._cmdLineArgs[0];
        this._plugInMode = true;
      }
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

  get voiceMaps() {
    return this._voicemaps;
  }

  set convNote(val) {
    this._convNote = !!val;
  }

  set insertTextMode(val) {
    this._insertTextMode = val|0;
  }

  translate(txt, voicemapFile) {
    return new Promise((resolve, reject)=>{
      if (voicemapFile == null) {
        voicemapFile = this._voicemaps[0].file;
      }

      const ust = this._ust;
      const dictEn = this._dictEn;
      const voMap = this._voMapSet.get(voicemapFile);

      transFromText(ust, txt, dictEn, voMap, this._insertTextMode).then(
        (translated)=>{
          this._pronunciation = translated;
          resolve(translated);
        },
        reject);
    });
  }

  save() {
    return new Promise((resolve, reject)=>{
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
        this._fileUtils.writeTextFile(this._ustFileName, "Shift_JIS", this._ust.toString()).then(()=>{
          resolve(true);
        }, (err)=>{
          reject(err);
        });
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

        resolve(false, this._ust.toString());
      }
    });
  }

  convertForPresamp() {
    return new Promise((resolve, reject)=>{
      try {
        const syllables = convForPresamp(this._pronunciation);
        resolve(syllables);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  saveForPresamp(syllablesTxt) {
    return new Promise((resolve, reject)=>{
      try {
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
          this._fileUtils.writeTextFile(this._ustFileName, "Shift_JIS", this._ust.toString()).then(()=>{
            resolve(true);
          }, (err)=>{
            reject(err);
          });
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
          resolve(false, this._ust.toString());
        }

      } catch (ex) {
        reject(ex);
      }
    });
  }

}
