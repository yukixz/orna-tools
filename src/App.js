import React from 'react'
import { Container, Table, Grid, Input, Dropdown, Icon } from 'semantic-ui-react'
import { Dimmer, Loader } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import './App.css'

const LANGS = ["en", "zh-hans"]

const initialState = {
  loading: true,
  lang: "zh-hans",
  rows: [],
  codex: null,
  rowsAll: null,
  categoryOptions: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        loading: false, rows: action.rows,
        codex: action.codex, rowsAll: action.rows,
        categoryOptions: action.categoryOptions,
      }
    case 'SEARCH_CLEAR':
      return { ...state, rows: state.rowsAll }
    case 'SEARCH_UPDATED':
      return { ...state, rows: action.rows }

    default:
      throw new Error()
  }
}

async function loadData(dispatch) {
  const origin = {}
  for (const lang of LANGS) {
    origin[lang] = (await import(`./data/${lang}.json`)).default
  }
  const codex = {}
  const categoriesSet = new Set()
  for (const [lang, categoryItems] of Object.entries(origin)) {
    for (const [category, items] of Object.entries(categoryItems)) {
      categoriesSet.add(category)
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
  const categoryOptions = Array.from(categoriesSet).sort().map(v => ({
    value: v, text: v,
  }))
  dispatch({ type: 'LOADED', codex, rows, categoryOptions })
}

function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState)

  React.useEffect(() => {
    loadData(dispatch).catch(console.error)
  }, [])

  const searchChangeTimeout = React.useRef()
  const handleSearchChange = React.useCallback((event, data) => {
    clearTimeout(searchChangeTimeout.current)
    searchChangeTimeout.current = setTimeout(() => {
      const query = data.value.trim().toLowerCase()
      if (query.length === 0) {
        return dispatch({ type: 'SEARCH_CLEAR' })
      }
      const rows = state.rowsAll.filter(([key, text]) => text.includes(query))
      dispatch({ type: 'SEARCH_UPDATED', rows })
    }, 200)
  }, [state.rowsAll])

  return (
    <Container className='app'>
      <Dimmer active={state.loading}>
        <Loader>Loading</Loader>
      </Dimmer>
      <Grid columns='equal' padded>
        <Grid.Row>
          <Grid.Column>
            <Input placeholder='Search...' icon='search' onChange={handleSearchChange} />
          </Grid.Column>
          <Grid.Column>
            {/* <Dropdown placeholder='Category' selection clearable options={state.categoryOptions} /> */}
          </Grid.Column>
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
                const codex = state.codex[key][state.lang]
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
