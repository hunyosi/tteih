'use strict';

import * as utils from '../main/common/utils.js';

const assert = require('assert');

describe('utils', function() {
  describe('Base64', function() {
    describe('static encode', function() {
      it('3 bytes', function() {
        const ary = new Uint8Array(3);
        ary[0] = 0x12;
        ary[1] = 0x34;
        ary[2] = 0x56;
        // 0001 0010  0011 0100  0101 0110
        // 0001 00  10 0011  0100 01  01 0110
        // 000 100  100 011  010 001  010 110
        const actual = utils.Base64.encode(ary);
        assert.strictEqual( /*expected*/ 'EjRW', actual);
      });
      it('2 bytes', function() {
        const ary = new Uint8Array(2);
        ary[0] = 0x12;
        ary[1] = 0x34;
        // 0001 0010  0011 0100
        // 0001 00  10 0011  0100 --
        // 000 100  100 011  010 000
        const actual = utils.Base64.encode(ary);
        assert.strictEqual( /*expected*/ 'EjQ=', actual);
      });
      it('1 byte', function() {
        const ary = new Uint8Array(1);
        ary[0] = 0x12;
        // 0001 0010
        // 0001 00  10 ----
        // 000 100  100 000
        const actual = utils.Base64.encode(ary);
        assert.strictEqual( /*expected*/ 'Eg==', actual);
      });
      it('6 bytes', function() {
        const ary = new Uint8Array(6);
        ary[0] = 0xAB;
        ary[1] = 0xCD;
        ary[2] = 0xEF;
        ary[3] = 0x12;
        ary[4] = 0x34;
        ary[5] = 0x56;
        // 1010 1011  1100 1101  1110 1111     0001 0010  0011 0100  0101 0110
        // 1010 10  11 1100  1101 11  10 1111  0001 00  10 0011  0100 01  01 0110
        // 101 010  111 100  110 111  101 111  000 100  100 011  010 001  010 110
        const actual = utils.Base64.encode(ary);
        assert.strictEqual( /*expected*/ 'q83vEjRW', actual);
      });
      it('5 bytes', function() {
        const ary = new Uint8Array(5);
        ary[0] = 0xAB;
        ary[1] = 0xCD;
        ary[2] = 0xEF;
        ary[3] = 0x12;
        ary[4] = 0x34;
        // 0001 0010  0011 0100
        // 0001 00  10 0011  0100 --
        // 000 100  100 011  010 000
        const actual = utils.Base64.encode(ary);
        assert.strictEqual( /*expected*/ 'q83vEjQ=', actual);
      });
      it('4 byte', function() {
        const ary = new Uint8Array(4);
        ary[0] = 0xAB;
        ary[1] = 0xCD;
        ary[2] = 0xEF;
        ary[3] = 0x12;
        // 0001 0010
        // 0001 00  10 ----
        // 000 100  100 000
        const actual = utils.Base64.encode(ary);
        assert.strictEqual( /*expected*/ 'q83vEg==', actual);
      });
    });
    describe('sratic decode', function() {
      it('3 bytes', function() {
        const ary = new Uint8Array(3);
        ary[0] = 0x12;
        ary[1] = 0x34;
        ary[2] = 0x56;
        // 0001 0010  0011 0100  0101 0110
        // 0001 00  10 0011  0100 01  01 0110
        // 000 100  100 011  010 001  010 110
        const actual = utils.Base64.decode('EjRW');
        assert.strictEqual( /*expected*/ ArrayBuffer, actual.constructor);
        assert.deepEqual( /*expected*/ ary, new Uint8Array(actual));
      });
    });
  });
  describe('arrayBufferToString', function() {
    it('even byte length without header', function() {
      const aryBuf = new ArrayBuffer(4);
      const u8Ary = new Uint8Array(aryBuf);
      u8Ary[0] = 0x10;
      u8Ary[1] = 0x02;
      u8Ary[2] = 0x34;
      u8Ary[3] = 0x56;
      const actual = utils.arrayBufferToString(u8Ary.buffer, false);
      if (utils.isLittleEndian()) {
        assert.strictEqual( /*expected*/ '\u0210\u5634', actual);
      } else {
        assert.strictEqual( /*expected*/ '\u1002\u3456', actual);
      }
    });
    it('odd byte length without header', function() {
      const aryBuf = new ArrayBuffer(5);
      const u8Ary = new Uint8Array(aryBuf);
      u8Ary[0] = 0x10;
      u8Ary[1] = 0x02;
      u8Ary[2] = 0x34;
      u8Ary[3] = 0x56;
      u8Ary[4] = 0x78;
      const actual = utils.arrayBufferToString(u8Ary.buffer, false);
      if (utils.isLittleEndian()) {
        assert.strictEqual( /*expected*/ '\u0210\u5634\u0078', actual);
      } else {
        assert.strictEqual( /*expected*/ '\u1002\u3456\u0078', actual);
      }
    });
    it('even byte length with header', function() {
      const aryBuf = new ArrayBuffer(4);
      const u8Ary = new Uint8Array(aryBuf);
      u8Ary[0] = 0x10;
      u8Ary[1] = 0x02;
      u8Ary[2] = 0x34;
      u8Ary[3] = 0x56;
      const actual = utils.arrayBufferToString(u8Ary.buffer, true);
      if (utils.isLittleEndian()) {
        assert.strictEqual( /*expected*/ '\uF202\u0210\u5634', actual);
      } else {
        assert.strictEqual( /*expected*/ '\u02F2\u1002\u3456', actual);
      }
    });
    it('odd byte length with header', function() {
      const aryBuf = new ArrayBuffer(5);
      const u8Ary = new Uint8Array(aryBuf);
      u8Ary[0] = 0x10;
      u8Ary[1] = 0x02;
      u8Ary[2] = 0x34;
      u8Ary[3] = 0x56;
      u8Ary[4] = 0x78;
      const actual = utils.arrayBufferToString(u8Ary.buffer, true);
      if (utils.isLittleEndian()) {
        assert.strictEqual( /*expected*/ '\uF101\u0210\u5634\u0078', actual);
      } else {
        assert.strictEqual( /*expected*/ '\u01F1\u1002\u3456\u0078', actual);
      }
    });
  });
  describe('stringToArrayBuffer', function() {
    it('even byte length without header', function() {
      const expected = new Uint16Array(2);
      expected[0] = 0x0210;
      expected[1] = 0x5634;

      const aryBuf = utils.stringToArrayBuffer('\u0210\u5634', false);
      const actual = new Uint16Array(aryBuf);

      assert.deepEqual(expected, actual);
    });
    it('odd byte length without header', function() {
      const expected = new Uint8Array(5);
      expected[0] = 0x10;
      expected[1] = 0x02;
      expected[2] = 0x34;
      expected[3] = 0x56;
      expected[4] = 0x78;

      var str = utils.isLittleEndian() ? '\u0210\u5634\u0078' : '\u1002\u3456\u0078';

      const aryBuf = utils.stringToArrayBuffer(str, false, 0, 5);
      const actual = new Uint8Array(aryBuf);

      assert.deepEqual(expected, actual);
    });
    it('even byte length with header', function() {
      const expected = new Uint16Array(2);
      expected[0] = 0x0210;
      expected[1] = 0x5634;

      const aryBuf = utils.stringToArrayBuffer('\uF202\u0210\u5634', true);
      const actual = new Uint16Array(aryBuf);
      assert.deepEqual(expected, actual);

      const aryBuf2 = utils.stringToArrayBuffer('\u02F2\u1002\u3456', true);
      const actual2 = new Uint16Array(aryBuf2);
      assert.deepEqual(expected, actual2);
    });
    it('odd byte length with header', function() {
      const expected = new Uint8Array(5);
      expected[0] = 0x10;
      expected[1] = 0x02;
      expected[2] = 0x34;
      expected[3] = 0x56;
      expected[4] = 0x78;

      const aryBuf = utils.stringToArrayBuffer('\uF101\u0210\u5634\u0078', true);
      const actual = new Uint8Array(aryBuf);
      assert.deepEqual(expected, actual);

      const aryBuf2 = utils.stringToArrayBuffer('\u01F1\u1002\u3456\u0078', true);
      const actual2 = new Uint8Array(aryBuf2);
      assert.deepEqual(expected, actual2);
    });
  });
  describe('getName', function() {
    it('get class name', function() {
      class AbcCls {}
      var actual = utils.getName(AbcCls);
      assert.strictEqual( /*expected*/ 'AbcCls', actual);
    });
  });
  describe('getType', function() {
    it('get class name', function() {
      class AbcCls {}
      var actual = utils.getType(new AbcCls());
      assert.strictEqual( /*expected*/ 'AbcCls', actual);
    });
  });
});
