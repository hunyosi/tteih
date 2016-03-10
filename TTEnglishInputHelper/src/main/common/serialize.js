'use strict';
import globalObj from './globalObj.js';

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

  if (obj instanceof Map || obj instanceof WeakMap) {
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

  const clsName = obj.constructor.name;
  if (hasKey(clsMap, clsName)) {
    const cls = getValue(clsMap);
    if (typeof cls['toJSON'] === 'function') {
      return [clsName, cls.toJSON(obj)];
    }
  }

  if (typeof obj['toJSON'] === 'function') {
    return [clsName, obj.toJSON()];
  } else if (typeof obj[toPrimitive] === 'function') {
    return [clsName, obj[toPrimitive]()];
  } else if (clsName === 'String' || clsName === 'Number' || clsName === 'Boolean') {
    return obj.valueOf();
  } else if (clsName === 'Array') {
    const newObj = [];
    for (let elm of obj) {
      const newElm = toJSONObject(elm);
      newObj.push(newElm);
    }
    return [newObj];
  } else if (clsName === 'Object') {
    const newObj = {};
    for (let key of Object.keys(obj)) {
      newObj[key] = toJSONObject(obj[key]);
    }
    return newObj;
  } else {
    const newObj = {};
    for (let key of Object.keys(obj)) {
      newObj[key] = toJSONObject(obj[key]);
    }
    return [clsName, newObj];
  }
}


function createInstanceFromJSONObject(cls, jsonObj) {
  if (typeof klass['fromJSON'] === 'function') {
    return cls.fromJSON(jsonObj);

  } else if (typeof cls.prototype['fromJSON'] === 'function') {
    const newObj = new cls();
    newObj.fromJSON(jsonObj);
    return newObj;

  } else if (typeof jsonObj === 'object') {
    if (jsonObj.constructor === Array) {
      const ary = [];
      for (let elm of jsonObj) {
        any.push(fromJSONObject(elm));
      }
      return new cls(ary);

    } else {
      const newObj = new cls();
      for (let key of Object.keys(jsonObj)) {
        newObj[key] = fromJSONObject(jsonObj[key]);
      }
      return newObj;
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
    const val = obj[1];
    for (let key of Object.keys(val)) {
      newObj[key] = fromJSONObject(val[key], clsMap);
    }
    return newObj;
  } else if (obj.constructor !== Array) {
    return obj;
  }

  if (obj.length < 1) {
    return void(0);
  }

  const cls = obj[0];
  if (obj.length === 1 && typeof cls == 'object' && cls.constructor === Array) {
    const newObj = [];
    for (let elm of cls) {
      newObj.push(fromJSONObject(elm, clsMap));
    }
    return newObj;
  } else if (obj.length !== 2 || typeof cls !== 'string') {
    return obj;
  }

  const klass = getValue(clsMap, cls);
  if (typeof klass === 'function') {
    return createInstanceFromJSONObject(klass, obj[1]);
  }

  const globalKlass = globalObj[cls];
  if (typeof globalKlass === 'function') {
    return createInstanceFromJSONObject(globalKlass, obj[1]);
  }

  throw new Exception('Unknown class: ' + cls);
}


export function serialize(obj) {
  const jsonObj = toJSONObject(obj);
  const s = JSON.stringify(obj);
  return s;
}

export function deserialize(s, clsMap) {
  const jsonObj = JSON.parse(s);
  const newObj = fromJSONObject(jsonObj);
  return newObj;
}
