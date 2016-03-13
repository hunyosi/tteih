'use strict';
const fs = require('fs');
const path = require('path');

 const globalBasePathFuncs = (function(){
  let globalBasePath = null;

  function getGlobalBasePath() {
    return globalBasePath ? globalBasePath : process.cwd();
  }

  function setGlobalBasePath(pathStr) {
    if (globalBasePath == null) {
      globalBasePath = null;
    } else if (typeof pathStr === 'string') {
      globalBasePath = path.resolve(pathStr);
    } else if (pathStr instanceof String) {
      globalBasePath = path.resolve('' + pathStr);
    } else {
      throw TypeError();
    }
  }

  return {getGlobalBasePath, setGlobalBasePath};
})();

const getGlobalBasePath = globalBasePathFuncs.getGlobalBasePath;
const setGlobalBasePath = globalBasePathFuncs.setGlobalBasePath;


class FileHandler {
  constructor(parent, fd) {
    this.parent = parent;
    this.fd = fd;
    this.pos = 0;
  }

  close() {
    this.parent.setStatByFd(this.fd);
    fs.closeSync(this.fd);
  }
}


class FileReader extends FileHandler {
  constructor(parent, fd) {
    super(parent, fd);
    this.eof = this.parent.size < 1;
  }

  read(buffer, offset, length) {
    const readLen = fs.readSync(this.fd, buffer, offset, length, this.pos);
    this.pos += readLen;
    this.eof = readLen < length;
    return readLen;
  }
}


class FileWriter extends FileHandler {
  constructor(parent, fd) {
    super(parent, fd);
  }

  write(buffer, offset, length) {
    const writtenLen = fs.writeSync(this.fd, buffer, offset, length, this.pos);
    this.pos += writtenLen;
    return writtenLen;
  }

  chmod(mode) {
    fs.fchmodSync(this.fd, mode);
  }

  chown(uid, gid) {
    fs.fchownSync(this.fd, uid, gid);
  }

  utimes(atime, mtime) {
    fs.futimesSync(this.fd, atime, mtime);
  }
}


class File {
  constructor(filePath, basePath) {
    this.base = basePath ? path.resolve(basePath) : getGlobalBasePath();
    this.path = null;
    this.relative = null;
    this.name = null;
    this.fileName = null;
    this.ext = null;
    this.dir = null;
    this.root = null;
    this.isRoot = false;
    this.isExists = false;
    this.isFile = false;
    this.isDirectory = false;
    this.mode = -1;
    this.uid = -1;
    this.gid = -1;
    this.atime = null;
    this.mtime = null;
    this.size = -1;
    this.blksize = -1;

    this.setPath(filePath);
  }

  setPath(filePath) {
    this.initPathInfo();
    this.initStatInfo();

    if (filePath) {
      this.setFilePath(filePath);

      try {
        const stat = fs.statSync(this.path);
        this.setStat(stat);
        this.isExists = true;
      } catch (e) {}
    }
  }

  initPathInfo() {
    this.path = null;
    this.relative = null;
    this.name = null;
    this.fileName = null;
    this.ext = null;
    this.dir = null;
    this.root = null;
    this.isRoot = false;
  }

  initStatInfo() {
    this.isExists = false;
    this.isFile = false;
    this.isDirectory = false;
    this.mode = -1;
    this.uid = -1;
    this.gid = -1;
    this.atime = null;
    this.mtime = null;
    this.size = -1;
    this.blksize = -1;
  }

  setFilePath(filePath) {
    this.path = path.resolve(this.base, filePath);
    this.relative = path.relative(this.base, this.path);
    const parse = path.parse(this.path);
    this.name = parse.base;
    this.fileName = parse.name;
    this.ext = parse.ext;
    this.dir = parse.dir;
    this.root = parse.root;
    this.isRoot = this.fileName.length === 0 && this.dir === this.root;
  }

  setStat(stat) {
    this.isFile = stat.isFile();
    this.isDirectory = stat.isDirectory();
    this.mode = stat.mode;
    this.uid = stat.uid;
    this.gid = stat.gid;
    this.atime = stat.atime;
    this.mtime = stat.mtime;
    this.size = stat.size;
    this.blksize = stat.blksize;
  }

  reload() {
    this.setPath(this.path);
  }

  setStatByFd(fd) {
    this.initStatInfo();
    try {
      const stat = fs.fstatSync(fd);
      this.setStat(stat);
      this.isExists = true;
    } catch (e) {
      this.isExists = false;
    }
  }

