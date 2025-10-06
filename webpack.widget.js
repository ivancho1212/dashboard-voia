const path = require('path');

module.exports = {
  entry: './src/widget/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'widget.js',
    library: {
      name: 'ViaWidget',
      type: 'umd',
    },
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
}