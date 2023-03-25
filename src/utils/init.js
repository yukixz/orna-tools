import { LANGUAGES } from '../data/setting'

export default function init(...args) {
  _init(...args).catch(console.error)
}

async function _init(language, callback) {
  // load data
  const dataAll = {}
  for (const lang of Object.keys(LANGUAGES)) {
    dataAll[lang] = await import(`../data/${lang}.json`)
  }
  // Wanna using structuredClone, but it require polyfill
  const data = JSON.parse(JSON.stringify(dataAll[language]))
  // codex
  const codexes = data.codex
  const codexItems = []
  for (const [category, items] of Object.entries(codexes)) {
    for (const [id, item] of Object.entries(items)) {
      codexItems.push(item)
      Object.assign(item, {
        key: `${category}:${id}`,
        id: id,
        category: category,
        searches: Object.keys(LANGUAGES).map(
          lang => dataAll[lang].codex[category][id].name)
          .join('|').toLowerCase(),
      })
    }
  }
  codexItems.sort((a, b) => a.key.localeCompare(b.key))
  // i18n
  const i18n = {
    text: data.text,
    category: data.category,
  }
  // options
  const options = {}
  for (const [key, values] of Object.entries(data.options)) {
    options[key] = values.map(value => ({ value, label: value }))
  }
  Object.assign(options, {
    language: Object.entries(LANGUAGES).map(([value, text]) => ({ value, text })),
    category: Object.entries(i18n.category).map(([value, label]) => ({ value, label })),
  })
  // callback
  callback({ language, codexes, codexItems, i18n, options })
}
