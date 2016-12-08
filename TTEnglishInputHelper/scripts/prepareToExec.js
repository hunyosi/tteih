'use strict';
const fileUtil = require('./fileUtil.js');
fileUtil.setGlobalBasePath(__dirname);
fileUtil.syncFiles('resources/sample', 'built/sample', null, null);
