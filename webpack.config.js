var webpack = require('webpack');

var definePlugin = new webpack.DefinePlugin({
  __DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || 'true')),
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
          { test: /\.jsx$/, loaders: ['react-hot', 'babel'], exclude: /node_modules/ },
          { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
          { test: /\.css$/, loader: "style!css" }
      ]
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    definePlugin,
  ],

};
