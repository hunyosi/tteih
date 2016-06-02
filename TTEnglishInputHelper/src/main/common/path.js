'use strict';

export class RouteElement {
  constructor({name, isCurrent, isParent}) {
    this.name = name || '';
    this.isCurrent = !!isCurrent;
    this.isParent = !!isParent;
  }

  get isNormal() {
    return (!this.isCurrent) && (!this.isParent) && (typeof this.name === 'string');
  }
}


export class Path {
  constructor({route = [], isAbsolute, drive, adsName, deviceName, scheme, user, password, host, port, query, label}) {
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
}


export function parseUnixPath(pathStr) {
  const isAbsolute = (pathStr.charAt(0) == '/');
  if (isAbsolute) {
    pathStr = pathStr.substring(1);
  }
  const route = [];
  for (let elm of pathStr.split(/\//)) {
    if (elm.length < 1) {
    } else if (elm === '.') {
      route.push(new RouteElement({isCurrent:true}));
    } else if (elm === '..') {
      route.push(new RouteElement({isParent:true}));
    } else {
      route.push(new RouteElement({name:elm}));
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

  const topChar = pathStr.charAt(0);
  const isAbsolute = (topChar === '\\' || topChar === '/');
  if (isAbsolute) {
    pathBody = pathStr.substring(1);
  }
  const route = [];
  for (let elm of pathBody.split(/[\\\/]/)) {
    if (elm.length < 1) {
    } else if (elm === '.') {
      route.push(new RouteElement({isCurrent:true}));
    } else if (elm === '..') {
      route.push(new RouteElement({isParent:true}));
    } else {
      route.push(new RouteElement({name:elm}));
    }
  }

  let adsName = null;
  if (0 < route.length && route[route.length - 1].isNormal) {
    const parts = route[route.length - 1].split(/:/);
    if (parts.length > 1) {
      route[route.length - 1] = new RouteElement({name:parts[0]});
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
