const jsbox = require('./jsbox')

const throwError = (compilation, message) => {
  compilation.errors.push(new Error(message))
}

const DEFAULT_OPTIONS = {
  sync: false,
  dir: void 0, // compilation.outputOptions.path
}

module.exports = class JSBoxWebpackPlugin {
  constructor (options = {}) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)
  }

  apply (compiler) {
    compiler.hooks.afterEmit.tapPromise('JSBoxPlugin', async (compilation) => {
      try {
        let host = process.env.JSBOX_HOST
        let dir = this.options.dir || compilation.outputOptions.path
        if (!host) {
          throw new Error('Please set up the environment variable `JSBOX_HOST`.')
        }
        if (this.options.sync) {
          await jsbox.sync(host, dir)
        } else {
          await jsbox.pack(dir)
        }
      } catch (error) {
        throwError(compilation, `JSBox: ${error.message}`)
      }
    })
  }
}
