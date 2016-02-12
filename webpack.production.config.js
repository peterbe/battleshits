var webpack = require('webpack');

var path = require('path');
var node_modules_dir = path.resolve(__dirname, 'node_modules');

var definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(false),
  __API_HOST__: JSON.stringify(null),
});

module.exports = {
  entry: path.resolve(__dirname, 'src/js/app.jsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        // There is not need to run the loader through
        // vendors
        // exclude: [node_modules_dir],
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015', 'react']
        }
      },
    ]
  },
  plugins: [
    definePlugin,
  ]
};
