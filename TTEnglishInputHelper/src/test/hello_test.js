'use strict';

var assert = require('assert');

describe('hello_test', function () {
  describe('hello', function () {
    it('hello, mocha', function () {
      var actual = 'hello mocha';
      assert.equal( /*expected*/'hello mocha', actual);
    });
  });
});
