import test from 'ava'
import { resolve } from 'path'
import compiler from './helpers/compiler'
import { MemoryFSUtils, humanizeFiles, equalZipFiles } from './helpers/utils'
import JSBoxPlugin from '..'

test('basic', async (t) => {
  const { mfs, compile } = compiler({
    context: resolve(__dirname, './fixtures/basic'),
    entry: './main.js',
    plugins: [
      new JSBoxPlugin({
        upload: false,
      }),
    ],
  })
  const mfsu = MemoryFSUtils(mfs)
  await compile()

  const files = mfsu.all({
    exclude: ['/.output/my-jsbox-app.box'],
  })

  t.true(await equalZipFiles(files, mfsu.buffer('/.output/my-jsbox-app.box')))
  t.snapshot(humanizeFiles(files))
})

test.skip('upload', async (t) => {
  // TODO
})
