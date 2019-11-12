import path from 'path'
import webpack from 'webpack'
import merge from 'webpack-merge'
import MemoryFS from 'memory-fs'
import CopyPlugin from 'copy-webpack-plugin'
import JSBoxPlugin from '../..'

const root = path.resolve(__dirname, '..')

export default (options = {}) => {
  const mfs = new MemoryFS()

  options = merge.smart({
    context: root,
    output: {
      path: '/',
      publicPath: '/',
      filename: './scripts/main.js',
      globalObject: 'global',
    },
    resolve: {
      symlinks: true,
    },
    plugins: [
      new CopyPlugin([
        { from: 'main.js', to: 'main.js' },
        { from: 'config.json', to: 'config.json' },
        { from: 'strings', to: 'strings' },
        { from: 'assets', to: 'assets' },
      ]),
      new JSBoxPlugin({
        sync: false,
      }),
    ],
    mode: 'none',
  }, options)

  return {
    mfs,
    compile () {
      const compiler = webpack(options)
      compiler.outputFileSystem = mfs
      return new Promise((resolve, reject) => {
        compiler.run((error, stats) => {
          if (error) {
            reject(error)
          } else {
            resolve(stats)
          }
        })
      })
    },
  }
}
