'use strict';

import * as path from '../main/common/path.js';

const assert = require('assert');

describe('path', function() {
  describe('RouteElement', function() {
    describe('constructor', function() {
      it('default', function() {
        const actual = new path.RouteElement({});
        assert.strictEqual( /*expected*/path.RouteElement, actual.constructor);
      });
    });
  });
  describe('Path', function() {
    describe('constructor', function() {
      it('default', function() {
        const actual = new path.Path({});
        assert.strictEqual( /*expected*/path.Path, actual.constructor);
      });
    });
  });
});
