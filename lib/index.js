const fs = require('fs-extra')
const path = require('path')
const { RawSource } = require('webpack-sources')
const yazl = require('yazl')
const got = require('got')
const getStream = require('get-stream')
const FormData = require('form-data')
const minimatch = require('minimatch')
const globby = require('globby')
const pMap = require('p-map')
const hasha = require('hasha')

const BOX_OUTPUT_DIRNAME = '.output'
const BUILTIN_COPY_FILES = [
  'config.json',
  'prefs.json',
  'assets',
  'strings',
]

const DEFAULT_OPTIONS = {
  copy: [],
  upload: false,
  uploadTimeout: 10 * 1000,
}

class Cache {
  constructor () {
    this.first = true
    this.compilation = void 0
    this.copies = new Map()
    this.assets = new Map()
    this.box = {
      name: void 0,
      data: void 0,
    }
  }

  setCompilation (compilation) {
    this.compilation = compilation
  }

  addCopies (files) {
    // find the changed files
    let changed = files.filter((file) => {
      let existed = this.copies.get(file.path)
      return !existed || existed.hash !== file.hash
    })
    // cache hashes
    changed.forEach((file) => this.copies.set(file.path, file))
    // return the changed files
    return changed
  }

  addAssets (compilation) {
    const newer = compilation.getAssets().filter(({ name }) =>
      !minimatch(name, `${BOX_OUTPUT_DIRNAME}/**/*`)
    )
    newer.forEach((asset) => {
      this.assets.set(asset.name, asset.source)
    })
    return newer
  }

  setBox (name, data) {
    this.box = {
      name,
      data,
    }
  }

  readConfig () {
    try {
      return JSON.parse(this.assets.get('config.json').source())
    } catch (error) {
      return {}
    }
  }
}

const upload = async (host, filename, content, { timeout }) => {
  const form = new FormData()
  form.append('files[]', content, filename)

  const response = await got.post(`http://${host}/upload`, {
    body: form,
    timeout,
  })

  if (response.statusCode !== 200) {
    throw new Error('Upload to JSBox host failed.')
  }
}

module.exports = class JSBoxPlugin {
  constructor (options = {}) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)
  }

  apply (compiler) {
    let cache = new Cache()

    /**
     * caching compliation
     */
    compiler.hooks.compilation.tap(JSBoxPlugin.name, async (compilation) => {
      cache.setCompilation(compilation)
    })

    /**
     * generate main.js
     */
    compiler.hooks.emit.tapPromise(JSBoxPlugin.name, async (compilation) => {
      if (cache.first) {
        const content = await fs.readFile(path.resolve(__dirname, './assets/main.js'))
        compilation.emitAsset('main.js', new RawSource(content))
      }
      cache.first = false
    })

    /**
     * copying files
     */
    compiler.hooks.emit.tapPromise(JSBoxPlugin.name, async (compilation) => {
      const context = compilation.options.context
      const paths = BUILTIN_COPY_FILES
        .concat(this.options.copy)
        .map((related) => path.join(context, related))

      // adding files and contexts to dependencies for watching mode
      await pMap(paths, async (p) => {
        const exist = await fs.exists(p)
        if (!exist) {
          compilation.fileDependencies.add(p)
          compilation.contextDependencies.add(p)
          return
        }
        let stat = await fs.stat(p)
        if (stat.isFile()) {
          compilation.fileDependencies.add(p)
          return
        }
        if (stat.isDirectory()) {
          compilation.contextDependencies.add(p)
          return
        }
      })

      // load hashes
      const files = await pMap(await globby(paths), async (p) => {
        return {
          path: p,
          hash: await hasha.fromFile(p, { algorithm: 'md4' }),
        }
      })

      // emit changed files
      const changedFiles = cache.addCopies(files)
      await pMap(changedFiles, async (file) => {
        const content = await fs.readFile(file.path, 'utf8')
        compilation.emitAsset(path.relative(context, file.path), new RawSource(content))
      })
    })

    /**
     * packing box
     */
    compiler.hooks.emit.tapPromise(JSBoxPlugin.name, async (compilation) => {
      try {
        if (compilation.compiler.isChild()) {
          console.log('! is-child')
          return
        }

        const changed = cache.addAssets(compilation)
        if (!changed.length) {
          reurn
        }

        const zip = new yazl.ZipFile()
        for (let [name, asset] of cache.assets) {
          let source = asset.source()
          zip.addBuffer(
            Buffer.isBuffer(source) ? source : new Buffer(source),
            name
          )
        }
        zip.end()

        const box = await getStream.buffer(zip.outputStream)
        const config = cache.readConfig()
        const name = `${(config.info && config.info.name) || hasha(box, { algorithm: 'md4' }).slice(0, 8)}.box`
        cache.setBox(name, box)

        compilation.emitAsset(`${BOX_OUTPUT_DIRNAME}/${name}`, new RawSource(box))
      } catch (error) {
        compilation.errors.push(error)
      }
    })

    /**
     * upload to the host
     */
    compiler.hooks.done.tapPromise(JSBoxPlugin.name, async () => {
      try {
        if (!this.options.upload) {
          return
        }
        const host = process.env.JSBOX_HOST
        if (!host) {
          throw new Error(`${JSBoxPlugin.name}: Please set your JSBOX_HOST environment variable.`)
        }
        await upload(host, cache.box.name, cache.box.data, {
          timeout: this.options.uploadTimeout,
        })
      } catch (error) {
        cache.compilation.warnings.push(error)
      }
    })
  }
}
