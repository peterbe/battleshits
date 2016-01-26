var webpack = require('webpack');

var path = require('path');
var node_modules_dir = path.resolve(__dirname, 'node_modules');

var definePlugin = new webpack.DefinePlugin({
  __DEV__: false,
  __API_HOST__: '',
});

module.exports = {
  entry: path.resolve(__dirname, 'src/js/app.jsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,

      // There is not need to run the loader through
      // vendors
      exclude: [node_modules_dir],
      loader: 'babel'
    }]
  },
  plugins: [
    definePlugin,
  ]
};
