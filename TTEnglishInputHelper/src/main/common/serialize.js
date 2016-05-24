'use strict';
import globalObj from './globalObj.js';
import * as utils from './utils.js';

const getKeys = Function.prototype.call.bind(
  Object.prototype.keys);
const toPrimitive = Symbol.toPrimitive;

function hasKey(obj, key) {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  if (obj instanceof Map || obj instanceof WeakMap) {
    return obj.has(key);
  } else {
    return key in obj;
  }
}

function getValue(obj, key) {
  if (obj === null || typeof obj !== 'object') {
    return void(0);
  }

  if (obj instanceof Map) {
    return obj.get(key);
  } else {
    return obj[key];
  }
}


export function toJSONObject(obj, clsMap) {
  if (obj === null) {
    return null;
  }

  const t = typeof obj;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    return obj;
  } else if (t === 'undefined') {
    return [];
  } else if (t !== 'object') {
    throw new TypeError(`can not convert ${t} to JSON object`);
  }

  const clsName = utils.getName(obj.constructor);
  if (hasKey(clsMap, clsName)) {
    const cls = getValue(clsMap, clsName);
    if (typeof cls['toJSON'] === 'function') {
      return [clsName, cls.toJSON(obj, clsMap)];
    }
  }

  if (typeof obj['toJSON'] === 'function') {
    return [clsName, obj.toJSON(clsMap)];
  } else if (typeof obj[toPrimitive] === 'function') {
    return [clsName, obj[toPrimitive]()];
  } else if (clsName === 'String' || clsName === 'Number' || clsName === 'Boolean') {
    return obj.valueOf();
  } else if (clsName === 'ArrayBuffer' || clsName === 'Uint8Array' || clsName === 'Int8Array' || clsName === 'Uint8ClampedArray' || clsName === 'Int16Array' || clsName === 'Uint16Array' || clsName === 'Int32Array' || clsName === 'Uint32Array' || clsName === 'Float32Array' || clsName === 'Float64Array') {
    const newObj = utils.Base64.encode(obj);
    return [clsName, newObj];
  } else if (clsName === 'Array') {
    const newObj = [];
    for (let elm of obj) {
      const newElm = toJSONObject(elm, clsMap);
      newObj.push(newElm);
    }
    return [newObj];
  } else if (clsName === 'Object') {
    const newObj = {};
    for (let key of Object.keys(obj)) {
      newObj[key] = toJSONObject(obj[key], clsMap);
    }
    return newObj;
  } else {
    const newObj = {};
    for (let key of Object.keys(obj)) {
      newObj[key] = toJSONObject(obj[key], clsMap);
    }
    return [clsName, newObj];
  }
}


function createInstanceFromJSONObject(cls, jsonObj, clsMap) {
  if (typeof cls['fromJSON'] === 'function') {
    return cls.fromJSON(jsonObj, clsMap);

  } else if (typeof cls.prototype['fromJSON'] === 'function') {
    const newObj = new cls();
    newObj.fromJSON(jsonObj, clsMap);
    return newObj;

  } else if (typeof jsonObj === 'object') {
    if (jsonObj.constructor === Object) {
      const newObj = new cls();
      for (let key of Object.keys(jsonObj)) {
        newObj[key] = fromJSONObject(jsonObj[key], clsMap);
      }
      return newObj;
    } else {
      return new cls(jsonObj);
    }

  } else {
    return new cls(jsonObj);
  }
}


export function fromJSONObject(obj, clsMap) {
  if (obj === null) {
    return null;
  } else if (typeof obj !== 'object') {
    return obj;
  }

  if (obj.constructor === Object) {
    const newObj = {};
    for (let key of Object.keys(obj)) {
      newObj[key] = fromJSONObject(obj[key], clsMap);
    }
    return newObj;
  } else if (obj.constructor !== Array) {
    return obj;
  }

  if (obj.length < 1) {
    return void(0);
  }

  const head = obj[0];
  if (obj.length === 1 && typeof head == 'object' && head.constructor === Array) {
    const newObj = [];
    for (let elm of head) {
      newObj.push(fromJSONObject(elm, clsMap));
    }
    return newObj;
  } else if (obj.length !== 2 || typeof head !== 'string') {
    return obj;
  }

  const clsName = head;
  const klass = getValue(clsMap, clsName);
  if (typeof klass === 'function') {
    return createInstanceFromJSONObject(klass, obj[1], clsMap);
  }

  if (clsName === 'ArrayBuffer') {
    return utils.Base64.decode(obj[1]);
  } else if (clsName === 'Uint8Array') {
    return new Uint8Array(utils.Base64.decode(obj[1]));
  } else if (clsName === 'Uint8ClampedArray') {
    return new Uint8ClampedArray(utils.Base64.decode(obj[1]));
  } else if (clsName === 'Int8Array') {
    return new Int8Array(utils.Base64.decode(obj[1]));
  } else if (clsName === 'Uint16Array') {
    return new Uint16Array(utils.Base64.decode(obj[1]));
  } else if (clsName === 'Int16Array') {
    return new Int16Array(utils.Base64.decode(obj[1]));
  } else if (clsName === 'Uint32Array') {
    return new Uint32Array(utils.Base64.decode(obj[1]));
  } else if (clsName === 'Int32Array') {
    return new Int32Array(utils.Base64.decode(obj[1]));
  } else if (clsName === 'Float32Array') {
    return new Float32Array(utils.Base64.decode(obj[1]));
  } else if (clsName === 'Float64Array') {
    return new Float64Array(utils.Base64.decode(obj[1]));
  }

  const globalKlass = globalObj[clsName];
  if (typeof globalKlass === 'function') {
    return createInstanceFromJSONObject(globalKlass, obj[1], clsMap);
  }

  throw new Exception('Unknown class: ' + cls);
}


export function serialize(obj) {
  const jsonObj = toJSONObject(obj);
  const s = JSON.stringify(jsonObj);
  return s;
}

export function deserialize(s, clsMap) {
  const jsonObj = JSON.parse(s);
  const newObj = fromJSONObject(jsonObj);
  return newObj;
}
