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

const electronPackager = require('electron-packager');
const fs = require('fs');
const JSZip = require('jszip');
const iconvLite = require('iconv-lite');




const FsZip = (() => {
  const _zip = Symbol();
  const _curZip = Symbol();
  const _ruleMap = Symbol();

  return class FsZip {
    constructor(pathInFs) {
      if (pathInFs == null) {
        this[_zip] = new JSZip();
      } else if (typeof pathInFs === 'string' || pathInFs instanceof String) {
        const buf = fs.readFileSync(pathInFs);
        this[_zip] = new JSZip(buf);
      } else {
        throw new TypeError();
      }
      this[_curZip] = this[_zip];
      this[_ruleMap] = new Map();
    }


    setRule(pathInFsRegExp, options) {
      if (!pathInFsRegExp instanceof RegExp) {
        throw new TypeError();
      }
      if (options !== null && typeof options !== 'object') {
        throw new TypeError();
      }
      this[_ruleMap].set(pathInFsRegExp, options);
    }


    removeRule(pathInFsRegExp) {
      this[_ruleMap].delete(pathInFsRegExp);
    }


    matchRule(pathInFs) {
      let retOpts = null;
      for (let pathPart of pathInFs.split(/\s*[/\\]+\s*/)) {
        retOpts = null;
        for (let pair of this[_ruleMap]) {
          const rule = pair[0],
            opts = pair[1];
          if (rule.test(pathPart)) {
            if (opts.exclude) {
              return {
                exclude: true
              };
            }
            retOpts = opts;
            break;
          }
        }
      }
      return retOpts;
    }


    chdir(pathInZip) {
      this[_curZip] = this[_zip].folder(pathInZip);
    }


    addLocalFiles(pathInFsLst, pathInZip) {
      if (typeof pathInFsLst === 'string' || pathInFsLst instanceof String) {
        return this.addLocalFile(pathInFs, pathInZip);
      } else if (!Array.isArray(pathInFsLst)) {
        throw new TypeError();
      }

      const zip = this[_curZip];
      if ((typeof pathInZip === 'string' || pathInZip instanceof String) && 0 < pathInZip.length && pathInZip !== '.') {
        this[_curZip] = zip.folder(pathInZip);
      }

      for (let idx = 0, len = pathInFsLst.length; idx < len; ++idx) {
        const pathInFs = pathInFsLst[idx];
        const pathParts = pathInFs.split(/\s*[/\\]+\s*/);
        const fileName = pathParts.pop();

        this.addLocalFile(pathInFs, fileName);
      }

      this[_curZip] = zip;
    }


    addLocalFile(pathInFs, pathInZip, options) {
      if (typeof pathInFs !== 'string' && !(pathInFs instanceof String)) {
        throw new TypeError();
      }

      let dstPath = pathInFs;
      if ((typeof pathInZip === 'string' || pathInZip instanceof String) && 0 < pathInZip.length) {
        dstPath = pathInZip;
      }

      let opts = options;
      if (options === void(0)) {
        opts = this.matchRule(pathInFs);
      }

      if (opts != null && opts['exclude']) {
        return true;
      }

      const stat = fs.statSync(pathInFs);
      if (!stat) {
        return false;
      }

      if (stat.isDirectory()) {
        const prevDir = process.cwd();
        process.chdir(pathInFs);
        const fnames = fs.readdirSync('.');
        this.addLocalFiles(fnames, dstPath);
        process.chdir(prevDir);
        return true;

      } else if (stat.isFile()) {
        const buf = fs.readFileSync(pathInFs);
        this.addFile(dstPath, buf, opts);
        return true;

      } else {
        return false;
      }
    }


    addFile(pathInZip, content, options) {
      let newLine = null;
      let encoding = null;
      let decoding = null;
      if (options != null) {
        if (typeof options === 'string' || options instanceof String) {
          encoding = options;
        } else if (typeof options === 'object') {
          if ('decoding' in options) {
            decoding = options['decoding'];
          }
          if ('encoding' in options) {
            encoding = options['encoding'];
          }
          if ('newLine' in options) {
            newLine = options['newLine'];
          }
        } else {
          throw new TypeError();
        }
      }

      let data = content;
      if (decoding != null || encoding != null || newLine != null) {
        if (typeof content !== 'string' && !(content instanceof String)) {
          let srcBuf = content;
          if (!(srcBuf instanceof Buffer)) {
            srcBuf = new Buffer(content);
          }
          if (decoding != null) {
            data = iconvLite.decode(srcBuf, decoding);
          } else {
            data = srcBuf.toString('utf8');
          }
        }
      }

      let buf;
      if (typeof data === 'string' || data instanceof String) {
        let str = data;
        if (newLine != null) {
          str = data.replace(/\r\n|\n|\r/g, newLine);
        }
        if (encoding == null) {
          buf = new Uint8Array(new Buffer(str, 'utf8'));
        } else {
          buf = new Uint8Array(iconvLite.encode(str, encoding));
        }
      } else if (data instanceof Buffer) {
        buf = new Uint8Array(data);
      } else if (data instanceof ArrayBuffer) {
        buf = data;
      } else if (data instanceof Uint8Array) {
        buf = data;
      } else {
        throw new TypeError();
      }

      this[_curZip].file(pathInZip, buf);
    }


    writeZipFile(pathInFs) {
      const content = this[_zip].generate({
        type: 'uint8array'
      });
      fs.writeFileSync(pathInFs, new Buffer(content));
    }
  };
})();




