import { createContext, useReducer } from 'react'
import { LANGUAGES, LANGUAGE_DEFAULT, SETTINGS_LSKEY } from '../setting'
import { CODEX_LIST_INITIAL, CODEX_LIST_INCREASE } from '../setting'

export const StoreContext = createContext(null)
export const StoreDispatchContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <StoreContext.Provider value={state}>
      <StoreDispatchContext.Provider value={dispatch}>
        {children}
      </StoreDispatchContext.Provider>
    </StoreContext.Provider>
  )
}

const initialState = {
  loading: true,
  language: null,
  secondaryLanguages: [],
  codexes: null,
  codexItems: null,
  rows: [],
  rowsShowCount: 0,
  i18n: {
    text: {},
    category: {},
  },
  options: {},
  filters: [],
  searchQuery: "",
}

function reducer(state, action) {
  switch (action.type) {
    case 'INITIALIZED': {
      const { data } = action
      return {
        ...state,
        ...data,
        loading: false,
        rows: applyFilters(data.codexItems, state.filters, state.searchQuery),
        rowsShowCount: CODEX_LIST_INITIAL,
      }
    }
    case 'LANGUAGE_CHANGE': {
      const settings = JSON.stringify({
        language: action.language,
        secondaryLanguages: action.secondaryLanguages,
      })
      if (settings !== localStorage.getItem(SETTINGS_LSKEY)) {
        localStorage.setItem(SETTINGS_LSKEY, settings)
        window.location.reload()
      }
      return state
    }
    case 'FILTER_INSERT': {
      const filters = [
        ...state.filters,
        {},
      ]
      return {
        ...state, filters,
        rows: applyFilters(state.codexItems, filters, state.searchQuery),
        rowsShowCount: CODEX_LIST_INITIAL,
      }
    }
    case 'FILTER_DELETE': {
      const index = action.index
      const filters = [
        ...state.filters.slice(0, index),
        ...state.filters.slice(index + 1),
      ]
      return {
        ...state, filters,
        rows: applyFilters(state.codexItems, filters, state.searchQuery),
        rowsShowCount: CODEX_LIST_INITIAL,
      }
    }
    case 'FILTER_UPDATE': {
      const index = action.index
      const filters = [
        ...state.filters.slice(0, index),
        action.filter,
        ...state.filters.slice(index + 1),
      ]
      return {
        ...state, filters,
        rows: applyFilters(state.codexItems, filters, state.searchQuery),
        rowsShowCount: CODEX_LIST_INITIAL,
      }
    }
    case 'SEARCH_UPDATE': {
      return {
        ...state, searchQuery: action.query,
        rows: applyFilters(state.codexItems, state.filters, action.query),
        rowsShowCount: CODEX_LIST_INITIAL,
      }
    }
    case 'LIST_LOAD_MORE': {
      return {
        ...state,
        rowsShowCount: state.rowsShowCount + CODEX_LIST_INCREASE,
      }
    }
    default: {
      throw Error(`Unknown action: ${action.type}`)
    }
  }
}

function applyFilters(rows, filters, query) {
  for (const filter of filters) {
    if (filter.value != null) {
      rows = rows.filter(filter.value.func)
    }
  }
  if (query.length >= 1) {
    rows = rows.filter((codex) => codex.searches.includes(query))
  }
  return rows
}

export async function init() {
  // settings from localstrage
  const settings = {}
  try {
    Object.assign(settings,
      JSON.parse(localStorage.getItem(SETTINGS_LSKEY) || '{}'))
  } catch (error) { }
  // default settings
  const defaultSettings = {
    language: LANGUAGE_DEFAULT,
    secondaryLanguages: [],
  }
  for (const [key, value] of Object.entries(defaultSettings)) {
    if (settings[key] == null) {
      settings[key] = value
    }
  }

  // load data
  const allLanguages = [].concat(settings.language, settings.secondaryLanguages)
  const allData = {}
  for (const lang of allLanguages) {
    allData[lang] = await import(`../data/${lang}.json`)
  }

  // codex
  const data = JSON.parse(JSON.stringify(allData[settings.language]))  // deep copy
  const codexes = data.codex
  for (const [id, item] of Object.entries(codexes)) {
    Object.assign(item, {
      id: id,
      searches: Object.values(allData).map(
        data => data.codex[id].name)
        .join('|').toLowerCase(),
    })
  }
  const codexItems = Object.values(codexes)
    .sort((a, b) => a.id.localeCompare(b.id))

  // i18n
  const i18n = {
    text: data.text,
    category: data.category,
  }

  // options
  const toSelectOptions = (items, func) => {
    if (Array.isArray(items)) {
      return items.map(item => ({ label: item, value: item, func: func != null && func(item) }))
    }
    else {
      return Object.entries(items).map(
        ([key, value]) => ({ label: value, value: key, func: func != null && func(key) }))
    }
  }
  const options = {
    languages: toSelectOptions(LANGUAGES),
    type: [],
  }
  for (const { id, name, type, ...config } of [
    {
      id: 'category', name: i18n.text['category'], sources: data.category,
      func: (value) => (codex) => codex.category === value,
    },
    {
      id: 'tier', name: i18n.text['tier'], sources: data.options.tiers,
      func: (value) => (codex) => codex.tier === value,
    },
    {
      id: 'family', name: i18n.text['family'], sources: data.options.families,
      func: (value) => (codex) => codex.family === value,
    },
    {
      id: 'rarity', name: i18n.text['rarity'], sources: data.options.rarities,
      func: (value) => (codex) => codex.rarity === value,
    },
    {
      id: 'place', name: i18n.text['place'], sources: data.options.places,
      func: (value) => (codex) => codex.place === value,
    },
    {
      id: 'useable', name: i18n.text['useableBy'], sources: data.options.useables,
      func: (value) => (codex) => codex.useableBy === value,
    },
    {
      id: 'events', name: i18n.text['events'], sources: data.options.events,
      func: (value) => (codex) => codex.events != null && codex.events.includes(value),
    },
    {
      id: 'tag', name: i18n.text['tags'], sources: data.options.tags,
      func: (value) => (codex) => codex.tags != null && codex.tags.includes(value),
    },
    {
      id: 'cause', name: i18n.text['causes'], sources: data.options.statuses,
      func: (value) => (codex) => codex.causes != null && codex.causes.find(([name, _]) => name === value),
    },
    {
      id: 'cure', name: i18n.text['cures'], sources: data.options.statuses,
      func: (value) => (codex) => codex.cures != null && codex.cures.find(([name, _]) => name === value),
    },
    {
      id: 'give', name: i18n.text['gives'], sources: data.options.statuses,
      func: (value) => (codex) => codex.gives != null && codex.gives.find(([name, _]) => name === value),
    },
    {
      id: 'immunity', name: i18n.text['immunities'], sources: data.options.statuses,
      func: (value) => (codex) => codex.immunities != null && codex.immunities.find(([name, _]) => name === value),
    },
  ]) {
    options.type.push({ value: id, label: name, type: type })
    options[id] = toSelectOptions(config.sources, config.func)
  }

  return { ...settings, codexes, codexItems, i18n, options }
}
