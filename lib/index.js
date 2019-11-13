const fs = require('fs-extra')
const path = require('path')
const { RawSource } = require('webpack-sources')
const yazl = require('yazl')
const got = require('got')
const getStream = require('get-stream')
const FormData = require('form-data')
const minimatch = require('minimatch')
const readdir = require('recursive-readdir')
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
      let existed = this.copies.get(file.fromPath)
      return !existed || existed.hash !== file.hash
    })
    // cache hashes
    changed.forEach((file) => this.copies.set(file.fromPath, file))
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
      let tasks = BUILTIN_COPY_FILES
        .concat(this.options.copy)
        .map((p) => {
          let fromPath, toPath
          if (Array.isArray(p)) {
            fromPath = p[0]
            toPath = p[1]
          } else {
            fromPath = p
            toPath = p
          }
          return {
            fromPath: path.isAbsolute(fromPath) ? fromPath : path.join(context, fromPath),
            toPath,
          }
        })

      // 1. check if each path is a directory or a file
      // 2. adding files and contexts to dependencies for watching mode
      tasks = await pMap(tasks, async (task) => {
        const { fromPath } = task
        const exist = await fs.exists(fromPath)
        if (!exist) {
          compilation.fileDependencies.add(fromPath)
          compilation.contextDependencies.add(fromPath)
          return task
        }
        let stat = await fs.stat(fromPath)
        if (stat.isFile()) {
          compilation.fileDependencies.add(fromPath)
          return {
            ...task,
            isFile: true,
            isDirectory: false,
          }
        }
        if (stat.isDirectory()) {
          compilation.contextDependencies.add(fromPath)
          return {
            ...task,
            isFile: false,
            isDirectory: true,
          }
        }
      })

      // list files
      let files = tasks.filter(({ isFile }) => isFile).map((task) => {
        return {
          fromPath: task.fromPath,
          toPath: task.toPath,
        }
      })
      await pMap(tasks.filter(({ isDirectory }) => isDirectory), async (task) => {
        let paths = await readdir(task.fromPath)
        files = files.concat(paths.map((p) => {
          let related = path.relative(task.fromPath, p)
          return {
            fromPath: p,
            toPath: path.join(task.toPath, related),
          }
        }))
      })

      // load hashes
      files = await pMap(files, async ({ fromPath, toPath }) => {
        return {
          fromPath,
          hash: await hasha.fromFile(fromPath, { algorithm: 'md4' }),
          toPath,
        }
      })

      // emit changed files
      const changedFiles = cache.addCopies(files)
      await pMap(changedFiles, async (file) => {
        const content = await fs.readFile(file.fromPath)
        compilation.emitAsset(file.toPath, new RawSource(content))
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
