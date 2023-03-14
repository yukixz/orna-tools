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
  // Options
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
    case 'LOADED':
      return {
        ...state,
        loading: false,
        codex: action.codex,
        rowsAll: action.rows,
        rows: applyFilter(action.rows, state.filters),
        language: action.language,
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

async function init(dispatch) {
  // load data
  const origin = {}
  for (const lang of Object.keys(LANGUAGES)) {
    origin[lang] = (await import(`./data/${lang}.json`)).default
  }
  const codex = {}
  for (const [lang, categoryItems] of Object.entries(origin)) {
    for (const [category, items] of Object.entries(categoryItems)) {
      for (const [itemKey, item] of Object.entries(items)) {
        const key = `${category}:${itemKey}`
        if (codex[key] == null) {
          codex[key] = {}
        }
        codex[key][lang] = item
      }
    }
  }
  const rows = Object.entries(codex)
    .map(([key, langs]) =>
      [key, Object.values(langs)
        .map(item => item.name)
        .join('|')
        .toLowerCase()])
  // options
  const lang = LANGUAGE_DEFAULT
  const options = {
    language: Object.entries(LANGUAGES).map(([value, text]) => ({ value, text })),
    category: Object.entries(CATEGORIES[lang]).map(([value, text]) => ({ value, text })),
  }
  // dispatch
  dispatch({
    type: 'LOADED',
    codex,
    rows,
    language: lang,
    options,
  })
}

function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  React.useEffect(() => {
    init(dispatch).catch(console.error)
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
          {/* <Grid.Column>
            <Dropdown selection clearable placeholder='Language'
              options={state.options.language} onChange={handleCategoryChange} />
          </Grid.Column> */}
        </Grid.Row>
        <Grid.Row>
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Link</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {state.rows.map(([key, text]) => {
                const codex = state.codex[key][state.language]
                return (
                  <Table.Row key={key}>
                    <Table.Cell>
                      {codex.name}
                    </Table.Cell>
                    <Table.Cell>
                      {codex.description}
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
