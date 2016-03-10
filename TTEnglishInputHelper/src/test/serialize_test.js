'use strict';

import * as serialize from '../main/common/serialize.js';

const assert = require('assert');

describe('serialize', function () {
  describe('toJSONObject', function () {
    it('string', function () {
      var actual = serialize.toJSONObject('hello');
      assert.strictEqual( /*expected*/'hello', actual);
    });
    it('boolean', function () {
      var actual = serialize.toJSONObject(false);
      assert.strictEqual( /*expected*/false, actual);
    });
    it('number', function () {
      var actual = serialize.toJSONObject(10.5);
      assert.strictEqual( /*expected*/10.5, actual);
    });
    it('null', function () {
      var actual = serialize.toJSONObject(null);
      assert.strictEqual( /*expected*/null, actual);
    });
    it('undefined', function () {
      var actual = serialize.toJSONObject(void 0);
      assert.deepEqual( /*expected*/[], actual);
    });
    it('Array', function () {
      var actual = serialize.toJSONObject([]);
      assert.deepEqual( /*expected*/[[]], actual);
    });
    it('Object', function () {
      var actual = serialize.toJSONObject({});
      assert.deepEqual( /*expected*/{}, actual);
    });
    it('String', function () {
      var actual = serialize.toJSONObject(new String('test'));
      assert.strictEqual( /*expected*/'test', actual);
    });
    it('Number', function () {
      var actual = serialize.toJSONObject(new Number(10.5));
      assert.strictEqual( /*expected*/10.5, actual);
    });
    it('Boolean', function () {
      var actual = serialize.toJSONObject(new Boolean(false));
      assert.strictEqual( /*expected*/false, actual);
    });
    it('instance of class', function () {
      class Abc {
      }

      var actual = serialize.toJSONObject(new Abc());
      assert.deepEqual( /*expected*/['Abc', {}], actual);
    });
    it('nest', function () {
      class Abc {
        constructor() {
          this.ary = [1, 'a', true, null, {
            aaa: 2,
            bbb: [3, 5]
          }];
        }
      }

      class Def {
        constructor() {
          this.val = new Abc();
          this.u = void 0;
        }
      }

      var actual = serialize.toJSONObject(new Def());
      assert.deepEqual( /*expected*/['Def', {
        val: ['Abc', {
          ary: [[1, 'a', true, null, {
            aaa: 2,
            bbb: [[3, 5]]
          }]]
        }],
        u: []
      }], actual);
    });
  });
});
