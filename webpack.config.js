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
    module: {
        rules: [
          {
           test: /\.css$/,
           use: ['style-loader', 'css-loader']
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