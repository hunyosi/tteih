'use strict';

/*
main process                renderer process
    |
prepare
    |
run renderer process -------------->+
    |                               |
    |                           prepare
    |                               |
    |                stub info      |
    |<------------------------- send prepared msg
    |                               |
    |        stub info              |
response ok ----------------------->|
    |                               |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    |            class name         |
send create msg ------------------->|
    |                               |
    |                           get next sequence #
    |                               |
    |                           create incetanse
    |                               |
    |                           put sequence #/instance pair to WeakMap
    |                               |
    |               sequence #      |
    |<------------------------- response ok
    |                               |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    |         class name,           |
    |         sequence #,           |
    |         method name,          |
    |         parameters            |
send message ---------------------->|
(return Promise)                    |
    |                           call method of instance
    |                               |
    |                   result      |
    |<------------------------- response result
    |                               |
resolve/reject Promise              |
    |                               |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    |                               |


*/

import * as serialize from './serialize.js';


function enumerateMethods(cls) {
  const methodSet = new Set();
  const root = cls.prototype;

  for (let p = root; p !== Object.prototype; p = Object.getPrototypeOf(p)) {
    for (let n of Object.getOwnPropertyNames(p)) {
      if (n !== 'constructor' && typeof root[n] === 'function') {
        methodSet.add(n);
      }
    }
  }

  const methodAry = [];
  for (let elm of methodSet.values()) {
    methodAry.push(elm);
  }
  return methodAry;
}


function serializeMessage(obj) {
  const newObj = {};
  for (let key of Object.keys(obj)) {
    newObj[key] = obj[key];
  }

  newObj.data = serialize.toJSONObject(newObj.data);
  return JSON.stringify(newObj);
}


function deserializeMessage(str, clsMap) {
  const newObj = JSON.parse(str);
  newObj.data = serialize.fromJSONObject(newObj.data, clsMap);
  return newObj;
}


export const CommunicatorStub = (() => {
  const _onReceive = Symbol();
  const _onResponse = Symbol();

  return class CommunicatorStub {
    constructor() {
      this[_onReceive] = null;
      this[_onResponse] = null;
    }

    set onReceive(callback) {
      this[_onReceive] = callback;
    }

    set onResponse(callback) {
      this[_onResponse] = callback;
    }

    send(str) {
      this[_onReceive]({}, str);
    }

    response(obj, str) {
      this[_onResponse](str);
    }
  };
})();


export const MsgCommServer = (() => {
  const _communicator = Symbol();
  const _classes = Symbol();
  const _instances = Symbol();
  const _sequenceNumbers = Symbol();
  const _fromJsonClasses = Symbol();

  return class MsgCommServer {
    constructor(communicator, classes) {
      this[_communicator] = communicator;
      this[_classes] = new Map();
      this[_instances] = new Map();
      this[_sequenceNumbers] = new Map();
      this[_fromJsonClasses] = new Map();

      if (typeof classes === 'object') {
        if (classes.constructor === Object) {
          for (let key of Object.keys(classes)) {
            this.addClassWithName(key, classes[key]);
          }
        } else if (classes instanceof Map) {
          for (let pair of classes) {
            this.addClassWithName(pair[0], pair[1]);
          }
        } else {
          for (let cls of classes) {
            this.addClass(cls);
          }
        }
      }

      this[_communicator].onReceive = (
        (resObj, data) => this.onReceiveMessage(resObj, data));
    }

    addClass(cls) {
      const name = cls.name;
      this.addClassWithName(name, cls);
    }

    addClassWithName(name, cls) {
      this[_classes].set(name, cls);
      this[_instances].set(name, new Map());
      this[_sequenceNumbers].set(name, 0);

      const self = this;
      const fromJsonClass = class {
        static fromJSON(seqNo) {
          return self[_instances].get(name).get(seqNo);
        }
      };
      this[_fromJsonClasses].set(name, fromJsonClass);
    }

    getClassInfo() {
      const classes = this[_classes];
      const ary = [];
      for (let pair of classes) {
        ary.push([
          pair[0],
          enumerateMethods(pair[1])
        ]);
      }
      return ary;
    }

    createInstance(clsName, param) {
      const classes = this[_classes];
      const instances = this[_instances];
      const sequenceNumbers = this[_sequenceNumbers];

      const cls = classes.get(clsName);
      if (!cls) {
        throw new Exception('do not have class: ', clsName);
      }

      const seqNo = sequenceNumbers.get(clsName);
      const nextSeqNo = seqNo + 1;

      const instance = new cls(param);
      instances.get(clsName).set(nextSeqNo, instance);

      sequenceNumbers.set(clsName, nextSeqNo);

      return nextSeqNo;
    }

    invokeMethod(cls, seqNo, methodName, params) {
      const instancesOfCls = this[_instances].get(cls);
      if (!instancesOfCls) {
        throw new Exception(`unknwon class: ${cls}`);
      }

      const instance = this[_instances].get(cls).get(seqNo);
      if (!instance) {
        throw new Exception(`unknwon seqNo: cls=${cls}, seqNo=${seqNo}`);
      }

      const method = instance[methodName];
      if (typeof method !== 'function') {
        throw new Exception(`unknwon method: cls=${cls}, seqNo=${seqNo}, method=${methodName}`);
      }

      return method.apply(instance, params);
    }

    dispatchMessage(msg, data) {
      if (msg === 'invoke') {
        const result = this.invokeMethod(data.cls, data.seqNo, data.method, data.params);
        return result;

      } else if (msg === 'new') {
        const seqNo = this.createInstance(data.cls);
        return seqNo;

      } else if (msg === 'clsinfo') {
        const clsinfo = this.getClassInfo();
        return clsinfo;

      } else {
        throw new Exception(`unkwon message: msg=${msg}, data=${data}`);
      }
    }

    onReceiveMessage(resObj, msgStr) {
      const obj = deserializeMessage(msgStr, this[_fromJsonClasses]);
      const msg = obj.msg;
      let data, ok;
      try {
        data = this.dispatchMessage(msg, obj.data);
        ok = true;
      } catch (e) {
        data = e;
        ok = false;
      }

      if (data instanceof Promise) {
        data.then(
          (result) => {
            const res = {
              id: obj.id,
              msg,
              ok: true,
              data: result
            };
            const serializedMessage = serializeMessage(res);
            this[_communicator].response(resObj, serializedMessage);
          },
          (result) => {
            const res = {
              id: obj.id,
              msg,
              ok: false,
              data: result
            };
            const serializedMessage = serializeMessage(res);
            this[_communicator].response(resObj, serializedMessage);
          }
        );

      } else {
        const res = {
          id: obj.id,
          msg,
          ok,
          data
        };
        const serializedMessage = serializeMessage(res);
        this[_communicator].response(resObj, serializedMessage);
      }
    }
  };
})();


