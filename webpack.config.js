const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: './src/app/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: './src'
  },
  resolve: {
    alias: {
      searchbar: 'advanced-searchbar/dist/advanced-searchbar.js'
    }
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss|css)$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(svg|eot|woff|woff2|ttf)$/,
        use: ['file-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "src/assets/img",
          to: "img/[name][ext]",
        },
        {
          from: "src/index.html",
          to: "[name][ext]",
        },
        {
          from: "src/app/ngl-master/dist/",
          to: "ngl/[name][ext]",
        },
        {
          from: "node_modules/advanced-searchbar/dist",
          to: "stencil/advanced-searchbar[name][ext]",
        },
        
        /*{
          from: "src/assets/img",
          to: "dist/img",
        },*/
      ]
    }),
    // fix "process is not defined" error:
    // (do "npm install process" before running the build)
  new webpack.ProvidePlugin({
      process: 'process/browser',
    }),

  ]
}