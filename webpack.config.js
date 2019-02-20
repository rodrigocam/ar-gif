const config = {
    entry: ['./src/index.js'],
    output: {
        path: __dirname + '/build',
        filename: 'ar-gif.min.js'
    },
    module: {
        rules: [
            {
                loader: 'babel-loader',
                test: /\.js$/,
                exclude: /node_modules/
            },
            {
                test: /\.dat$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.js']
    },
    devServer: {
        port: 3000,
        contentBase: __dirname + '/build',
        inline: true
    },
    node: {
        fs: 'empty'
    }
}
module.exports = config