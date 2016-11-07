'use strict';

import * as pathutils from '../common/pathUtils.js';

const process = require('process');
const electron = require('electron');


export class AppEnv {
  getArch() {
    return process.arch;
  }

  getPlatform() {
    return process.platform;
  }

  getEnv() {
    return process.env;
  }

  getArgv() {
    return process.argv;
  }

  getCwd() {
    return process.cwd();
  }

  getPath(kind) {
    kind = kind + '';
    let p;
    if (kind === 'app') {
      p = electron.app.getAppPath();
    } else {
      p = electron.app.getPath(kind);
    }
    console.log(p);
    return pathutils.parsePath(p);
  }
}
