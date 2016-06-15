module.exports = {
  entry: {
//    rendererprocess: './src/main/rendererprocess/rendererprocess.js',
    rendererprocess: './src/main/rendererprocess/rendererprocessMain.js',
    mainprocess: './src/main/mainprocess/mainprocess.js',
  },
  externals: /^(?!\.\.?\/)/,
  output: {
    path: './built/app/lib/',
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  target: 'electron',
  node: {
    __dirname: false
  },
  devtool:'#inline-source-map',
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};
