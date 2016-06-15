'use strict';

const ipcRenderer = require('electron').ipcRenderer;

export const RendererCommunicatorServer = (() => {
  const _onReceive = Symbol();
  const _name = Symbol();

  return class RendererCommunicatorServer {
    constructor(name) {
      this[_onReceive] = null;
      this[_name] = name;
      ipcRenderer.on(this[_name], (ev, msg)=>{
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


export const RendererCommunicatorClient = (() => {
  const _onReceive = Symbol();
  const _name = Symbol();

  return class RendererCommunicatorClient {
    constructor(name) {
      this[_onResponse] = name;
      this[_name] = name;
      ipcRenderer.on(this[_name], (ev, msg)=>{
        if (this[_onResponse]) {
          this[_onResponse](msg);
        }
      });
    }

    set onResponse(callback) {
      this[_onResponse] = callback;
    }

    send(str) {
      ipcRenderer.send(this[_name], str);
    }
  };
})();
