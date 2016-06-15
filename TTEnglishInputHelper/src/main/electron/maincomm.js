'use strict';

const ipcMain = require('electron').ipcMain;

export const MainCommunicatorServer = (() => {
  const _onReceive = Symbol();
  const _name = Symbol();

  return class MainCommunicatorServer {
    constructor(name) {
      this[_onReceive] = null;
      this[_name] = name;
      ipcMain.on(this[_name], (ev, msg)=>{
        if (this[_onReceive]) {
          this[_onReceive](ev, msg);
        }
      })
    }

    set onReceive(callback) {
      this[_onReceive] = callback;
    }

    response(obj, str) {
      obj.sender.send(this[_name], str);
    }
  };
})();


export const MainCommunicatorClient = (() => {
  const _onReceive = Symbol();
  const _name = Symbol();
  const _target = Symbol();

  return class MainCommunicatorClient {
    constructor(target, name) {
      this[_onResponse] = null;
      this[_target] = target;
      this[_name] = name;
      ipcMain.on(this[_name], (ev, msg)=>{
        if (this[_onResponse]) {
          this[_onResponse](msg);
        }
      });
    }

    set onResponse(callback) {
      this[_onResponse] = callback;
    }

    send(str) {
      this[_target].webContents.send(this[_name], str);
    }
  };
})();
