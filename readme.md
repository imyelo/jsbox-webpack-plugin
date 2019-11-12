# `jsbox-webpack-plugin`

> TODO: description

## Usage

```javascript
const { resolve } = require('path')
const JSBoxPlugin = require('jsbox-webpack-plugin')

const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  context: resolve('src'),
  entry: './scripts/main.js',
  output: {
    path: resolve(`dist`),
    filename: 'scripts/main.js',
  },
  resolve: {
    symlinks: true,
  },
  plugins: [
    new JSBoxPlugin(),
  ],
  mode: isProduction ? 'production' : 'none',
}
```

## License
MIT &copy; yelo, 2019 - present
