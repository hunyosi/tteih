'use strict';

import * as pathutils from '../common/pathUtils.js';

const process = require('process');
const electron = require('electron');

let argv = null;

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
    if (argv == null) {
      const execPath = pathutils.parsePath(process.argv[0]);
      let startIdx = 0;
      if (execPath.baseName.toLowerCase() === 'electron') {
        startIdx = 1;
      }
      argv = Array.prototype.slice.call(process.argv, startIdx);
    }
    return argv;
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
