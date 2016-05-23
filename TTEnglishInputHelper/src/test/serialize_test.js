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
      const ary = new Uint8Array(obj);
      ary[0] = 0x78;
      ary[1] = 0x9A;
      ary[2] = 0xB1;
      ary[3] = 0x23;
      // 0111 1000  1001 1010  1011 0001     0010 0011
      // 011 110  001 001  101 010  110 001  001 000  11- ---
      var actual = serialize.toJSONObject(obj);
      assert.deepEqual( /*expected*/['ArrayBuffer', 'eJqxIw=='], actual);
    });
    it('Uint8Array', () => {
      const obj = new ArrayBuffer(4);
      const ary = new Uint8Array(obj);
      ary[0] = 0x78;
      ary[1] = 0x9A;
      ary[2] = 0xB1;
      ary[3] = 0x23;
      // 0111 1000  1001 1010  1011 0001     0010 0011
      // 011 110  001 001  101 010  110 001  001 000  11- ---
      var actual = serialize.toJSONObject(ary);
      assert.deepEqual( /*expected*/['Uint8Array', 'eJqxIw=='], actual);
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
    // it('ArrayBuffer (Uint16Array)', () => {
    //   const obj = ['Uint16Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0x0041,
    //     0x0042
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Uint16Array, actual.constructor);
    //   assert.strictEqual( /*expected*/2, actual.length);
    //   assert.strictEqual( /*expected*/0x0041, actual[0]);
    //   assert.strictEqual( /*expected*/0x0042, actual[1]);
    // });
    // it('ArrayBuffer (Uint16Array) illegal surrogate pair', () => {
    //   const obj = ['Uint16Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834,
    //     0xFFFE
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Uint16Array, actual.constructor);
    //   assert.strictEqual( /*expected*/3, actual.length);
    //   assert.strictEqual( /*expected*/0xDC12, actual[0]);
    //   assert.strictEqual( /*expected*/0xD834, actual[1]);
    //   assert.strictEqual( /*expected*/0xFFFE, actual[2]);
    // });
    // it('ArrayBuffer', () => {
    //   const obj = ['ArrayBuffer', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/ArrayBuffer, actual.constructor);
    // });
    // it('ArrayBuffer (Uint8Array)', () => {
    //   const obj = ['Uint8Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Uint8Array, actual.constructor);
    // });
    // it('ArrayBuffer (Uint8ClampedArray)', () => {
    //   const obj = ['Uint8ClampedArray', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Uint8ClampedArray, actual.constructor);
    // });
    // it('ArrayBuffer Int8Array)', () => {
    //   const obj = ['Int8Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Int8Array, actual.constructor);
    // });
    // it('ArrayBuffer Int16Array)', () => {
    //   const obj = ['Int16Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Int16Array, actual.constructor);
    // });
    // it('ArrayBuffer Uint32Array)', () => {
    //   const obj = ['Uint32Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Uint32Array, actual.constructor);
    // });
    // it('ArrayBuffer Int32Array)', () => {
    //   const obj = ['Int32Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Int32Array, actual.constructor);
    // });
    // it('ArrayBuffer Float32Array)', () => {
    //   const obj = ['Float32Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Float32Array, actual.constructor);
    // });
    // it('ArrayBuffer Float64Array)', () => {
    //   const obj = ['Float64Array', String.fromCharCode(
    //     (utils.isLittleEndian() ? 0xF202 : 0x02F2),
    //     0xDC12,
    //     0xD834,
    //     1, 2
    //   )];
    //   var actual = serialize.fromJSONObject(obj);
    //   assert.strictEqual( /*expected*/Float64Array, actual.constructor);
    // });
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
//   describe('serialize', () => {
//     it('Uint16Array', () => {
//       var obj = new Uint16Array(3);
//       obj[0] = 0xFFFE;
//       obj[1] = 0xDC12;
//       obj[2] = 0xD834;
//       var actual = serialize.serialize(obj);
//       var expected = '["Uint16Array","' + String.fromCharCode(
//         (utils.isLittleEndian() ? 0xF202 : 0x02F2),
//         0xFFFE,
//         0xDC12,
//         0xD834
//       ); + '"]'
//       console.log(serialize.toJSONObject(obj));
//       console.log(actual);
//       console.log(expected);
//       assert.strictEqual(expected, actual);
//     });
//   });
//   describe('deserialize', () => {
//     it('Uint16Array', () => {
//       var src = '["Uint16Array","' + String.fromCharCode(
//         (utils.isLittleEndian() ? 0xF202 : 0x02F2),
//         0xFFFE,
//         0xDC12,
//         0xD834
//       ); + '"]'
//       var actual = serialize.deserialize(src);
// //      assert.strictEqual(Uint16Array, actual.constructor);
//       assert.strictEqual(0xFFFE, actual[0]);
//       assert.strictEqual(0xDC12, actual[1]);
//       assert.strictEqual(0xD834, actual[2]);
//     });
//   });
});
