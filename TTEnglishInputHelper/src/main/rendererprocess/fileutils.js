'use strict';

import * as pathutils from '../common/pathUtils.js';
import * as encoding from './encoding.js';

export class FileUtils {
  constructor(fs, appEnv) {
    this._fs = fs;
    this._appEnv = appEnv;
  }

  readTextFile(path, charset) {
    let pathObj = path;
    if (typeof path === 'string' || path instanceof String) {
      pathObj = psthutils.parsePath(path);
    }
    return this._fs.readFile(path)
      .then((data)=>{
        return encoding.decode(data, charset);
      });
  }

  readTextResource(path, charset) {
    return this._appEnv.getPath('app')
      .then((appPath) => {
        return this._fs.readFile(appPath.add(path));
      }).then((data)=>{
        return encoding.decode(data, charset);
      });
  }

  readResources(fileInfoMap) {
    const fs = this._fs;
    let appPath;
    const resultSet = {};
    const keys = Object.keys(fileInfoMap);
    let keyIdx = 0;
    function readResourceImpl() {
      if (keys.length <= keyIdx) {
        return resultSet;
      }
      const key = keys[keyIdx];
      const fileInfo = fileInfoMap[key];
      const path = fileInfo.path;
      const charset = fileInfo.encoding;
      return fs.readFile(appPath.add(path))
        .then((data)=>{
          return encoding.decode(data, charset);
        }).then((data)=>{
          resultSet[key] = data;
          ++keyIdx;
          return readResourceImpl();
        });
    }
    return this._appEnv.getPath('app')
      .then((path) => {
        appPath = path;
        return readResourceImpl();
      });
  }
}
