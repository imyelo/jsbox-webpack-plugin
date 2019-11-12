import path from 'path'
import webpack from 'webpack'
import merge from 'webpack-merge'
import MemoryFS from 'memory-fs'

const root = path.resolve(__dirname, '..')

export default (options = {}) => {
  const mfs = new MemoryFS()

  options = merge.smart({
    context: root,
    output: {
      path: '/',
      publicPath: '/',
      filename: 'scripts/main.js',
      globalObject: 'global',
    },
    resolve: {
      symlinks: true,
    },
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
