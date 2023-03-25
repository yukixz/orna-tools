import { LANGUAGES } from '../data/setting'

export default function load(...args) {
  _load(...args).catch(console.error)
}

async function _load(callback) {
  const data = {}
  for (const lang of Object.keys(LANGUAGES)) {
    data[lang] = await import(`../data/${lang}.json`)
  }
  callback({ data })
}
