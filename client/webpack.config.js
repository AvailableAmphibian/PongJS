const path = require('path');
const webpack = require('webpack');

const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PRODUCTION = false;

module.exports = {
    entry: path.resolve(__dirname, './src/scripts/pong.js'),

    output: {
        path: path.resolve(__dirname, '../server/public/c-dist'),
        filename: 'scripts/pong.bundle.js',
        clean: true
    },

    mode :  (PRODUCTION ? 'production' : 'development'),
    devtool : (PRODUCTION ? undefined : 'eval-source-map'),

    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg|gif)/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name : '[name].[ext]',
                            outputPath : 'images'
                        }
                    }
                ]
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            filename: "./index.html",
            hash: true,
        }),
        new CopyPlugin({
            patterns: [
                {
                 context: path.resolve(__dirname, "src", "html"),
                from: "**/*.html",
                globOptions: { },
                  noErrorOnMissing: true,
                to:  'html'
                },
                 {
                   from: 'src/images/*',
                   to:  'images/[name][ext]',
               noErrorOnMissing: true,
                 },

                {
                    from: 'src/style/*',
                    to:  'style/[name][ext]',
                    noErrorOnMissing: true,
                },
            ]
        })
    ]
}
