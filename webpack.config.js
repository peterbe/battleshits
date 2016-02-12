var webpack = require('webpack');

var definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true')),
  __API_HOST__: JSON.stringify(process.env.API_HOST || ''),
});

module.exports = {
  entry: [
    'webpack/hot/only-dev-server',
    './src/js/app.jsx',

  ],
  output: {
      path: __dirname + '/build',
      filename: "bundle.js"
  },
  module: {
      loaders: [
          {
            test: /\.jsx$/,
            loader: 'babel',
            exclude: /node_modules/,
            query: {
              cacheDirectory: true,
              presets: ['es2015', 'react']
            }
          },
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
              cacheDirectory: true,
              presets: ['es2015']
            }
          },
          {
            test: /\.css$/,
            loader: "style!css"
          }
      ]
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    definePlugin,
  ],

};
