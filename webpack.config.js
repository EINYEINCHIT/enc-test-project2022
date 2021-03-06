var path = require('path');

module.exports = {
    mode: 'development',
    entry: './js/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
          {
            test: /\.(css)$/,
            use: ['style-loader', 'css-loader'],
          },
        ],
    },
    watch: true
}