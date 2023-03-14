import React from 'react'
import { Container, Table, Grid, Input, Dropdown, Icon } from 'semantic-ui-react'
import { Dimmer, Loader } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import './App.css'
import { LANGUAGES, LANGUAGE_DEFAULT, CATEGORIES } from './constants'

const initialState = {
  loading: true,
  codex: null,
  rowsAll: null,
  rows: [],
  language: LANGUAGE_DEFAULT,
  // i18n
  texts: {
    category: [],
  },
  options: {
    language: [],
    category: [],
  },
  // Filters
  filters: {
    category: null,
    query: "",
  },
}

function reducer(state, action) {
  switch (action.type) {
    case 'INITIALIZED':
      return {
        ...state,
        loading: false,
        codex: action.codex,
        rowsAll: action.rowsAll,
        rows: applyFilter(action.rowsAll, state.filters),
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
        rows: applyFilter(state.rowsAll, filters),
      }

    default:
      throw new Error()
  }
}

function applyFilter(rows, { query, category }) {
  if (query.length >= 1) {
    rows = rows.filter(([key, text]) => text.includes(query))
  }
  if (category != null) {
    rows = rows.filter(([key, text]) => key.startsWith(category))
  }
  return rows
}

async function init(language, dispatch) {
  // load data
  const origin = {}
  for (const lang of Object.keys(LANGUAGES)) {
    origin[lang] = (await import(`./data/${lang}.json`)).default
  }
  const codex = {}
  const names = {}
  for (const [lang, categoryItems] of Object.entries(origin)) {
    for (const [category, items] of Object.entries(categoryItems)) {
      for (const [itemKey, item] of Object.entries(items)) {
        const key = `${category}:${itemKey}`
        if (names[key] == null) {
          names[key] = []
        }
        names[key].push(item.name)

        if (lang === language) {
          codex[key] = {
            ...item,
            category,
          }
        }
      }
    }
  }
  const rowsAll = Object.entries(names)
    .map(([key, texts]) => [key, texts.join('|').toLowerCase()])
  // i18n
  const texts = {
    category: CATEGORIES[language],
  }
  const options = {
    language: Object.entries(LANGUAGES).map(([value, text]) => ({ value, text })),
    category: Object.entries(texts.category).map(([value, text]) => ({ value, text })),
  }
  // dispatch
  dispatch({ type: 'INITIALIZED', language, codex, rowsAll, texts, options })
}

function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  React.useEffect(() => {
    init(LANGUAGE_DEFAULT, dispatch).catch(console.error)
  }, [])

  const searchChangeTimeout = React.useRef()
  const handleSearchChange = React.useCallback((event, data) => {
    clearTimeout(searchChangeTimeout.current)
    searchChangeTimeout.current = setTimeout(() => {
      const query = data.value.trim().toLowerCase()
      dispatch({ type: 'FILTERS_UPDATED', filters: { query } })
    }, 200)
  }, [])

  const handleCategoryChange = React.useCallback((event, data) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { category: data.value } })
  }, [])

  const handleLanguageChange = React.useCallback((event, data) => {
    init(data.value, dispatch).catch(console.error)
  }, [])

  return (
    <Container className='app'>
      <Dimmer active={state.loading}>
        <Loader>Loading</Loader>
      </Dimmer>
      <Grid columns='equal' padded>
        <Grid.Row>
          <Grid.Column>
            <Input icon='search' placeholder='Search...' onChange={handleSearchChange} />
          </Grid.Column>
          <Grid.Column>
            <Dropdown selection clearable placeholder='Category'
              options={state.options.category} onChange={handleCategoryChange} />
          </Grid.Column>
          <Grid.Column>
          </Grid.Column>
          <Grid.Column>
            <Dropdown selection clearable placeholder='Language'
              options={state.options.language} onChange={handleLanguageChange} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Link</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {state.rows.map(([key, text]) => {
                const codex = state.codex[key]
                return (
                  <Table.Row key={key}>
                    <Table.Cell>
                      {state.texts.category[codex.category]}
                    </Table.Cell>
                    <Table.Cell>
                      {codex.name}
                    </Table.Cell>
                    <Table.Cell>
                      <a href={`https://playorna.com${codex.path}`} target='_blank' rel="noreferrer">
                        <Icon name='home' />
                      </a>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </Grid.Row>
      </Grid>
    </Container>
  )
}

export default App
