'use strict';

const assert = require('assert');

describe('hello_test', function () {
  describe('hello', function () {
    it('hello, mocha', function () {
      const actual = 'hello mocha';
      assert.equal( /*expected*/'hello mocha', actual);
    });
  });
});
