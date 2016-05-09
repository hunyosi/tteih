'use strict';

import * as serialize from '../main/common/serialize.js';
import * as utils from '../main/common/utils.js';

const assert = require('assert');

describe('serialize', () => {
  describe('toJSONObject', () => {
    it('string', () => {
      var actual = serialize.toJSONObject('hello');
      assert.strictEqual( /*expected*/'hello', actual);
    });
    it('boolean', () => {
      var actual = serialize.toJSONObject(false);
      assert.strictEqual( /*expected*/false, actual);
    });
    it('number', () => {
      var actual = serialize.toJSONObject(10.5);
      assert.strictEqual( /*expected*/10.5, actual);
    });
    it('null', () => {
      var actual = serialize.toJSONObject(null);
      assert.strictEqual( /*expected*/null, actual);
    });
    it('undefined', () => {
      var actual = serialize.toJSONObject(void 0);
      assert.deepEqual( /*expected*/[], actual);
    });
    it('Array', () => {
      var actual = serialize.toJSONObject([]);
      assert.deepEqual( /*expected*/[[]], actual);
    });
    it('Object', () => {
      var actual = serialize.toJSONObject({});
      assert.deepEqual( /*expected*/{}, actual);
    });
    it('String', () => {
      var actual = serialize.toJSONObject(new String('test'));
      assert.strictEqual( /*expected*/'test', actual);
    });
    it('Number', () => {
      var actual = serialize.toJSONObject(new Number(10.5));
      assert.strictEqual( /*expected*/10.5, actual);
    });
    it('Boolean', () => {
      var actual = serialize.toJSONObject(new Boolean(false));
      assert.strictEqual( /*expected*/false, actual);
    });
    it('instance of class', () => {
      class Abc {
      }

      var actual = serialize.toJSONObject(new Abc());
      assert.deepEqual( /*expected*/['Abc', {}], actual);
    });
    it('ArrayBuffer', () => {
      const obj = new ArrayBuffer(4);
      const ary = new Uint16Array(obj);
      ary[0] = 0x0041;
      ary[1] = 0x0042;
      var actual = serialize.toJSONObject(obj);
      if (utils.isLittleEndian()) {
        assert.deepEqual( /*expected*/['ArrayBuffer', '\uF202\u0041\u0042'], actual);
      } else {
        assert.deepEqual( /*expected*/['ArrayBuffer', '\u02F2\u0041\u0042'], actual);
      }
    });
    it('ArrayBuffer illegal surrogate pair', () => {
      const obj = new ArrayBuffer(4);
      const ary = new Uint16Array(obj);
      ary[0] = 0xDC12;
      ary[1] = 0xD834;
      var actual = serialize.toJSONObject(obj);
      assert.strictEqual( /*expected*/Array, actual.constructor);
      assert.strictEqual( /*expected*/'ArrayBuffer', actual[0]);
      assert.strictEqual( /*expected*/String, actual[1].constructor);
      if (utils.isLittleEndian()) {
        assert.deepEqual( /*expected*/0xF202, actual[1].charCodeAt(0));
      } else {
        assert.deepEqual( /*expected*/0x02F2, actual[1].charCodeAt(0));
      }
      assert.deepEqual( /*expected*/0xDC12, actual[1].charCodeAt(1));
      assert.deepEqual( /*expected*/0xD834, actual[1].charCodeAt(2));
    });
    it('toJSON() instance method', () => {
      class Ghi {
        constructor(v) {
          this._val = v;
        }
        toJSON() {
          return {type: 'JSON', ver: 1, velue: this._val};
        }
      }
      var actual = serialize.toJSONObject(new Ghi(100));
      assert.deepEqual( /*expected*/['Ghi', {type: 'JSON', ver: 1, velue: 100}], actual);
    });
    it('toJSON() class method', () => {
      class Jkl {
        constructor(v) {
          this._val = v;
        }
        static toJSON(obj) {
          return {type: 'JSON', ver: 1, velue: obj._val};
        }
      }
      var actual;
      actual = serialize.toJSONObject(new Jkl(100));
      assert.deepEqual( /*expected*/['Jkl', {_val: 100}], actual);
      actual = serialize.toJSONObject(new Jkl(100), {Jkl});
      assert.deepEqual( /*expected*/['Jkl', {type: 'JSON', ver: 1, velue: 100}], actual);
      actual = serialize.toJSONObject(new Jkl(100), new Map([['Jkl', Jkl]]));
      assert.deepEqual( /*expected*/['Jkl', {type: 'JSON', ver: 1, velue: 100}], actual);
    });
    it('nest', () => {
      class Ghi {
        constructor(v) {
          this._val = v;
        }
        toJSON(clsMap) {
          return {dattyp: 'JSON', vid: 1, velue: serialize.toJSONObject(this._val, clsMap)};
        }
      }

      class Jkl {
        constructor(v) {
          this._val = v;
        }
        static toJSON(obj, clsMap) {
          return {dattyp: 'JSON', vid: 1, velue: serialize.toJSONObject(obj._val, clsMap)};
        }
      }

      class Abc {
        constructor() {
          this.ary = [1, 'a', true, null, {
            aaa: 2,
            bbb: [3, 5],
            ccc: new Ghi(new Ghi(new Jkl(new Jkl(new Ghi(256)))))
          }];
        }
      }

      class Def {
        constructor() {
          this.val = new Abc();
          this.u = void 0;
        }
      }

      var actual = serialize.toJSONObject(new Def(), {Jkl});
      assert.deepEqual( /*expected*/['Def', {
        val: ['Abc', {
          ary: [[1, 'a', true, null, {
            aaa: 2,
            bbb: [[3, 5]],
            ccc: ['Ghi', {
              dattyp: 'JSON',
              vid: 1,
              velue: ['Ghi', {
                dattyp: 'JSON',
                vid: 1,
                velue: ['Jkl', {
                  dattyp: 'JSON',
                  vid: 1,
                  velue: ['Jkl', {
                    dattyp: 'JSON',
                    vid: 1,
                    velue: ['Ghi', {
                      dattyp: 'JSON',
                      vid: 1,
                      velue: 256
                    }]
                  }]
                }]
              }]
            }]
          }]]
        }],
        u: []
      }], actual);
    });
  });
  describe('fromJSONObject', () => {
    it('string', () => {
      var actual = serialize.fromJSONObject('hello');
      assert.strictEqual( /*expected*/'hello', actual);
    });
    it('boolean', () => {
      var actual = serialize.fromJSONObject(false);
      assert.strictEqual( /*expected*/false, actual);
    });
    it('number', () => {
      var actual = serialize.fromJSONObject(10.5);
      assert.strictEqual( /*expected*/10.5, actual);
    });
    it('null', () => {
      var actual = serialize.fromJSONObject(null);
      assert.strictEqual( /*expected*/null, actual);
    });
    it('undefined', () => {
      var actual = serialize.fromJSONObject([]);
      assert.strictEqual( /*expected*/void 0, actual);
      assert.strictEqual( /*expected*/'undefined', typeof actual);
    });
    it('Array', () => {
      var actual = serialize.fromJSONObject([[]]);
      assert.deepEqual( /*expected*/[], actual);
    });
    it('Object', () => {
      var actual = serialize.fromJSONObject({});
      assert.deepEqual( /*expected*/{}, actual);
    });
    it('formJSON class method', () => {
      class ClsA {
        constructor(name, age) {
          this.name = name;
          this.age = age;
        }
        static fromJSON(jsonObj) {
          return new ClsA(jsonObj[0], jsonObj[1]);
        }
      }

      var actual = serialize.fromJSONObject(['ClsA', ['Teto Kasane', 31]], {ClsA});
      assert.deepEqual( /*expected*/new ClsA('Teto Kasane', 31), actual);
    });
    it('formJSON instance method', () => {
      class ClsB {
        constructor(name, age) {
          this.name = name;
          this.age = age;
        }
        fromJSON(jsonObj) {
          this.name = jsonObj[0];
          this.age = jsonObj[1];
        }
      }

      var actual = serialize.fromJSONObject(['ClsB', ['Teto Kasane', 31]], {ClsB});
      assert.deepEqual( /*expected*/new ClsB('Teto Kasane', 31), actual);
    });
    it('Simple class', () => {
      class ClsC {
        constructor(name, age) {
          this.name = name;
          this.age = age;
        }
      }

      var actual = serialize.fromJSONObject(['ClsC', {name:'Teto Kasane', age:31}], {ClsC});
      assert.deepEqual( /*expected*/new ClsC('Teto Kasane', 31), actual);
    });
    it('Simple class from val', () => {
      class ClsD {
        constructor(str) {
          var parts = str.split(/,/);
          this.name = parts[0];
          this.age = parts[1];
        }
      }

      var actual = serialize.fromJSONObject(['ClsD', 'Teto Kasane,31'], {ClsD});
      assert.deepEqual( /*expected*/new ClsD('Teto Kasane,31'), actual);
    });
    it('nest', () => {
      class ClsA {
        constructor(name, age) {
          this.name = name;
          this.age = age;
        }
        static fromJSON(jsonObj, clsMap) {
          return new ClsA(
            serialize.fromJSONObject(jsonObj[0], clsMap),
            serialize.fromJSONObject(jsonObj[1], clsMap)
          );
        }
      }

      class ClsB {
        constructor(name, age) {
          this.name = name;
          this.age = age;
        }
        fromJSON(jsonObj, clsMap) {
          this.name = serialize.fromJSONObject(jsonObj[0], clsMap);
          this.age = serialize.fromJSONObject(jsonObj[1], clsMap);
        }
      }

      class ClsC {
        constructor(name, age) {
          this.name = name;
          this.age = age;
        }
      }

      class ClsD {
        constructor(str) {
          var parts = str.split(/,/);
          this.name = parts[0];
          this.age = parts[1];
        }
      }

      var actual = serialize.fromJSONObject(
        ['ClsB',[
          ['ClsD', 'Teto Kasane,31'],
          ['ClsA',[
            ['ClsC', {
              name:'Kasane Teto',
              age:[[
                'aaa',
                100,
                null,
                [],
                {
                  xxx:[[1, 3, 5]],
                  yyy:{
                    z:'z'
                  }
                }
              ]]
            }],
            {
              'bbb': true,
              'ddd': false
            }
          ]]
        ]], {ClsA, ClsB, ClsC, ClsD});
      assert.deepEqual( /*expected*/
        new ClsB(
          new ClsD('Teto Kasane,31'),
          new ClsA(
            new ClsC(
              'Kasane Teto',
              [
                'aaa',
                100,
                null,
                void 0,
                {
                  xxx:[1, 3, 5],
                  yyy:{
                    z:'z'
                  }
                }
              ]
            ),
            {
              'bbb': true,
              'ddd': false
            }
          )
        ),
        actual);
    })
  });
});
