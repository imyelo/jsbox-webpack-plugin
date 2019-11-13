const { resolve } = require('path')
const JSBoxPlugin = require('jsbox-webpack-plugin')

const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  context: resolve('src'),
  entry: './scripts/main.js',
  output: {
    path: resolve('dist'),
    filename: 'scripts/main.js',
    globalObject: 'global',
  },
  resolve: {
    symlinks: true,
  },
  plugins: [
    new JSBoxPlugin({
      copy: [
        [resolve('readme.md'), 'README.md'],
      ],
      upload: true,
    }),
  ],
  mode: isProduction ? 'production' : 'none',
}
