import { LANGUAGES } from '../data/setting'

export default function init(...args) {
  _init(...args).catch(console.error)
}

async function _init(language, callback) {
  // load data
  const data = {}
  for (const lang of Object.keys(LANGUAGES)) {
    data[lang] = await import(`../data/${lang}.json`)
  }
  // Wanna using structuredClone, but it require polyfill
  const codexes = JSON.parse(JSON.stringify(data[language].codex))
  const codexItems = []
  const options = {
    tags: new Set(),
    statuses: new Set(),
    tiers: new Set(),
    families: new Set(),
    rarities: new Set(),
    events: new Set(),
  }
  for (const [category, items] of Object.entries(codexes)) {
    for (const [id, item] of Object.entries(items)) {
      codexItems.push(item)
      Object.assign(item, {
        key: `${category}:${id}`,
        id: id,
        category: category,
        searches: Object.keys(LANGUAGES).map(
          lang => data[lang].codex[category][id].name)
          .join('|').toLowerCase(),
      })
      // item.x is value
      for (const [to, from] of [
        ['tiers', 'tier'],
        ['families', 'family'],
        ['rarities', 'rarity'],
        ['events', 'event'],
      ]) {
        if (item[from] == null) continue
        options[to].add(item[from])
      }
      // item.x is [value, ...]
      for (const [to, from] of [['tags', 'tags']]) {
        if (item[from] == null) continue
        for (const value of item[from]) {
          options[to].add(value)
        }
      }
      // item.x is [[value, ...unused], ...]
      for (const [to, from] of [
        ['statuses', 'causes'],
        ['statuses', 'cures'],
        ['statuses', 'gives'],
        ['statuses', 'immunities'],
      ]) {
        if (item[from] == null) continue
        for (const status of item[from]) {
          options[to].add(status[0])
        }
      }
    }
  }
  codexItems.sort((a, b) => a.key.localeCompare(b.key))
  // i18n
  const i18n = {
    text: data[language].text,
    category: data[language].category,
  }
  for (const [key, values] of Object.entries(options)) {
    options[key] = Array.from(values).sort().map(value => ({ value, label: value }))
  }
  Object.assign(options, {
    language: Object.entries(LANGUAGES).map(([value, text]) => ({ value, text })),
    category: Object.entries(i18n.category).map(([value, label]) => ({ value, label })),
  })
  // callback
  callback({ language, codexes, codexItems, i18n, options })
}
