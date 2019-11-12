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
  const stats = await compile()
  t.true(stats.compilation.errors.length === 0)

  const files = mfsu.all({
    exclude: ['/.output/my-jsbox-app.box'],
  })

  t.true(await equalZipFiles(files, mfsu.buffer('/.output/my-jsbox-app.box')))
  t.snapshot(humanizeFiles(files))
})

test('copy files with absolute path', async (t) => {
  const { mfs, compile } = compiler({
    context: resolve(__dirname, './fixtures/basic'),
    entry: './main.js',
    plugins: [
      new JSBoxPlugin({
        copy: [
          'beta.json',
          [resolve(__dirname, './fixtures/readme.md'), 'README.md'],
        ],
        upload: false,
      }),
    ],
  })
  const mfsu = MemoryFSUtils(mfs)
  const stats = await compile()
  t.true(stats.compilation.errors.length === 0)

  const files = mfsu.all({
    exclude: ['/.output/my-jsbox-app.box'],
  })

  t.true(await equalZipFiles(files, mfsu.buffer('/.output/my-jsbox-app.box')))
  t.snapshot(humanizeFiles(files))
})

test.skip('upload', async (t) => {
  // TODO
})
