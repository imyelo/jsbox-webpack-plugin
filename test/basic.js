import test from 'ava'
import { resolve } from 'path'
import compiler from './helpers/compiler'
import { MemoryFSUtils } from './helpers/utils'

test('basic', async (t) => {
  const { mfs, compile } = compiler({
    context: resolve(__dirname, './fixtures/basic'),
    entry: './main.js',
  })
  const mfsu = MemoryFSUtils(mfs)

  const stats = await compile()

  console.log(mfs.data)

  t.true(mfsu.raw('/main.js').includes(`require('./scripts/main')`))
  t.deepEqual(mfsu.json('/config.json'), { name: 'my-jsbox-app' })
  t.true(mfsu.exists('/assets/icon.png'))
  t.true(mfsu.raw('/strings/en.strings').includes('"HI" = "Hi";'))
  t.true(mfsu.raw('/scripts/main.js').includes(`module.exports = () => say({ text: $l10n('HI') })`))

  // TODO
  t.true.skip(mfsu.exists('/.output/dist.box'))

  t.pass()

})
