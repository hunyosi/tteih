'use strict';

export class RouteElement {
  constructor(params) {
    this.name = '';
    this.baseName = '';
    this.extension = null;
    this.isCurrent = false;
    this.isParent = false;
    this.hidden = false;
    if (typeof params === 'object') {
      let {name, baseName, extension, isCurrent, isParent, isHidden} = params;
      this.name = name || '';
      this.baseName = baseName || this.name;
      this.extension = extension || null;
      this.isCurrent = !!isCurrent;
      this.isParent = !!isParent;
      this.isHidden = !!isHidden;
    }
  }

  get isNormal() {
    return (!this.isCurrent) && (!this.isParent) && (typeof this.name === 'string');
  }
}


export class Path {
  constructor({route = [], isAbsolute, drive, adsName, deviceName, scheme, user, password, host, port, query, label}={}) {
    this.route = [];
    for (let elm of route) {
      this.route.push(new RouteElement(elm));
    }

    this.isAbsolute = isAbsolute;

    this.drive = drive;
    this.adsName = adsName;
    this.deviceName = deviceName;

    this.scheme = scheme;
    this.user = user;
    this.password = password;
    this.host = host;
    this.port = port;
    this.query = query;
    this.label = label;
  }

  get name() {
    const route = this.route;
    const len = route.length;
    if (0 < len) {
      return route[len - 1].name;
    } else {
      return null;
    }
  }

  get baseName() {
    const route = this.route;
    const len = route.length;
    if (0 < len) {
      return route[len - 1].baseName;
    } else {
      return null;
    }
  }

  get extension() {
    const route = this.route;
    const len = route.length;
    if (0 < len) {
      return route[len - 1].extension;
    } else {
      return null;
    }
  }

  parent() {
    const newPath = new Path(this);
    let lastElm;
    while (0 < newPath.route.length) {
      lastElm = newPath.route[newPath.route.length - 1]
      if (lastElm.isParent) {
        newPath.route.push(new RouteElement({isParent:true}));
        return newPath;
      } else if (lastElm.isCurrent) {
        newPath.route.pop();
      } else {
        newPath.route.pop();
        return newPath;
      }
    }

    if (! newPath.isAbsolute) {
      newPath.route.push(new RouteElement({isParent:true}));
    }

    return newPath;
  }

  add(param) {
    var elm;
    if (typeof param === 'string' || param instanceof String) {
      elm = new RouteElement({name: param});
    } else {
      throw new TypeError('Unsupported data type: ' + param);
    }
    const newPath = new Path(this);
    newPath.route.push(elm);
    return newPath;
  }
}

export function parsePath(pathStr, osType) {
  if (osType === 'win32') {
    return parseWindowsPath(pathStr);
  } else {
    if (0 <= pathStr.indexOf('\\')) {
      return parseWindowsPath(pathStr);
    } else {
      return parseUnixPath(pathStr);
    }
  }
}

export function buildPath(pathStr, osType) {
  if (osType === 'win32') {
    return buildWindowsPath(pathStr);
  } else {
    return buildUnixPath(pathStr);
  }
}


export function parseUnixName(name) {
  if (name.length < 1) {
    return new RouteElement({isCurrent:true});
  } else if (name === '.') {
    return new RouteElement({name, isCurrent:true});
  } else if (name === '..') {
    return new RouteElement({name, isParent:true});
  } else {
    const isHidden = name.charAt(0) === '.';
    const extIdx = name.indexOf('.');
    let baseName = name;
    let extension = null;
    if (0 < extIdx) {
      baseName = name.substring(0, extIdx);
      extension = name.substring(extIdx + 1);
    }
    return new RouteElement({name, baseName, extension, isHidden});
  }
}

export function parseUnixPath(pathStr) {
  const isAbsolute = (pathStr.charAt(0) == '/');
  if (isAbsolute) {
    pathStr = pathStr.substring(1);
  }
  const route = [];
  for (let elm of pathStr.split(/\//)) {
    if (0 < elm.length) {
      route.push(parseUnixName(elm));
    }
  }

  return new Path({route, isAbsolute});
}


export function buildUnixPath(pathObj) {
  let buf = '';
  if (pathObj.isAbsolute) {
    buf += '/';
  }

  let sep = '';
  for (let elm of pathObj.route) {
    buf += sep;
    if (elm.isParent) {
      buf += '..';
    } else if (elm.isCurrent) {
      buf += '.';
    } else {
      buf += elm.name;
    }
    sep = '/';
  }

  return buf;
}


export function parseWindowsPath(pathStr) {
  let host = null;
  let drive = null;
  let pathBody = pathStr;
  const matchHost = pathStr.match(/^[\\\/][\\\/]([^.?\\\/]+)(.*)$/);
  if (matchHost !== null) {
    host = matchDriveLetter[1];
    pathBody = matchDriveLetter[2];
  } else {
    const matchDriveLetter = pathStr.match(/^([A-Za-z]):(.*)$/);
    if (matchDriveLetter !== null) {
      drive = matchDriveLetter[1];
      pathBody = matchDriveLetter[2];
    }
  }

  const topChar = pathBody.charAt(0);
  const isAbsolute = (topChar === '\\' || topChar === '/');
  if (isAbsolute) {
    pathBody = pathBody.substring(1);
  }
  const route = [];
  for (let elm of pathBody.split(/[\\\/]/)) {
    if (0 < elm.length) {
      route.push(parseUnixName(elm));
    }
  }

  let adsName = null;
  if (0 < route.length && route[route.length - 1].isNormal) {
    const parts = route[route.length - 1].name.split(/:/);
    if (parts.length > 1) {
      route[route.length - 1] = parseUnixName(parts[0]);
      adsName = parts[parts.length - 1];
    }
  }

  return new Path({route, isAbsolute, drive, host, adsName});
}


export function buildWindowsPath(pathObj) {
  let buf = '';

  if (pathObj.host != null) {
    buf += '\\' + pathObj.host;
  }

  if (pathObj.drive != null) {
    buf += pathObj.drive + ':';
  }

  if (pathObj.isAbsolute) {
    buf += '\\';
  }

  let sep = '';
  for (let elm of pathObj.route) {
    buf += sep;
    if (elm.isParent) {
      buf += '..';
    } else if (elm.isCurrent) {
      buf += '.';
    } else {
      buf += elm.name;
    }
    sep = '\\';
  }

  if (pathObj.adsName != null) {
    buf += ':' + pathObj.adsName;
  }

  return buf;
}
