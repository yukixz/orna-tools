import React from 'react'
import { Container, Grid, Table, Menu, Modal, Segment } from 'semantic-ui-react'
import { Button, Dropdown, Label, List, Icon, Image, Input } from 'semantic-ui-react'
import { Dimmer, Loader } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import './App.css'
import { LANGUAGES, LANGUAGE_DEFAULT, TABLE_MAX_ROWS } from './constants'

const initialState = {
  loading: true,
  codexes: null,
  codexItems: null,
  rows: [],
  language: LANGUAGE_DEFAULT,
  // Filters
  filters: {
    category: "",
    query: "",
  },
  // i18n
  texts: {
    text: {},
    category: {},
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
    rows = rows.filter(row => row.searches.includes(query))
  }
  if (category !== "") {
    rows = rows.filter(row => row.category === category)
  }
  return rows
}

async function init(language, dispatch) {
  // load data
  const data = {}
  for (const lang of Object.keys(LANGUAGES)) {
    data[lang] = await import(`./data/${lang}.json`)
  }
  const codexes = structuredClone(data[language].codex)
  const codexItems = []
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
    }
  }
  codexItems.sort((a, b) => a.key.localeCompare(b.key))
  // i18n
  const texts = {
    text: data[language].text,
    category: data[language].category,
  }
  const options = {
    language: Object.entries(LANGUAGES).map(([value, text]) => ({ value, text })),
    category: Object.entries(texts.category).map(([value, text]) => ({ value, text })),
  }
  // dispatch
  dispatch({ type: 'INITIALIZED', language, codexes, codexItems, texts, options })
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
          <Menu.Item as='a' header position='right'>
            <Dropdown button floating
              value={state.language} options={options.language}
              onChange={handleLanguageChange} />
          </Menu.Item>
        </Container>
      </Menu>

      <Container>
        <Table celled striped selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <Input fluid icon='search'
                  placeholder='Search in ANY languages'
                  onChange={handleSearchChange} />
              </Table.HeaderCell>
              <Table.HeaderCell>Tags</Table.HeaderCell>
              <Table.HeaderCell collapsing>
                <Dropdown selection clearable placeholder='Category'
                  options={options.category}
                  onChange={handleCategoryChange} />
              </Table.HeaderCell>
              <Table.HeaderCell collapsing textAlign='center'>Action</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.slice(0, TABLE_MAX_ROWS).map(codex =>
              <TableRowForItem key={codex.key}
                codex={codex} texts={texts} onClick={handleShowDetail} />
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
        <ModalForItem codex={modal.codex} codexes={codexes} texts={texts}
          onClose={handleCloseDetail} />
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
        <List items={codex.tags} />
      </Table.Cell>
      <Table.Cell>
        {texts.category[codex.category]}
      </Table.Cell>
      <Table.Cell>
        <Button.Group>
          <Button icon onClick={handleClick}>
            <Icon name='align justify' />
          </Button>
          <Button icon as='a'
            href={`https://playorna.com${codex.path}`}
            target='_blank' rel="noreferrer">
            <Icon name='home' />
          </Button>
          <Button icon as='a'
            href={`https://orna.guide/items?show=${codex.ornaguide_id}`}
            target='_blank' rel="noreferrer"
            disabled={codex.category !== "items"}>
            <Icon name='bookmark' />
          </Button>
        </Button.Group>
      </Table.Cell>
    </Table.Row>
  )
})

const ModalForItem = React.memo(function ({ codex, codexes, texts, onClose }) {
  let causes_by_spells = null
  if (codex.spells != null) {
    causes_by_spells = {}
    for (const spellKey of codex.spells) {
      const spellCodex = codexes.spells[spellKey]
      if (spellCodex.causes == null) {
        continue
      }
      for (const [status, probability] of spellCodex.causes) {
        if (causes_by_spells[status] == null) {
          causes_by_spells[status] = {
            probability: 0,
            by: []
          }
        }
        causes_by_spells[status].by.push(`${spellCodex.name} (${probability}%)`)
        if (probability > causes_by_spells[status].probability) {
          causes_by_spells[status].probability = probability
        }
      }
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <Modal.Header>
        {codex.name} ({codex.id})
      </Modal.Header>
      <Modal.Content scrolling>
        <Grid columns={4}>
          <Grid.Row>
            {codex.gives != null &&
              <Grid.Column>
                <Segment padded>
                  <Label attached='top'>{texts.text['Gives']}</Label>
                  <List items={codex.gives.map(([name, rate]) => `${name} (${rate}%)`)} />
                </Segment>
              </Grid.Column>
            }
            {codex.causes != null &&
              <Grid.Column>
                <Segment padded>
                  <Label attached='top'>{texts.text['Causes']}</Label>
                  <List items={codex.causes.map(([name, rate]) => `${name} (${rate}%)`)} />
                </Segment>
              </Grid.Column>
            }
            {codex.spells != null &&
              <Grid.Column>
                <Segment padded>
                  <Label attached='top'>{texts.text['Skills']}</Label>
                  <List items={codex.spells.map(id => codexes.spells[id].name)} />
                </Segment>
              </Grid.Column>
            }
            {causes_by_spells != null &&
              <Grid.Column width={12}>
                <Segment padded>
                  <Label attached='top'>{texts.text['Causes']} ({texts.text['Skills']})</Label>
                  <Table>
                    {Object.entries(causes_by_spells).sort()
                      .map(([name, { probability, by }]) =>
                        <Table.Row key={name}>
                          <Table.Cell>{name}</Table.Cell>
                          <Table.Cell>{probability}%</Table.Cell>
                          <Table.Cell>{by.join(' ')}</Table.Cell>
                        </Table.Row>
                      )}
                  </Table>
                </Segment>
              </Grid.Column>
            }
          </Grid.Row>
        </Grid>
      </Modal.Content>
    </Modal>
  )
})

export default App
