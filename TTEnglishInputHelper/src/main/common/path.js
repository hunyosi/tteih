'use strict';

export class RouteElement {
  constructor({name, isCurrent, isParent}) {
    this._name = name;
    this._isCurrent = isCurrent;
    this._isParent = isParent;
  }

  get name() {
    return this._name;
  }

  get isCurrent() {
    return this._isCurrent;
  }

  get isParent() {
    return this._isParent;
  }
}


export class Path {
  constructor({route = [], isAbsolute, drive, adsName, deviceName, scheme, user, password, host, port, query, label}) {
    this._route = route;
    this._isAbsolute = isAbsolute;

    this._drive = drive;
    this._adsName = adsName;
    this._deviceName = deviceName;

    this._scheme = scheme;
    this._user = user;
    this._password = password;
    this._host = host;
    this._port = port;
    this._query = query;
    this._label = label;
  }
}
