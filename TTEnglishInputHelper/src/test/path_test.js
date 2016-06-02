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
  describe('parseUnixPath', function() {
    it('absolute path', function() {
      const actual = path.parseUnixPath('/a/b/c');
      assert.strictEqual( /*expected*/path.Path, actual.constructor);
      assert.strictEqual( /*expected*/true, actual.isAbsolute);
      assert.deepEqual( /*expected*/[
        {name:'a', isParent:false, isCurrent:false},
        {name:'b', isParent:false, isCurrent:false},
        {name:'c', isParent:false, isCurrent:false},
      ], actual.route);
    });
    it('relative path', function() {
      const actual = path.parseUnixPath('a/b/c');
      assert.strictEqual( /*expected*/path.Path, actual.constructor);
      assert.strictEqual( /*expected*/false, actual.isAbsolute);
      assert.deepEqual( /*expected*/[
        {name:'a', isParent:false, isCurrent:false},
        {name:'b', isParent:false, isCurrent:false},
        {name:'c', isParent:false, isCurrent:false},
      ], actual.route);
    });
  });
  describe('buildUnixPath', function() {
    it('absolute path', function() {
      const pathObj = new path.Path({
        route:[
          new path.RouteElement({name:'aaa'}),
          new path.RouteElement({name:'bbb'}),
          new path.RouteElement({name:'ccc'}),
        ],
        isAbsolute:true,
      });
      assert.strictEqual( /*expected*/'/aaa/bbb/ccc', path.buildUnixPath(pathObj));
    });
    it('relative path', function() {
      const pathObj = new path.Path({
        route:[
          new path.RouteElement({name:'aaa'}),
          new path.RouteElement({name:'bbb'}),
          new path.RouteElement({name:'ccc'}),
        ],
        isAbsolute:false,
      });
      assert.strictEqual( /*expected*/'aaa/bbb/ccc', path.buildUnixPath(pathObj));
    });
  });
  describe('parseWindowsPath', function() {
    it('absolute path', function() {
      const actual = path.parseWindowsPath('C:\\a\\b\\c');
      assert.strictEqual( /*expected*/path.Path, actual.constructor);
      assert.strictEqual( /*expected*/true, actual.isAbsolute);
      assert.deepEqual( /*expected*/[
        {name:'a', isParent:false, isCurrent:false},
        {name:'b', isParent:false, isCurrent:false},
        {name:'c', isParent:false, isCurrent:false},
      ], actual.route);
      assert.strictEqual( /*expected*/'C', actual.drive);
    });
    it('relative path', function() {
      const actual = path.parseWindowsPath('a\\b\\c');
      assert.strictEqual( /*expected*/path.Path, actual.constructor);
      assert.strictEqual( /*expected*/false, actual.isAbsolute);
      assert.deepEqual( /*expected*/[
        {name:'a', isParent:false, isCurrent:false},
        {name:'b', isParent:false, isCurrent:false},
        {name:'c', isParent:false, isCurrent:false},
      ], actual.route);
      assert.strictEqual( /*expected*/null, actual.drive);
    });
  });
  describe('buildWindowsPath', function() {
    it('absolute path', function() {
      const pathObj = new path.Path({
        route:[
          new path.RouteElement({name:'aaa'}),
          new path.RouteElement({name:'bbb'}),
          new path.RouteElement({name:'ccc'}),
        ],
        isAbsolute:true,
        drive:'c',
      });
      assert.strictEqual( /*expected*/'c:\\aaa\\bbb\\ccc', path.buildWindowsPath(pathObj));
    });
    it('relative path', function() {
      const pathObj = new path.Path({
        route:[
          new path.RouteElement({name:'aaa'}),
          new path.RouteElement({name:'bbb'}),
          new path.RouteElement({name:'ccc'}),
        ],
        isAbsolute:false,
      });
      assert.strictEqual( /*expected*/'aaa\\bbb\\ccc', path.buildWindowsPath(pathObj));
    });
  });
});