  setBasePath(base) {
    this.base = path.resolve(base);
    this.relative = path.relative(this.base, this.path);
  }

  compare(other) {
    if (other == null || !other instanceof File || other.relative == null) {
      return 1;
    }
    return this.relative.localeCompare(other.relative);
  }

  parentFile() {
    return new File(this.dir);
  }

  chown(uid, gid) {
    fs.chownSync(this.path, uid, gid);
  }

  chmod(mode) {
    fs.chmodSync(this.path, mode);
  }

  utimes(atime, mtime) {
    fs.utimes(this.path, atime, mtime);
  }

  mkdir() {
    if (this.isExists) {
      return;
    }

    const parent = this.parentFile();
    if (!parent.isExists) {
      parent.mkdir();
    }

    if (0 <= this.mode) {
      fs.mkdir(this.path, this.mode);
    } else {
      fs.mkdir(this.path);
    }

    this.reload();
  }

  create() {
    const parent = this.parentFile();
    parent.mkdir();

    const fd = (0 <= this.mode ? fs.openSync(this.path, 'w', this.mode) : fs.openSync(this.path, 'w'));
    this.setStatByFd(fd);

    return new FileWriter(this, fd);
  }

  open() {
    const fd = fs.openSync(this.path, 'r');
    this.setStatByFd(fd);
    return new FileReader(this, fd);
  }

  openForAppend() {
    const parent = this.parentFile();
    parent.mkdir();

    const fd = (0 <= this.mode ? fs.openSync(this.path, 'a', this.mode) : fs.openSync(this.path, 'a'));
    this.setStatByFd(fd);

    const fw = new FileWriter(this, fd);
    fw.pos = this.size;
    return fw;
  }

  readdir() {
    return fs.readdirSync(this.path);
  }

  copy(dstPath) {
    if (!this.isExists) {
      return;
    }

    if (this.isDirectory) {
      const dstFile = new File(dstPath);
      const fileNames = this.readdir();
      if (fileNames.length > 0) {
        for (const fileName of fileNames) {
          const file = new File(fileName, this.path);
          file.copy(path.join(dstPath, fileName));
        }
      } else {
        dstFile.mkdir();
      }
      dstFile.chown(this.uid, this.gid);
      dstFile.chmod(this.mode);
      dstFile.utimes(this.atime, this.mtime);

    } else if (this.isFile) {
      const fr = this.open();
      const fw = (new File(dstPath)).create();
      const bufSize = 0x8000;
      const buf = new Buffer(bufSize);
      while (!fr.eof) {
        const readLen = fr.read(buf, 0, bufSize);
        fw.write(buf, 0, readLen);
      }
      fw.chown(this.uid, this.gid);
      fw.chmod(this.mode);
      fw.utimes(this.atime, this.mtime);
      fw.close();
      fr.close();
    }
  }

