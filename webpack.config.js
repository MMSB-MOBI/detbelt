const path = require('path'); 
const webpack = require('webpack'); 

module.exports = {
    entry : './app.js',
    output : {
        path: path.resolve(__dirname, 'dist'), 
        filename: 'bundle.js'
    },
    devServer:{
        contentBase: './web/html'
    },
    module: {
        rules: [
          {
           test: /\.css$/,
           use: ['style-loader', 'css-loader']
          },
          {
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
          },
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