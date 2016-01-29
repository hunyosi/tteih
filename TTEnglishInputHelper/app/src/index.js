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

'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const crashReporter = require('crash-reporter');
const ipc = require('ipc');
const fs = require('fs');
const iconvLite = require('iconv-lite');

crashReporter.start();


function parseIni(src) {
  const sessions = [];
  const sessionStrs = src.split(/\[/);
  sessionStrs.shift();
  for (let sessionStr of sessionStrs) {
    const nameAndAttrs = sessionStr.trim().split(/\]/);
    const name = nameAndAttrs[0].trim();
    const attrs = {};
    if (1 < nameAndAttrs.length) {
      const keyAndVal = nameAndAttrs[1].split(/\n([^=]*)=/);
      keyAndVal.shift();
      for (let i = 0, z = keyAndVal.length; i + 1 < z; i += 2) {
        attrs[keyAndVal[i].trim()] = keyAndVal[i + 1].trim();
      }
    }
    sessions.push({
      name, attrs
    });
  }
  return sessions;
}

const MAX_NOTE_NUM = 105;

function includeNoteNum(track, addVal) {
  for (let note of track) {
    if (/^#[0-9]+$/.test(note.name)) {
      const tmpNoteNum = (note.attrs['NoteNum'] | 0) + 1;
      const newNoteNum = (
        MAX_NOTE_NUM < tmpNoteNum ? MAX_NOTE_NUM : tmpNoteNum);
      note.attrs['NoteNum'] = newNoteNum + '';
    }
  }
}

function toIniString(sessions) {
  const NL = '\r\n';
  let iniString = '';
  for (let session of sessions) {
    iniString += '[' + session.name + ']' + NL;
    const attrs = session.attrs;
    for (let key in attrs) {
      iniString += key + '=' + attrs[key] + NL;
    }
  }
  return iniString;
}


const UST_ENCODING = 'CP932';

function processUst() {

  return new Promise((resolve, reject) => {
    if (process.argv.length < 2) {
      reject();
    }

    const lastArg = process.argv[process.argv.length - 1];
    if (!lastArg.match(/\.ust$/i)) {
      reject();
    }

    fs.readFile(lastArg, (err, srcBin) => {
      if (err !== null) {
        console.log(err);
        reject(err);
      }

      const srcText = iconvLite.decode(srcBin, UST_ENCODING);

      const track = parseIni(srcText);
      includeNoteNum(track);
      const dstText = toIniString(track);

      const dstBin = iconvLite.encode(dstText, UST_ENCODING);
      fs.writeFile(lastArg, dstBin, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}


ipc.on('doProcess', (evt, msg) => {
  function reply(result) {
    evt.sender.send('resultProcess', result);
  }

  processUst().then(() => {
    reply(null);
  }, (err) => {
    reply(err);
  });
});


var mainWnd;

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  mainWnd = new BrowserWindow({
    width: 320,
    height: 200
  });
  mainWnd.on('closed', () => {
    mainWnd = null;
  });
  mainWnd.loadUrl('file://' + __dirname + '/index.html');
});
