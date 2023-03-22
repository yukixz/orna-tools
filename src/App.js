import React from 'react'
import { Container, Dimmer, Loader } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import CodexTable from './components/CodexTable'
import CodexModal from './components/CodexModal'
import Filters from './components/Filters'
import Header from './components/Header'
import { LANGUAGES, LANGUAGE_DEFAULT } from './data/setting'

const initialState = {
  loading: true,
  codexes: null,
  codexItems: null,
  rows: [],
  language: LANGUAGE_DEFAULT,
  // Filters
  filters: {
    query: "",
    category: null,
    tag: null,
    tier: null,
    family: null,
    rarity: null,
    event: null,
    cause: null,
    cure: null,
    give: null,
    immunity: null,
  },
  // i18n
  texts: {
    text: {},
    category: {},
  },
  options: {
    language: [],
    category: [],
    tags: [],
    statuses: [],
    tiers: [],
    families: [],
    rarities: [],
    events: [],
  },
  // Modal
  modal: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'INITIALIZED':
      return {
        ...state,
        loading: false,
        codexes: action.codexes,
        codexItems: action.codexItems,
        rows: applyFilter(action.codexItems, state.filters),
        language: action.language,
        texts: {
          ...state.texts,
          ...action.texts,
        },
        options: {
          ...state.options,
          ...action.options,
        }
      }
    case 'LANGUAGE_CHANGE':
      return {
        ...state,
      }
    case 'FILTERS_UPDATED':
      const filters = {
        ...state.filters,
        ...action.filters,
      }
      return {
        ...state,
        filters: filters,
        rows: applyFilter(state.codexItems, filters),
      }
    case 'CODEX_MODAL_OPEN':
      return {
        ...state,
        modal: {
          codex: action.codex,
        }
      }
    case 'CODEX_MODAL_CLOSE':
      return {
        ...state,
        modal: null,
      }

    default:
      throw new Error()
  }
}

function applyFilter(rows, filters) {
  if (filters.query.length >= 1) {
    rows = rows.filter(row => row.searches.includes(filters.query))
  }
  if (filters.category) {
    rows = rows.filter(row => row.category === filters.category)
  }
  if (filters.tag) {
    rows = rows.filter(row => (row.tags || []).includes(filters.tag))
  }
  if (filters.tier) {
    rows = rows.filter(row => row.tier === filters.tier)
  }
  if (filters.family) {
    rows = rows.filter(row => row.family === filters.family)
  }
  if (filters.rarity) {
    rows = rows.filter(row => row.rarity === filters.rarity)
  }
  if (filters.event) {
    rows = rows.filter(row => row.event === filters.event)
  }
  if (filters.cause) {
    rows = rows.filter(row => (row.causes || []).find(status => status[0] === filters.cause))
  }
  if (filters.cure) {
    rows = rows.filter(row => (row.cures || []).find(status => status[0] === filters.cure))
  }
  if (filters.give) {
    rows = rows.filter(row => (row.gives || []).find(status => status[0] === filters.give))
  }
  if (filters.immunity) {
    rows = rows.filter(row => (row.immunities || []).find(status => status[0] === filters.immunity))
  }
  return rows
}

async function init(language, dispatch) {
  // load data
  const data = {}
  for (const lang of Object.keys(LANGUAGES)) {
    data[lang] = await import(`./data/${lang}.json`)
  }
  // Wanna using structuredClone, but cant make polyfill work
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
  const texts = {
    text: data[language].text,
    category: data[language].category,
  }
  for (const [key, values] of Object.entries(options)) {
    options[key] = Array.from(values).sort().map(value => ({ value, label: value }))
  }
  Object.assign(options, {
    language: Object.entries(LANGUAGES).map(([value, text]) => ({ value, text })),
    category: Object.entries(texts.category).map(([value, label]) => ({ value, label })),
  })
  // dispatch
  dispatch({ type: 'INITIALIZED', language, codexes, codexItems, texts, options })
}

export default function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const { rows, codexes, texts, options, modal } = state

  React.useEffect(() => {
    init(LANGUAGE_DEFAULT, dispatch).catch(console.error)
  }, [])

  const handleLanguageChange = React.useCallback((event, data) => {
    init(data.value, dispatch).catch(console.error)
  }, [])

  return (
    <div>
      <Dimmer active={state.loading}>
        <Loader>Loading</Loader>
      </Dimmer>
      <Header options={options.language} language={state.language}
        onChange={handleLanguageChange} />
      <Container>
        <Filters texts={texts} options={options} dispatch={dispatch} />
        <CodexTable rows={rows} texts={texts} dispatch={dispatch} />
      </Container >
      {modal != null &&
        <CodexModal codex={modal.codex} codexes={codexes} texts={texts}
          dispatch={dispatch} />}
    </div >
  )
}
