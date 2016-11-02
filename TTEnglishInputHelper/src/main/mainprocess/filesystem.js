'use strict';

import * as pathUtils from '../common/pathUtils.js';
import * as nodeUtils from './nodeUtils.js';

const fs = require('fs');
const process = require('process');
const os = require('os');
const electron = require('electron');


function parsePathForCurOs(pathStr) {
  const osType = os.platform();
  if (osType === 'win32') {
    return pathUtils.parseWindowsPath(pathStr);
  } else {
    return pathUtils.parseUnixPath(pathStr);
  }
}

function buildPathForCurOs(pathStr) {
  const osType = os.platform();
  if (osType === 'win32') {
    return pathUtils.buildWindowsPath(pathStr);
  } else {
    return pathUtils.buildUnixPath(pathStr);
  }
}


export class FileSystem {
  constructor() {
    this._curPath = parsePathForCurOs(process.cwd());
  }

  getCurPath() {
    return this._curPath;
  }

  getPath(kind) {
    kind = kind + '';
    let p;
    if (kind === 'app') {
      p = electron.app.getAppPath();
    } else {
      p = electron.app.getPath(kind);
    }
    return parsePathForCurOs(p);
  }

  readFile(srcPath) {
    return new Promise((resolve, reject)=>{
      fs.readFile(pathUtils.buildUnixPath(srcPath), (err, data)=>{
        if (err) {
          reject(err);
        } else {
          const aryBuf = nodeUtils.toArrayBuffer(data);
          resolve(aryBuf);
        }
      })
    });
  }
}
