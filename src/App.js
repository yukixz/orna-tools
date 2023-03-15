import React from 'react'
import { Container, Grid, Table, Menu, Modal, Segment } from 'semantic-ui-react'
import { Button, Dropdown, Label, List, Icon, Image, Input } from 'semantic-ui-react'
import { Dimmer, Loader } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import './App.css'
import { LANGUAGES, LANGUAGE_DEFAULT, CATEGORIES, TABLE_MAX_ROWS } from './constants'

const initialState = {
  loading: true,
  codexes: null,
  rowsAll: null,
  rows: [],
  language: LANGUAGE_DEFAULT,
  // Filters
  filters: {
    category: null,
    query: "",
  },
  // i18n
  texts: {
    category: [],
  },
  options: {
    language: [],
    category: [],
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
          codex: action.codex,
        }
      }
    case 'MODAL_CLOSE':
      return {
        ...state,
        modal: null,
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
  const codexes = {}
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
          codexes[key] = {
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
  dispatch({ type: 'INITIALIZED', language, codexes, rowsAll, texts, options })
}

function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const { rows, codexes, texts, options, modal } = state

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

  const handleShowDetail = React.useCallback((codex) => {
    dispatch({ type: 'MODAL_OPEN', codex })
  }, [])

  const handleCloseDetail = React.useCallback(() => {
    dispatch({ type: 'MODAL_CLOSE' })
  }, [])

  return (
    <div>
      <Dimmer active={state.loading}>
        <Loader>Loading</Loader>
      </Dimmer>

      <Menu inverted tabular>
        <Container>
          <Menu.Item as='a' header style={{ fontSize: '1.4em' }}>Orna Tools</Menu.Item>
          <Menu.Item as='a' header href='/'>Codex</Menu.Item>
          <Menu.Item as='a' header href='/clock/'>Clock</Menu.Item>
        </Container>
      </Menu>

      <Container>
        <Menu stackable borderless>
          <Menu.Item>
            <Input icon='search' placeholder='Search...' onChange={handleSearchChange} />
          </Menu.Item>
          <Menu.Item>
            <Dropdown selection clearable placeholder='Category'
              options={options.category}
              onChange={handleCategoryChange} />
          </Menu.Item>
          <Menu.Item position='right'>
            <Dropdown selection compact placeholder='Language'
              options={options.language} value={state.language}
              onChange={handleLanguageChange} />
          </Menu.Item>
        </Menu>
        <Table celled striped selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Category</Table.HeaderCell>
              <Table.HeaderCell collapsing textAlign='center'>Action</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.slice(0, TABLE_MAX_ROWS).map(([key, text]) =>
              <TableRowForItem key={key} codex={codexes[key]} texts={texts} onClick={handleShowDetail} />
            )}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.Cell>
                ~{rows.length <= TABLE_MAX_ROWS ? rows.length : TABLE_MAX_ROWS} / {rows.length}
              </Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Container>

      {modal != null &&
        <ModalForItem codex={modal.codex} onClose={handleCloseDetail} />
      }
    </div >
  )
}

const TableRowForItem = React.memo(function ({ codex, texts, onClick }) {
  const handleClick = React.useCallback(() => onClick(codex), [codex, onClick])
  return (
    <Table.Row>
      <Table.Cell onClick={handleClick}>
        <Image src={codex.image_url} size='mini' inline />
        {codex.name}
      </Table.Cell>
      <Table.Cell>
        {texts.category[codex.category]}
      </Table.Cell>
      <Table.Cell>
        <Button.Group>
          <Button icon onClick={handleClick}>
            <Icon name='align justify' />
          </Button>
          <Button icon as='a' href={`https://playorna.com${codex.path}`}
            target='_blank' rel="noreferrer">
            <Icon name='home' />
          </Button>
        </Button.Group>
      </Table.Cell>
    </Table.Row>
  )
})

const ModalForItem = React.memo(function ({ codex, onClose }) {
  return (
    <Modal open={true} onClose={onClose}>
      <Modal.Header>
        {codex.name}
      </Modal.Header>
      <Modal.Content scrolling>
        <Grid columns={4}>
          <Grid.Row>
            {codex.gives != null &&
              <Grid.Column>
                <Segment padded>
                  <Label attached='top'>Gives</Label>
                  <List items={codex.gives.map(([name, rate]) => `${name} (${rate}%)`)} />
                </Segment>
              </Grid.Column>
            }
            {codex.causes != null &&
              <Grid.Column>
                <Segment padded>
                  <Label attached='top'>Causes</Label>
                  <List items={codex.causes.map(([name, rate]) => `${name} (${rate}%)`)} />
                </Segment>
              </Grid.Column>
            }
          </Grid.Row>
          <Grid.Row columns={1}>
            <Grid.Column>
              <Segment padded>
                <Label attached='top'>Source</Label>
                <pre>
                  {JSON.stringify(codex, null, 2)}
                </pre>
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Modal.Content>
    </Modal>
  )
})

export default App
