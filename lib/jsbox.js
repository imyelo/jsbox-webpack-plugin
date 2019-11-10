const fs = require('fs-extra')
const path = require('path')
const gulp = require('gulp')
const zip = require('gulp-zip')
const got = require('got')
const FormData = require('form-data')
const vinylToStream = require('vinyl-to-stream')
const getStream = require('get-stream')

const UPLOAD_TIMEOUT = 10 * 1000

const readConfig = (dir) =>
  fs.readJson(path.join(dir, 'config.json'), { throws: false })

const pack = async (dir) => {
  const config = await readConfig(dir)
  const name = (config && config.name) || path.basename(dir)

  const filename = `${name}.box`

  const stream = gulp.src(path.join(dir, '!(.output)**'), { buffer: false })
    .pipe(zip(filename))
    .pipe(gulp.dest(path.join(dir, '.output')))
    .pipe(vinylToStream())

  const buffer = await getStream.buffer(stream)

  return {
    filename,
    content: buffer,
  }
}

const upload = async (host, box) => {
  const form = new FormData()
  form.append('files[]', box.content, box.filename)

  const response = await got.post(`http://${host}/upload`, {
    body: form,
    timeout: UPLOAD_TIMEOUT,
  })

  if (response.statusCode !== 200) {
    throw new Error('Upload to JSBox host failed.')
  }
}

const sync = async (host, dir) => {
  const box = await pack(dir)
  await upload(host, box)
}

exports.pack = pack
exports.sync = sync
