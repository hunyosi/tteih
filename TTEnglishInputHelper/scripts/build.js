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

const fileUtil = require('./fileUtil.js');




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
      if (typeof pathInZip === 'string' || pathInZip instanceof String) {
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
      if (typeof pathInZip === 'string' || pathInZip instanceof String) {
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
      return this[_zip].generateAsync({
        type: 'uint8array'
      }).then((content)=>{
        fs.writeFileSync(pathInFs, new Buffer(content));
      });
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




class UtauPluginPackager {
  constructor() {
    this.targetName = null;
    this.binDir = null;
    this.contentsDir = null;
    this.configFilePath = 'build.json';
    this.installFilePath = 'install.txt';
    this.pluginFilePath = 'plugin.txt';
    this.config = {};
  }


  init() {
    return new Promise((resolve, reject) => setTimeout(() => {
      {
        const configFileStat = fs.statSync(this.configFilePath);
        if (configFileStat != null && configFileStat.isFile()) {
          this.config = JSON.parse(fs.readFileSync('build.json', 'utf8'));
        }
      }

      {
        this.installFilePath = this.config.installFilePath ? this.config.installFilePath : this.installFilePath;
        this.pluginFilePath = this.config.pluginFilePath ? this.config.pluginFilePath : this.pluginFilePath;
      }

      {
        const installFileStat = fs.statSync(this.installFilePath);
        if (installFileStat == null || !installFileStat.isFile()) {
          reject('"install.txt" file not found');
          return;
        }
        const installFileText = fs.readFileSync(this.installFilePath, 'utf8');
        const installMap = parseEqSignSepratedKVPairs(installFileText);
        let contentsDir = '';
        if (installMap.has('contentsdir')) {
          contentsDir = installMap.get('contentsdir');
        }
        if (contentsDir.length < 1 && installMap.has('folder')) {
          this.contentsDir = installMap.get('folder');
        }
        if (contentsDir.length < 1) {
          reject('not exists "folder" entry and "contentsdir" entry in install.txt');
          return;
        }
        this.contentsDir = contentsDir;
      }

      {
        const pluginFileText = fs.readFileSync(this.pluginFilePath, 'utf8');
        const pluginMap = parseEqSignSepratedKVPairs(pluginFileText);
        let execPath = (pluginMap.has('execute') ? pluginMap.get('execute') : '');
        if (execPath.length < 1) {
          reject('not exists "execute" entry in plugin.txt');
          return;
        }
        const pathParts = execPath.split(/\s*[/\\]+\s*/);
        while (0 < pathParts.length && pathParts[pathParts.length - 1].length < 1) {
          pathParts.pop();
        }
        if (pathParts.length < 1) {
          reject('"execute" entry in plugin.txt is illegal');
          return;
        }
        const execFileName = pathParts.pop();
        const matched = /^([^.*?]+)[^*?]*$/.exec(execFileName);
        if (!matched) {
          reject('"execute" entry in plugin.txt is illegal');
          return;
        }
        this.targetName = matched[1];
        this.binDir = this.contentsDir;
        if (0 < pathParts.length) {
          this.binDir += '/' + pathParts.join('/');
        }
      }

      const distDir = new fileUtil.File('dist');
      distDir.remove();
      distDir.mkdir();

      resolve(this);
    }, 0));
  }


  makeZipFile() {
    const zip = new FsZip();
    zip.addLocalFile(this.installFilePath, 'install.txt', {
      encoding: 'CP932',
      newLine: '\r\n'
    });
    zip.addLocalFile(this.pluginFilePath, `${this.contentsDir}/plugin.txt`, {
      encoding: 'CP932',
      newLine: '\r\n'
    });
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

    return zip.writeZipFile(`dist/${this.targetName}.zip`).then(()=>{
      return this;
    })
  }


  makeElectronPackage() {
    return new Promise((resolve, reject) => {
      electronPackager({
        dir: './built/app',
        name: this.targetName,
        platform: 'win32',
        arch: 'ia32',
        icon: './assets/icon256x256.ico',
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




(new UtauPluginPackager()).run()
  .catch((err) => {
    console.log(err);
  });
