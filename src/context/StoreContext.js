import { createContext, useReducer } from 'react'

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
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'INITIALIZED': {
      return {
        ...state,
        loading: false,
        language: action.language,
        codexes: action.codexes,
        codexItems: action.codexItems,
        rows: applyFilter(action.codexItems, state.filters),
        i18n: {
          ...state.i18n,
          ...action.i18n,
        },
        options: {
          ...state.options,
          ...action.options,
        }
      }
    }
    case 'FILTERS_UPDATED': {
      const filters = {
        ...state.filters,
        ...action.filters,
      }
      return {
        ...state,
        filters,
        rows: applyFilter(state.codexItems, filters),
      }
    }
    default: {
      throw Error(`Unknown action: ${action.type}`)
    }
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
