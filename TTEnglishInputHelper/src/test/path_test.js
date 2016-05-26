'use strict';

import * as path from '../main/common/path.js';

const assert = require('assert');

describe('path', function() {
  describe('RouteElement', function() {
    describe('constructor', function() {
      it('default', function() {
        const actual = new path.RouteElement();
        assert.equal( /*expected*/true, true);
      });
    });
  });
  describe('Path', function() {
    describe('constructor', function() {
      it('default', function() {
        const actual = new path.Path();
        assert.equal( /*expected*/true, true);
      });
    });
  });
});
