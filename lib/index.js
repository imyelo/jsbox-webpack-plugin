const jsbox = require('./jsbox')

const throwError = (compilation, message) => {
  compilation.errors.push(new Error(message))
}

module.exports = class JSBoxWebpackPlugin {
  apply (compiler) {
    compiler.hooks.afterEmit.tapPromise('JSBoxPlugin', async (compilation) => {
      try {
        let host = process.env.JSBOX_HOST
        let dir = compilation.outputOptions.path
        if (!host) {
          throw new Error('Please set up the environment variable `JSBOX_HOST`.')
        }
        await jsbox.sync(host, dir)
      } catch (error) {
        throwError(compilation, `JSBox: ${error.message}`)
      }
    })
  }
}
