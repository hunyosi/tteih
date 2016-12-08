'use strict';
const fileUtil = require('./fileUtil.js');
fileUtil.setGlobalBasePath(__dirname);
fileUtil.syncFiles('app', 'built/app', null, 'built/app/lib');
