module.exports = {
  entry: './src/utagawasan.js',
  output: {
    path: './built/app/lib/',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};
