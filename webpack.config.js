const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
const miniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  entry: {
    app: [path.join(__dirname, 'src', 'index.js'), 
      path.join(__dirname, 'src', 'index.sass')],
  },
  watch: true,
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: "bundle.js",
    chunkFilename: '[id].bundle.js',
  },
  module: {
    rules: [{
      test: /\.jsx?$/,
      include: [
        path.resolve(__dirname, 'src')
      ],
      exclude: [
        path.resolve(__dirname, 'node_modules')
      ],
      loader: 'babel-loader',
      query: {
        presets: [
          ["@babel/env", {
            "targets": {
              "browsers": "last 2 chrome versions"
            }
          }]
        ]
      }
    }, {
      test: /\.html?$/,
      include: [
        path.resolve(__dirname, 'src')
      ],
      loader: 'html-loader',
    }, {
      test: /\.s[ac]ss$/,
      include: [
        path.resolve(__dirname, 'src')
      ],
      loader: [
        'style-loader',
        'css-loader',
        'sass-loader',
      ]
    }]
  },

  plugins: [
    new htmlWebpackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    }),
    new miniCssExtractPlugin({
      filename: '[name].css',
    })
  ],
  
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.sass']
  },

  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, '/dist/'),
    inline: true,
    host: 'localhost',
    port: 8080,
  }
};