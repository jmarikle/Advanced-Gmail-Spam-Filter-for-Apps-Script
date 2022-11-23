const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        main: path.resolve('./src', 'app.js')
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'FilterSpam.js',
        library: {
            name: 'FilterSpam',
            type: 'var'
        }
    }
}