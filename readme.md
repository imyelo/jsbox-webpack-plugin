# JSBox Webpack Plugin

> :package: JSBox meets Webpack

## Get Started
We have prepared a scaffolding tool (thanks to [saojs](https://github.com/saojs/sao)) for you, to help you start using Webpack to develop JSBox applications more efficiently.

*Please ensure that your NPM client is ready, which should be installed with Node.js.*

Just run:
```bash
mkdir myapp && cd myapp
npx sao sao-jsbox-webpack
```

Then everything out of the box is ready for you. :tada:

GLHF :wink:


## Usage
1. Set your iPhone's IP (you can find it in [JSBox's Setting Tab](https://docs.xteko.com/#/README?id=%e5%a6%82%e4%bd%95%e5%9c%a8-jsbox-%e9%87%8c%e8%bf%90%e8%a1%8c%e4%bb%a3%e7%a0%81)) into the environment variable `JSBOX_HOST`.
2. Run `npm start` (development mode) / `npm run build` (production mode) to compiling the codes, and the assembled box file would be sync to your phone automatically.


## Plugin Usage
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
    new JSBoxPlugin(/* options */),
  ],
  mode: isProduction ? 'production' : 'none',
}
```

## Plugin Options
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
Apache-2.0 &copy; yelo, 2019 - present
