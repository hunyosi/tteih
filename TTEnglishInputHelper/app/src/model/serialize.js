

module.exports = (function(globalObj){
  'use strict';

  function toJSONObject(obj) {
    if (obj === null) {
      return {isObject: false, cls: 'null'};
    }

    const t = typeof obj;
    if (t === 'undefined') {
      return {isObject: false, cls: 'undefined'};
    } else if (t === 'symbol') {
      throw new TypeError('can not convert symbol to JSON object');
    } else if (t === 'function') {
      throw new TypeError('can not convert symbol to JSON object');
    } else if (t === 'string') {
      return {isObject: false, cls: 'string', val: obj};
    } else if (t === 'number') {
      return {isObject: false, cls: 'number', val: obj};
    } else if (t === 'boolean') {
      return {isObject: false, cls: 'boolean', val: obj};
    }

    const clsName = obj.constructor.name;
    if (typeof obj['toJSON'] === 'function') {
      return {isObject: true, cls: clsName, val: obj.toJSON()};
    } else if (clsName === 'String'
        || clsName === 'Number'
        || clsName === 'Boolean') {
      return {isObject: true, cls: clsName, val: obj};
    } else if (clsName === 'Array') {
      const newObj = [];
      for (let elm of obj) {
        const newElm = toJSONObject(elm);
        newObj.push(newElm);
      }
      return {isObject: true, cls: clsName, val: newObj};
    } else {
      const newObj = {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          newObj[key] = toJSONObject(obj[key]);
        }
      }
      return {isObject: true, cls: clsName, val: newObj};
    }
  }


  function fromJSONObject(obj, clsSet) {
    const cls = obj.cls;
    if (!obj.isObject) {
      if (cls === 'undefined') {
        return (void)0;
      } else  if (cls === 'null') {
        return null;
      } else  if (cls === 'string'
          || cls === 'number'
          || cls === 'boolean') {
        return obj.val;
      } else {
        throw new Exception('unsupported value type: ' + cls);
      }
    } else {
      const klass = clsSet[cls];
      if (typeof klass === 'function') {
        if (typeof klass['fromJSON'] === 'function') {
          return klass.fromJSON(obj.val);
        } else if (typeof klass.prototype['fromJSON'] === 'function') {
          const newObj = new klass();
          newObj.fromJSON(obj.val);
          return newObj;
        } else {
          return new klass(obj.val);
        }
      }

      if (cls === 'Array') {
        const newObj = [];
        for (let elm of obj.val) {
          const newElm = fromJSONObject(elm, clsSet);
          newObj.push(newElm);
        }
        return newObj;
      }

      if (cls === 'Object') {
        const newObj = {};
        const val = obj.val;
        for (let key in val) {
          if (val.hasOwnProperty(key)) {
            newObj[key] = fromJSONObject(val[key], clsSet);
          }
        }
        return newObj;
      }

      const globalKlass = globalObj[cls];
      if (typeof globalKlass === 'function') {

      }

      throw new Exception('Unknown class: ' + cls);
    }
  }

  return {
    toJSONObject,
    fromJSONObject
  };
})((function(){return this;})())