function parseEqSignSepratedKVPairs(str) {
  const obj = new Map();
  for (let line of str.split(/\r\n|\n|\r/)) {
    const pair = line.split(/=/, 2);
    if (pair.length == 2) {
      obj.set(pair[0].trim(), pair[1].trim());
    }
  }
  return obj;
}



class AppPackager {
  constructor() {
    this.targetName = null;
    this.binDir = null;
    this.contentsDir = null;
    this.config = {};
  }


  init() {
    return new Promise((resolve, reject) => setTimeout(() => {
      {
        const configFileStat = fs.statSync('build.json');
        if (configFileStat != null && configFileStat.isFile()) {
          this.config = JSON.parse(fs.readFileSync('build.json', 'utf8'));
          if ('binDir' in this.config) {
            this.binDir = this.config['binDir'];
          }
          if ('contentsDir' in this.config) {
            this.contentsDir = this.config['contentsDir'];
          }
        }
      }

      {
        const configFileStat = fs.statSync('app/package.json');
        if (configFileStat != null && configFileStat.isFile()) {
          const packageInfo = JSON.parse(fs.readFileSync('app/package.json', 'utf8'));
          if ('name' in packageInfo) {
            this.targetName = packageInfo['name'];
          }
        }
      }

      fs.mkdirSync('dist');

      resolve(this);
    }, 0));
  }


  makeZipFile() {
    const zip = new FsZip();
    zip.addLocalFile(`dist/${this.targetName}-win32-ia32`, this.binDir);

    const config = this.config;
    if (config != null) {
      if ('toRoot' in config) {
        zip.addLocalFiles(config['toRoot']);
      }
      if ('toContentsDir' in config) {
        zip.addLocalFiles(config['toContentsDir'], this.contentsDir);
      }
    }

    zip.writeZipFile(`dist/${this.targetName}.zip`);
    return Promise.resolve(this);
  }


  makeElectronPackage() {
    return new Promise((resolve, reject) => {
      electronPackager({
        dir: './app',
        name: this.targetName,
        platform: 'win32',
        arch: 'ia32',
        version: '0.35.4',
        out: './dist'
      }, (err, appPath) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }


  run() {
    return this.init()
      .then(() => this.makeElectronPackage())
      .then(() => this.makeZipFile());
  }
}




(new AppPackager()).run()
  .catch((err) => {
    console.log(err);
  });