  remove() {
    try {
      if (this.isDirectory) {
        for (const fileName of this.readdir()) {
          const file = new File(fileName, this.path);
          file.remove();
        }
        fs.rmdirSync(this.path);
      } else {
        fs.unlinkSync(this.path);
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  }
}


function toUnixPath(pathStr) {
  const parts = pathStr.split(path.sep);
  return parts.join('/');
}

function matchPattern(str, ptn) {
  if (str === ptn) {
    return true;
  }

  if (ptn === void 0 || ptn === null) {
    return false;
  }

  const target = '' + str;

  if (typeof ptn === 'string' || ptn instanceof String) {
    return 0 < target.indexOf(ptn);
  } else if (ptn instanceof RegExp) {
    return ptn.test(target);
  } else if (ptn instanceof Array) {
    for (const elm of prn) {
      if (matchPattern(str, elm)) {
        return true;
      }
    }
    return false;
  } else {
    throw new TypeError();
  }
}

function isExcludePath(target, pattern) {
  const tmpPath = path.relative(getGlobalBasePath(), target);
  const unixPath = toUnixPath(tmpPath);
  return matchPattern(unixPath, pattern);
}

function enumerateFilesImpl(result, excludePtn, basePath, target) {
  const file = new File(target, basePath);

  if (isExcludePath(file.path, excludePtn)) {
    result.excludeList.push(file);
    return;
  }

  if (file.isFile) {
    result.list.push(file);
  } else if (file.isDirectory) {
    result.list.push(file);
    for (const name of file.readdir()) {
      const newTarget = path.join(target, name);
      enumerateFilesImpl(result, excludePtn, basePath, newTarget);
    }
  }
}

function enumerateFiles(target, excludePtn) {
  const absPath = path.resolve(target);
  const result = {
    list: [],
    excludeList: []
  };
  enumerateFilesImpl(result, excludePtn, absPath, absPath);
  return result;
}

function makePairs(a, b, compareFunc) {
  const pairs = [];
  const compare = typeof compareFunc === 'function' ? compareFunc : ((a, b) => ('' + a).localeCompare('' + b));
  const aAry = Array.prototype.slice.call(a);
  aAry.sort(compare);
  const bAry = Array.prototype.slice.call(b);
  bAry.sort(compare);
  const aLen = aAry.length;
  const bLen = bAry.length;
  let aIdx = 0;
  let bIdx = 0;
  while (aIdx < aLen && bIdx < bLen) {
    const aElm = aAry[aIdx];
    const bElm = bAry[bIdx];
    const compared = compare(aElm, bElm);
    if (compared < 0) {
      pairs.push([aElm, null]);
      ++aIdx;
    } else if (compared > 0) {
      pairs.push([null, bElm]);
      ++bIdx;
    } else {
      pairs.push([aElm, bElm]);
      ++aIdx;
      ++bIdx;
    }
  }

  if (bIdx >= bLen) {
    for (; aIdx < aLen; ++aIdx) {
      pairs.push([aAry[aIdx], null]);
    }
  } else if (aIdx >= aLen) {
    for (; bIdx < bLen; ++bIdx) {
      pairs.push([null, bAry[bIdx]]);
    }
  }

  return pairs;
}

function isExcludePathParent(targetFile, excludeList) {
  if (!targetFile.isDirectory) {
    return false;
  }

  const targetPath = targetFile.path;
  const targetLen = targetPath.length;
  for (const excludeFile of excludeList) {
    const excludePath = excludeFile.path;
    if (excludePath.length <= targetLen) {
      continue;
    }

    if (excludePath.substring(0, targetLen) === targetPath) {
      return true;
    }
  }

  return false;
}

function operateSrcDstPair(srcFile, dstFile, dst, excludeList) {
  const cwd = getGlobalBasePath();
  if (srcFile !== null && dstFile === null) {
    const dstPath = path.join(dst, srcFile.relative);
    console.log(`copy ${path.relative(cwd, srcFile.path)} --> ${path.relative(cwd, dstPath)}`)
    srcFile.copy(dstPath);
  } else if (srcFile === null && dstFile !== null) {
    if (!isExcludePathParent(dstFile, excludeList)) {
      console.log(`remove ${path.relative(cwd, dstFile.path)}`)
      dstFile.remove();
    }
  } else if (srcFile !== null && dstFile !== null) {
    if (srcFile.isDirectory !== dstFile.isDirectory) {
      console.log(`repair copy ${path.relative(cwd, srcFile.path)} --> ${path.relative(cwd, dstFile.path)}`)
      dstFile.remove();
      srcFile.copy(dstFile.path);
    } else {
      const srcFileMTime = Math.floor(srcFile.mtime.getTime() / 1000);
      const dstFileMTime = Math.floor(srcFile.mtime.getTime() / 1000); // Because, cleared millisecond
      if (srcFileMTime !== dstFileMTime) {
        console.log(`update copy ${path.relative(cwd, srcFile.path)} --> ${path.relative(cwd, dstFile.path)}`)
        srcFile.copy(dstFile.path);
      }
    }
  }
}

function operateSrcDstPairs(srcDstPairs, dst, excludeList) {
  const dstAbs = path.resolve(dst);
  for (const pair of srcDstPairs) {
    operateSrcDstPair(pair[0], pair[1], dstAbs, excludeList);
  }
}

function syncFiles(src, dst, excludeSrc, excludeDst) {
  if (!fs.existsSync(src)) {
    throw new Exception('file not found: ' + src);
  }

  const srcFiles = enumerateFiles(src, excludeSrc);
  const dstFiles = enumerateFiles(dst, excludeDst);
  const srcDstPairs = makePairs(srcFiles.list, dstFiles.list, (a, b) => a.compare(b));
  operateSrcDstPairs(srcDstPairs, dst, dstFiles.excludeList);
}

setGlobalBasePath(__dirname);
syncFiles('app', 'built/app', null, 'built/app/lib');
