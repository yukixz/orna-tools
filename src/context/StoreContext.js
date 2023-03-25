import { createContext, useReducer } from 'react'
import { LANGUAGES, LANGUAGE_DEFAULT } from '../data/setting'

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
  codexes: null,
  codexItems: null,
  rows: [],
  i18n: {
    text: {},
    category: {},
  },
  options: {},
  filters: [{}],
  searchQuery: "",
}

function reducer(state, action) {
  switch (action.type) {
    case 'INITIALIZED': {
      const parsed = init(state, action.data)
      return {
        ...state,
        ...parsed,
        loading: false,
        rows: parsed.codexItems,
      }
    }
    case 'FILTER_INSERT': {
      const filters = [
        ...state.filters,
        {},
      ]
      return {
        ...state, filters,
        rows: applyFilters(state.codexItems, filters, state.searchQuery)
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
        rows: applyFilters(state.codexItems, filters, state.searchQuery)
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
        rows: applyFilters(state.codexItems, filters, state.searchQuery)
      }
    }
    case 'SEARCH_UPDATE': {
      return {
        ...state, searchQuery: action.query,
        rows: applyFilters(state.codexItems, state.filters, action.query)
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

function init(state, dataAll) {
  const language = state.language || LANGUAGE_DEFAULT
  const data = JSON.parse(JSON.stringify(dataAll[language]))  // deep copy

  const codexes = data.codex
  const codexItems = []
  for (const [category, items] of Object.entries(codexes)) {
    for (const [id, item] of Object.entries(items)) {
      codexItems.push(item)
      Object.assign(item, {
        key: `${category}:${id}`,
        id: id,
        category: category,
        searches: Object.values(dataAll).map(
          data => data.codex[category][id].name)
          .join('|').toLowerCase(),
      })
    }
  }
  codexItems.sort((a, b) => a.key.localeCompare(b.key))

  const i18n = {
    text: data.text,
    category: data.category,
  }

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
    language: toSelectOptions(LANGUAGES),
    type: [],
  }
  for (const { id, name, type, ...config } of [
    {
      id: 'category', name: 'Category', sources: data.category,
      func: (value) => (codex) => codex.category === value,
    },
    {
      id: 'tag', name: i18n.text['tags'], sources: data.options.tags,
      func: (value) => (codex) => codex.tags != null && codex.tags.includes(value),
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
      id: 'event', name: i18n.text['event'], sources: data.options.events,
      func: (value) => (codex) => codex.event === value,
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

  return { language, codexes, codexItems, i18n, options }
}
