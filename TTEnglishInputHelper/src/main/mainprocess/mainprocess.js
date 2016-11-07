'use strict';

import * as maincomm from '../electron/maincomm.js';
import * as filesystem from './filesystem.js';
import * as appEnv from './appenv.js';
import * as msgcomm from '../common/MsgComm.js';
import * as pathutils from '../common/pathUtils.js';
const electron = require('electron');

const commSvr = new maincomm.MainCommunicatorServer('msgcomm');
const msgCommSvr = new msgcomm.MsgCommServer(commSvr, [
  filesystem.FileSystem,
  appEnv.AppEnv
], [
  pathutils.Path,
  pathutils.RouteElement
]);

var mainWnd;

electron.app.on('window-all-closed', () => {
  electron.app.quit();
});

electron.app.on('ready', () => {
  mainWnd = new electron.BrowserWindow({
    width: 320,
    height: 200
  });
  mainWnd.on('closed', () => {
    mainWnd = null;
  });
  mainWnd.loadURL('file://' + __dirname + '/../index.html');
});
