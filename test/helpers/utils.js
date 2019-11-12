import { join } from 'path'
import RecursiveIterator from 'recursive-iterator'
import { isText } from 'istextorbinary'
import minimatch from 'minimatch'
import unzip from 'decompress-unzip'

class MemoryFSIterator extends RecursiveIterator {
  isNode (any) {
    return super.isNode(any) && !Buffer.isBuffer(any)
  }
}

const createGlobsMatcher = (globs) => (path) =>
  globs.some((glob) => minimatch(path, glob))

export const MemoryFSUtils = (mfs) => {
  return {
    exists: (path) => mfs.existsSync(path),
    buffer: (path) => mfs.readFileSync(path),
    text: (path) => mfs.readFileSync(path, 'utf8'),
    json: (path) => JSON.parse(mfs.readFileSync(path, 'utf8')),
    all: (options = {}) => {
      const isExcluded = createGlobsMatcher(options.exclude || [])
      const iterator = new MemoryFSIterator(mfs.data)
      const files = new Map()
      for (let { path, node } of iterator) {
        if (Buffer.isBuffer(node)) {
          const filePath = `/${path.join('/')}`
          if (!isExcluded(filePath)) {
            files.set(filePath, node)
          }
        }
      }
      return files
    },
  }
}

export const humanizeFiles = (files) => {
  const map = new Map()
  for (let [filePath, content] of files) {
    map.set(filePath, isText(filePath, content) ? content.toString('utf8') : content)
  }
  return map
}

export const equalZipFiles = async (files, archive, paths = Array.from(files.keys())) => {
  let zipFiles = await unzip()(archive)
  return paths.every((path) => {
    let zipFile = zipFiles.find((file) => join('/', file.path) === path)
    let originalFile = files.get(path)
    return zipFile && zipFile.data.equals(originalFile)
  })
}
