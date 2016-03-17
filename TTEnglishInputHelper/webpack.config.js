module.exports = {
  entry: {
    rendererprocess:'./src/main/rendererprocess/rendererprocess.js',
    mainprocess:'./src/main/mainprocess/mainprocess.js',
  },
  output: {
    path: './built/app/lib/',
    filename: '[name].js'
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};