export const MsgCommClient = (() => {
  const _communicator = Symbol();
  const _stubClasses = Symbol();
  const _stubInstances = Symbol();
  const _responseCallbackes = Symbol();

  const _seqNo = Symbol()

  return class MsgCommClient {
    constructor(communicator) {
      this[_communicator] = communicator;
      this[_stubClasses] = new Map();
      this[_stubInstances] = new Map();
      this[_responseCallbackes] = [];

      this[_communicator].onResponse = (
        (data) => this.onReceiveResponce(data));
    }

    getInstance(clsName) {
      return this.send('new', {
          cls: clsName
        })
        .then((seqNo) => {
          const instance = new(this[_stubClasses].get(clsName))(seqNo);
          this[_stubInstances].set(seqNo, instance);
          return instance;
        });
    }

    fetchClass(cls) {
      return this.send('clsinfo', null)
        .then((clsInfo) => {
          for (let pair of clsInfo) {
            this.addClass(pair[0], pair[1]);
          }
        });
    }

    addClass(clsName, methodNames) {
      const parent = this;

      const stubCls = class {
        constructor(seqNo) {
          this[_seqNo] = seqNo;
        }

        static get name() {
          return clsName;
        }

        static toJSON() {
          return this[_seqNo];
        }

        static fromJSON(seqNo) {
          return parent[_stubInstances].get(clsName).get(seqNo);
        }
      };

      for (let methodName of methodNames) {
        Object.defineProperty(stubCls.prototype, methodName, {
          value: function() {
            return parent.send('invoke', {
              cls: clsName,
              seqNo: this[_seqNo],
              method: methodName,
              params: Array.prototype.slice.call(arguments)
            });
          }
        });
      }

      this[_stubClasses].set(clsName, stubCls);
      this[_stubInstances].set(clsName, new Map());
    }

    send(msg, params) {
      return new Promise((resolve, reject) => {
        const id = this.getMessageId(resolve, reject);
        const obj = {
          id: id,
          msg: msg,
          data: params
        };
        const str = serializeMessage(obj, this[_stubClasses]);
        this[_communicator].send(str);
      });
    }

    onReceiveResponce(msgStr) {
      const obj = deserializeMessage(msgStr, this[_stubClasses]);
      const id = obj.id;
      const ok = obj.ok;
      const data = obj.data;
      const cbAry = this[_responseCallbackes];
      const cbSet = cbAry[id];
      cbAry[id] = null;

      const resolve = cbSet[0];
      const reject = cbSet[1];

      if (ok) {
        resolve(data);
      } else {
        reject(data);
      }
    }

    getMessageId(resolve, reject) {
      const cbSet = [resolve, reject];
      const cbAry = this[_responseCallbackes];
      const cbAryLen = cbAry.length;
      let elm;
      for (let idx = 0; idx < cbAryLen; ++idx) {
        elm = cbAry[idx];
        if (elm == null) {
          cbAry[idx] = cbSet;
          return idx;
        }
      }

      cbAry.push(cbSet);
      return cbAryLen;
    }
  };
})();
