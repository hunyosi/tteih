'use strict';
import * as MsgComm from '../main/common/MsgComm.js';
const assert = require('assert');

describe('MsgComm', function () {
  describe('MsgCommServer', function () {
    it('hello MsgCommServer', function () {
      const cs = new MsgComm.CommunicatorStub();
      const mcs = new MsgComm.MsgCommServer(cs);
      var actual = 'hello mocha';
      assert.equal( /*expected*/'hello mocha', actual);
    });
  });
});
