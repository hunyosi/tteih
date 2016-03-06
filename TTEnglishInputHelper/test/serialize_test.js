'use strict';

const serialize = require('../app/src/common/serialize.js');

const assert = require('assert');

describe('serialize', function(){
  describe('toJSONObject', function(){
    it('string', function(){
      const actual = serialize.toJSONObject('hello');
      assert.strictEqual(/*expected*/'hello', actual);
    });
    it('boolean', function(){
      const actual = serialize.toJSONObject(false);
      assert.strictEqual(/*expected*/false, actual);
    });
    it('number', function(){
      const actual = serialize.toJSONObject(10.5);
      assert.strictEqual(/*expected*/10.5, actual);
    });
    it('null', function(){
      const actual = serialize.toJSONObject(null);
      assert.strictEqual(/*expected*/null, actual);
    });
    it('undefined', function(){
      const actual = serialize.toJSONObject(void(0));
      assert.deepEqual(/*expected*/[], actual);
    });
    it('Array', function(){
      const actual = serialize.toJSONObject([]);
      assert.deepEqual(/*expected*/[[]], actual);
    });
    it('Object', function(){
      const actual = serialize.toJSONObject({});
      assert.deepEqual(/*expected*/{}, actual);
    });
    it('String', function(){
      const actual = serialize.toJSONObject(new String('test'));
      assert.strictEqual(/*expected*/'test', actual);
    });
    it('Number', function(){
      const actual = serialize.toJSONObject(new Number(10.5));
      assert.strictEqual(/*expected*/10.5, actual);
    });
    it('Boolean', function(){
      const actual = serialize.toJSONObject(new Boolean(false));
      assert.strictEqual(/*expected*/false, actual);
    });
    it('instance of class', function(){
      class Abc {}
      const actual = serialize.toJSONObject(new Abc());
      assert.deepEqual(/*expected*/['Abc',{}], actual);
    });
  });
});
