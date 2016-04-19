'use strict';
const fileUtil = require('./fileUtil.js');

const builtTestDir = './built/test';

(new fileUtil.File(builtTestDir)).remove();
