const path = require('path'); 
const webpack = require('webpack'); 

module.exports = {
    entry : './src/app/app.js',
    output : {
        path: path.resolve(__dirname, 'dist'), 
        filename: 'bundle.js'
    },
    devServer:{
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
            use: ['style-loader','css-loader','sass-loader']
        },
        {
            test: /\.(svg|eot|woff|woff2|ttf)$/,
            use: ['file-loader']
        }
         ]
        },
    plugins: [
            // fix "process is not defined" error:
            // (do "npm install process" before running the build)
            new webpack.ProvidePlugin({
              process: 'process/browser',
            }),
          ]
}