const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpack = require("webpack");

module.exports = {
    mode: 'development',
    entry: {

        entry: './src/v-dom.js',
        // Runtime code for hot module replacement


    },
    devtool: 'inline-source-map',
    devServer: {
        static: './dist',

        // Dev server client for web socket transport, hot and live reload logic
        historyApiFallback: true,
        // contentBase: paths.build,


        compress: true,

        port: 9000,
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './src/index.html' }),

        // Plugin for hot module replacement

        new webpack.HotModuleReplacementPlugin(),
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),

    },
    module: {
        rules: [
            {
                test: /\.(?:js|mjs|cjs)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', { targets: "defaults" }],
                            ['@babel/preset-react']
                        ],
                        plugins: ['@babel/plugin-proposal-class-properties']
                    }
                }
            }
        ]
    }
};