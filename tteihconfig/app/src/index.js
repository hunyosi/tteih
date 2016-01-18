/*
# [COPYING]
#     TTEIHConfig
#     Copyright (C) 2016 Hunyosi Asakura
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
const CovertTableMaker = require('./CovertTableMaker.js');

crashReporter.start();


const options = [
  //'enable-tcp-fastopen',
  //'enable-experimental-canvas-features',
  'enable-experimental-web-platform-features',
  //'enable-overlay-scrollbars',
  //'enable-hardware-overlays',
  //'enable-universal-accelerated-overflow-scroll',
  //'allow-file-access-from-files',
  //'allow-insecure-websocket-from-https-origin',
  ['js-flags', '--harmony_collections']
];

for (let option in options) {
  if (typeof option === 'string') {
    app.commandLine.appendSwitch(option);
  } else {
    app.commandLine.appendSwitch(option[0], option[1]);
  }
}


function doProcess(data) {

  return new Promise((resolve, reject) => {
    const ctm = new CovertTableMaker();
    ctm.otoIniData = data.otoIniData;
    ctm.mappingData = data.mappingData;
    ctm.make();
    resolve(ctm.outputData);
  });
}


ipc.on('doProcess', (evt, msg) => {
  doProcess(msg).then((outputDeta) => {
    evt.sender.send('succeedProcess', outputDeta);
  }, (err) => {
    evt.sender.send('failureProcess', err + '');
  });
});


var mainWnd;

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  mainWnd = new BrowserWindow({
    width: 640,
    height: 480
  });
  mainWnd.on('closed', () => {
    mainWnd = null;
  });
  mainWnd.loadUrl('file://' + __dirname + '/index.html');
});
