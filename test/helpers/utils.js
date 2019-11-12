export const MemoryFSUtils = (mfs) => {
  return {
    exists: (path) => mfs.existsSync(path),
    raw: (path) => mfs.readFileSync(path, 'utf8'),
    json: (path) => JSON.parse(mfs.readFileSync(path, 'utf8')),
  }
}
