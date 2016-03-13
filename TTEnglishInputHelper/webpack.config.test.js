'use strict';
const fs = require('fs');
const path = require('path');

function testEntries(dirPath, filterRegExp) {
  const entries = {};
  const fileNames = fs.readdirSync(dirPath)
  .filter((fileName)=>filterRegExp.test(fileName));
  for (const fileName of fileNames) {
    const filePath = path.join(dirPath, fileName);
    if (fs.statSync(filePath).isFile()) {
      const name = path.parse(filePath).name;
      const unixTypePath = filePath.replace(/\\/g, '/');
      entries[name] = path.isAbsolute(unixTypePath) ? unixTypePath : './' + unixTypePath;
    }
  }
  return entries;
}

module.exports = {
  entry: testEntries('./src/test/', /_test\.js$/),
  output: {
    path: './built/test',
    filename: '[name].js'
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};
