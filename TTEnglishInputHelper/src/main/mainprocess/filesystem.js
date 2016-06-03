'use strict';

import * as path from '../common/path.js';

const fs = require('fs');

extern class FileSystem {
  readFile(srcPath) {
    return new Promise((resolve, reject)=>{
      fs.readFile(path.buildUnixPath(srcPath), (err, data)=>{
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    });
  }
}
