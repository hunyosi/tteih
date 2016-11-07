'use strict';

import * as pathUtils from '../common/pathUtils.js';
import * as nodeUtils from './nodeUtils.js';

const fs = require('fs');
const process = require('process');


export class FileSystem {
  constructor() {
    this._curPath = pathUtils.parsePath(process.cwd(), process.platform);
  }

  getCurPath() {
    return this._curPath;
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
