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
    it('invokeMethod', function(){
      class ClsA {
        constructor(){
          this.count = 0;
        }
        add(val){
          this.count += val;
        }
        getCount(){
         return this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      mcs.addClassWithName('Abc', ClsA);
      const objId = mcs.createInstance('Abc');
      const objId2 = mcs.createInstance('Abc');
      var actual;
      actual = mcs.invokeMethod('Abc', objId2, 'add', [4]);
      assert.strictEqual(/*expected*/void 0, actual);
      actual = mcs.invokeMethod('Abc', objId2, 'getCount', []);
      assert.strictEqual(/*expected*/4, actual);
      actual = mcs.invokeMethod('Abc', objId, 'getCount', []);
      assert.strictEqual(/*expected*/0, actual);
      actual = mcs.invokeMethod('Abc', objId, 'add', [3]);
      assert.strictEqual(/*expected*/void 0, actual);
      actual = mcs.invokeMethod('Abc', objId, 'getCount', []);
      assert.strictEqual(/*expected*/3, actual);
      actual = mcs.invokeMethod('Abc', objId2, 'add', [2]);
      assert.strictEqual(/*expected*/void 0, actual);
      actual = mcs.invokeMethod('Abc', objId2, 'getCount', []);
      assert.strictEqual(/*expected*/6, actual);
      actual = mcs.invokeMethod('Abc', objId, 'add', [1]);
      assert.strictEqual(/*expected*/void 0, actual);
      actual = mcs.invokeMethod('Abc', objId, 'getCount', []);
      assert.strictEqual(/*expected*/4, actual);
    });
    it('dispatchMessage', function(){
      class ClsA {
        constructor(){
          this.count = 0;
        }
        add(val){
          this.count += val;
        }
        getCount(){
         return this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      mcs.addClassWithName('Abc', ClsA);

      var actual;

      actual = mcs.dispatchMessage('clsinfo');
      assert.deepEqual(/*expected*/[
        ['Abc', ['add', 'getCount']]
      ], actual);

      const objId = mcs.dispatchMessage('new', {cls:'Abc'});
      actual = objId;
      assert.strictEqual(/*expected*/1, actual);
      const objId2 = mcs.dispatchMessage('new', {cls:'Abc'});
      actual = objId2;
      assert.strictEqual(/*expected*/2, actual);

      actual = mcs.dispatchMessage('invoke', {cls:'Abc', seqNo:objId, method:'add', params:[3]});
      assert.strictEqual(/*expected*/void 0, actual);
      actual = mcs.dispatchMessage('invoke', {cls:'Abc', seqNo:objId, method:'getCount', params:[]});
      assert.strictEqual(/*expected*/3, actual);
      actual = mcs.dispatchMessage('invoke', {cls:'Abc', seqNo:objId2, method:'add', params:[1]});
      assert.strictEqual(/*expected*/void 0, actual);
      actual = mcs.dispatchMessage('invoke', {cls:'Abc', seqNo:objId2, method:'getCount', params:[]});
      assert.strictEqual(/*expected*/1, actual);
      actual = mcs.dispatchMessage('invoke', {cls:'Abc', seqNo:objId, method:'add', params:[2]});
      assert.strictEqual(/*expected*/void 0, actual);
      actual = mcs.dispatchMessage('invoke', {cls:'Abc', seqNo:objId, method:'getCount', params:[]});
      assert.strictEqual(/*expected*/5, actual);
    });
    it('onReceiveMessage clsinfo', function(){
      class ClsA {
        constructor(){
          this.count = 0;
        }
        add(val){
          this.count += val;
        }
        getCount(){
         return this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      mcs.addClassWithName('Abc', ClsA);

      cs.onResponse = (actual) => {
        assert.deepEqual(/*expected*/{
          id:1,
          msg:'clsinfo',
          ok:true,
          data:[[[['Abc', [['add', 'getCount']]]]]]
        }, JSON.parse(actual));
      };
      mcs.onReceiveMessage({}, '{"id":1,"msg":"clsinfo"}');
    });
    it('onReceiveMessage new', function(){
      class ClsA {
        constructor(){
          this.count = 0;
        }
        add(val){
          this.count += val;
        }
        getCount(){
         return this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      mcs.addClassWithName('Abc', ClsA);

      cs.onResponse = (actual) => {
        assert.deepEqual(/*expected*/{
          id:1,
          msg:'new',
          ok:true,
          data:1
        }, JSON.parse(actual));
      };
      mcs.onReceiveMessage({}, '{"id":1, "msg":"new", "data":{"cls":"Abc"}}');

    });
    it('onReceiveMessage invoke', function(){
      class ClsA {
        constructor(){
          this.count = 0;
        }
        add(val){
          this.count += val;
        }
        getCount(){
         return this.count;
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      mcs.addClassWithName('Abc', ClsA);

      let objId;

      cs.onResponse = (msgStr) => {
        objId = JSON.parse(msgStr).data;
      };
      mcs.onReceiveMessage({}, '{"id":1, "msg":"new", "data":{"cls":"Abc"}}');

      cs.onResponse = (actual) => {
        assert.deepEqual(/*expected*/{
          id:2,
          msg:'invoke',
          ok:true,
          data:0
        }, JSON.parse(actual));
      };
      mcs.onReceiveMessage({}, `{"id":2, "msg":"invoke", "data":{"cls":"Abc", "seqNo":${objId}, "method":"getCount", "params":[]}}`);

      cs.onResponse = (actual) => {
        assert.deepEqual(/*expected*/{
          id:3,
          msg:'invoke',
          ok:true,
          data:[]
        }, JSON.parse(actual));
      };
      mcs.onReceiveMessage({}, `{"id":3, "msg":"invoke", "data":{"cls":"Abc", "seqNo":${objId}, "method":"add", "params":[[7]]}}`);

      cs.onResponse = (actual) => {
        assert.deepEqual(/*expected*/{
          id:4,
          msg:'invoke',
          ok:true,
          data:7
        }, JSON.parse(actual));
      };
      mcs.onReceiveMessage({}, `{"id":4, "msg":"invoke", "data":{"cls":"Abc", "seqNo":${objId}, "method":"getCount", "params":[]}}`);
    });
    it('onReceiveMessage invoke promise', function(){
      class ClsA {
        constructor(){
          this.count = 0;
        }
        add(val){
          this.count += val;
        }
        getCount(){
          return new Promise((resolve, reject)=>{
            setTimeout(()=>resolve(this.count), 0);
          });
        }
      }
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      mcs.addClassWithName('Abc', ClsA);

      return new Promise((resolve)=>{
        let objId;

        cs.onResponse = (msgStr) => {
          objId = JSON.parse(msgStr).data;
        };
        mcs.onReceiveMessage({}, '{"id":1, "msg":"new", "data":{"cls":"Abc"}}');

        cs.onResponse = (actual) => {
          assert.deepEqual(/*expected*/{
            id:2,
            msg:'invoke',
            ok:true,
            data:0
          }, JSON.parse(actual));

          cs.onResponse = (actual) => {
            assert.deepEqual(/*expected*/{
              id:3,
              msg:'invoke',
              ok:true,
              data:[]
            }, JSON.parse(actual));

            cs.onResponse = (actual) => {
              assert.deepEqual(/*expected*/{
                id:4,
                msg:'invoke',
                ok:true,
                data:7
              }, JSON.parse(actual));

              resolve();
            };
            mcs.onReceiveMessage({}, `{"id":4, "msg":"invoke", "data":{"cls":"Abc", "seqNo":${objId}, "method":"getCount", "params":[]}}`);

          };
          mcs.onReceiveMessage({}, `{"id":3, "msg":"invoke", "data":{"cls":"Abc", "seqNo":${objId}, "method":"add", "params":[[7]]}}`);

        };
        mcs.onReceiveMessage({}, `{"id":2, "msg":"invoke", "data":{"cls":"Abc", "seqNo":${objId}, "method":"getCount", "params":[]}}`);
      });
    });
  });
  describe('MsgCommClient', function () {
    it('new MsgCommClient', function () {
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommClient(cs);
      var actual = 'OK';
      assert.equal( /*expected*/'OK', actual);
    });
  });
});
