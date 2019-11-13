import path from 'path'
import test from 'ava'
import sao from 'sao'
import { isText } from 'istextorbinary'

const generator = path.resolve(__dirname, '..')

test('defaults', async t => {
  const stream = await sao.mock({ generator }, {
    name: 'my-jsbox-app',
    humanizeName: 'My-App',
    website: 'https://github.com/imyelo/jsbox-webpack-plugin',
    authorName: 'yelo',
    authorEmail: 'zhihuzeye@gmail.com',
  })

  t.snapshot(stream.fileList, 'Generated files')

  await stream.fileList.reduce((promise, file) => {
    return promise
      .then(() => stream.readFile(file))
      .then((content) => {
        let buffer = Buffer.from(content)
        t.snapshot(isText(file, buffer) ? content : buffer, `content of ${file}`)
      })
  }, Promise.resolve())
})
