'use strict';

export class RouteElement {
  constructor({name, isCurrent, isParent}) {
    this.name = name;
    this.isCurrent = !!isCurrent;
    this.isParent = !!isParent;
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
  console.log(pathObj.route);
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
