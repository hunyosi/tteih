'use strict';
import * as MsgComm from '../main/common/MsgComm.js';
const assert = require('assert');

describe('MsgComm', function () {
  describe('MsgCommServer', function () {
    it('new MsgCommServer', function () {
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      var actual = 'OK';
      assert.equal( /*expected*/'OK', actual);
    });
    it('getClassInfo empty', function () {
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      var actual = mcs.getClassInfo();
      assert.deepEqual( /*expected*/[], actual);
    });
    it('getClassInfo, constructor object', function () {
      class ClsA {
        constructor(){
          this.count = 0;
        }
        inclement(){
          ++ this.count;
        }
        declement(){
          -- this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs, {ClsA});
      var actual = mcs.getClassInfo();
      assert.deepEqual( /*expected*/[
        ['ClsA', ['inclement', 'declement']]
      ], actual);
    });
    it('constructor Map', function () {
      class ClsA {
        constructor(){
          this.count = 0;
        }
        inclement(){
          ++ this.count;
        }
        declement(){
          -- this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs, new Map([['ClsAX', ClsA]]));
      var actual = mcs.getClassInfo();
      assert.deepEqual( /*expected*/[
        ['ClsAX', ['inclement', 'declement']]
      ], actual);
    });
    it('constructor Array', function () {
      class ClsA {
        constructor(){
          this.count = 0;
        }
        inclement(){
          ++ this.count;
        }
        declement(){
          -- this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs, [ClsA]);
      var actual = mcs.getClassInfo();
      assert.deepEqual( /*expected*/[
        ['ClsA', ['inclement', 'declement']]
      ], actual);
    });
    it('addClass', function () {
      class ClsA {
        constructor(){
          this.count = 0;
        }
        inclement(){
          ++ this.count;
        }
        declement(){
          -- this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      mcs.addClass(ClsA);
      var actual = mcs.getClassInfo();
      assert.deepEqual( /*expected*/[
        ['ClsA', ['inclement', 'declement']]
      ], actual);
    });
    it('addClassWithName', function () {
      class ClsA {
        constructor(){
          this.count = 0;
        }
        inclement(){
          ++ this.count;
        }
        declement(){
          -- this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      mcs.addClassWithName('Abc', ClsA);
      var actual = mcs.getClassInfo();
      assert.deepEqual( /*expected*/[
        ['Abc', ['inclement', 'declement']]
      ], actual);
    });
    it('createInstance', function () {
      class ClsA {
      }
      class ClsB {
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs, {ClsA, ClsB});
      var actual;
      actual = mcs.createInstance('ClsA');
      assert.strictEqual( /*expected*/1, actual);
      actual = mcs.createInstance('ClsA');
      assert.strictEqual( /*expected*/2, actual);
      actual = mcs.createInstance('ClsB');
      assert.strictEqual( /*expected*/1, actual);
      actual = mcs.createInstance('ClsA');
      assert.strictEqual( /*expected*/3, actual);
      actual = mcs.createInstance('ClsB');
      assert.strictEqual( /*expected*/2, actual);
    });
  });
});
