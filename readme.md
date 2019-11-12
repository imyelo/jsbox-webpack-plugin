# JSBox Webpack Plugin

> :package: JSBox meets Webpack

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

## Options
### copy
Arguments:
- `copy: [fromPath: string]`
- `copy: [{ fromPath: string, toRelativePath: string }]`

Default Value: `[]`

Basic Example:

```javascript
// ...
    new JSBoxPlugin({
      copy: [
        'beta.json',
      ],
    }),
// ...
```

In case of copying files out of the context:
```javascript
const { resolve } = require('path')
// ...
    new JSBoxPlugin({
      copy: [
        [resolve(__dirname, 'README.md'), 'README.md],
      ],
    }),
// ...
```

### upload
Arguments:
- `upload: boolean`

Default Value: `false`

**Important:** Should be used with env variable `JSBOX_HOST`

Example:

```javascript
// ...
    new JSBoxPlugin({
      upload: true,
    }),
// ...
```

and then

```bash
JSBOX_HOST=192.168.1.10 npx webpack
```

## License
MIT &copy; yelo, 2019 - present
