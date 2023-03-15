import React from 'react'
import { Container, Table, Input, Dropdown, Icon, Menu, Modal, Image, Button } from 'semantic-ui-react'
import { Dimmer, Loader } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import './App.css'
import { LANGUAGES, LANGUAGE_DEFAULT, CATEGORIES, TABLE_MAX_ROWS } from './constants'

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
  // Modal
  modal: {
    key: null,
    codex: null,
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
    case 'MODAL_OPEN':
      return {
        ...state,
        modal: {
          key: action.key,
          codex: action.codex,
        }
      }
    case 'MODAL_CLOSE':
      return {
        ...state,
        modal: {
          key: null,
          codex: null,
        }
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
  const { modal } = state

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

  const handleShowDetail = React.useCallback((key, codex) => {
    dispatch({ type: 'MODAL_OPEN', key, codex })
  }, [])

  return (
    <div>
      <Menu inverted tabular>
        <Container>
          <Menu.Item as='a' header style={{ fontSize: '1.4em' }}>Orna Tools</Menu.Item>
          <Menu.Item as='a' header href='/'>Codex</Menu.Item>
          <Menu.Item as='a' header href='/clock/'>Clock</Menu.Item>
        </Container>
      </Menu>

      <Container>
        <Dimmer active={state.loading}>
          <Loader>Loading</Loader>
        </Dimmer>
        <Menu stackable borderless>
          <Menu.Item>
            <Input icon='search' placeholder='Search...' onChange={handleSearchChange} />
          </Menu.Item>
          <Menu.Item>
            <Dropdown selection clearable placeholder='Category'
              options={state.options.category}
              onChange={handleCategoryChange} />
          </Menu.Item>
          <Menu.Item position='right'>
            <Dropdown selection compact placeholder='Language'
              options={state.options.language} value={state.language}
              onChange={handleLanguageChange} />
          </Menu.Item>
        </Menu>
        <Table celled striped selectable sortable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Category</Table.HeaderCell>
              <Table.HeaderCell collapsing>Link</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {state.rows.slice(0, TABLE_MAX_ROWS).map(([key, text]) => {
              console.log(key)
              const codex = state.codex[key]
              return (
                <Table.Row key={key} onClick={() => handleShowDetail(key, codex)}>
                  <Table.Cell>
                    <Image src={codex.image_url} size='mini' inline />
                    {codex.name}
                  </Table.Cell>
                  <Table.Cell>
                    {state.texts.category[codex.category]}
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
          <Table.Footer>
            {state.rows.length > TABLE_MAX_ROWS &&
              <Table.Row fullWidth>
                <Table.Cell>
                  1-{TABLE_MAX_ROWS} / {state.rows.length}
                </Table.Cell>
              </Table.Row>
            }
          </Table.Footer>
        </Table>
      </Container>

      <Modal open={modal.codex != null}
        onClose={() => dispatch({ type: 'MODAL_CLOSE' })}>
        {modal.codex != null &&
          <Modal.Header>
            {modal.codex.name}
          </Modal.Header>}
        {modal.codex != null &&
          <Modal.Content scrolling>
            <pre>
              {JSON.stringify(modal.codex, null, 2)}
            </pre>
          </Modal.Content>
        }
      </Modal>
    </div >
  )
}

export default App
