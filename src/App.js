import React from 'react'
import { Container, Grid, Table, Menu, Modal, Segment } from 'semantic-ui-react'
import { Button, Dropdown, Label, Icon, Image, Input } from 'semantic-ui-react'
import { Dimmer, Loader } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import { LANGUAGES, LANGUAGE_DEFAULT, TABLE_MAX_ROWS } from './constants'

const initialState = {
  loading: true,
  codexes: null,
  codexItems: null,
  rows: [],
  language: LANGUAGE_DEFAULT,
  // Filters
  filters: {
    query: "",
    category: "",
    tag: "",
    give: "",
    cause: "",
    immunity: "",
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

function applyFilter(rows, { query, category, tag, give, cause, immunity }) {
  if (query.length >= 1) {
    rows = rows.filter(row => row.searches.includes(query))
  }
  if (category !== "") {
    rows = rows.filter(row => row.category === category)
  }
  if (tag !== "") {
    rows = rows.filter(row => (row.tags || []).includes(tag))
  }
  if (give !== "") {
    rows = rows.filter(row => (row.gives || []).find(status => status[0] === give))
  }
  if (cause !== "") {
    rows = rows.filter(row => (row.causes || []).find(status => status[0] === cause))
  }
  if (immunity !== "") {
    rows = rows.filter(row => (row.immunities || []).find(status => status[0] === immunity))
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
  const tags = new Set()
  const statuses = new Set()
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
      for (const value of item.tags || []) {
        tags.add(value)
      }
      for (const status of [].concat(item.gives, item.causes, item.immunities)) {
        if (status == null) continue
        statuses.add(status[0])
      }
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
    tags: Array.from(tags).sort().map(value => ({ value, text: value })),
    statuses: Array.from(statuses).sort().map(value => ({ value, text: value })),
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

  const handleLanguageChange = React.useCallback((event, data) => {
    init(data.value, dispatch).catch(console.error)
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

  const handleTagChange = React.useCallback((event, data) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { tag: data.value } })
  }, [])

  const handleGiveChange = React.useCallback((event, data) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { give: data.value } })
  }, [])

  const handleCauseChange = React.useCallback((event, data) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { cause: data.value } })
  }, [])

  const handleImmunityChange = React.useCallback((event, data) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { immunity: data.value } })
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

      <Menu inverted>
        <Container>
          <Menu.Item as='a' header href='/' style={{ fontSize: '1.4em' }}>Codex</Menu.Item>
          <Menu.Item as='a' header href='/clock/'>Clock</Menu.Item>
          <Menu.Item as='a' header position='right'>
            <Dropdown button floating
              value={state.language} options={options.language}
              onChange={handleLanguageChange} />
          </Menu.Item>
        </Container>
      </Menu>

      <Container>
        <Grid as={Segment} columns={4} doubling>
          <Grid.Column width={8}>
            <Input fluid icon='search'
              placeholder='Search in ANY languages'
              onChange={handleSearchChange} />
          </Grid.Column>
          <Grid.Column>
            <Dropdown fluid search selection clearable
              placeholder='Category' options={options.category}
              onChange={handleCategoryChange} />
          </Grid.Column>
          <Grid.Column>
            <Dropdown fluid search selection clearable
              placeholder={texts.text['Tags']} options={options.tags}
              onChange={handleTagChange} />
          </Grid.Column>
          <Grid.Column>
            <Dropdown fluid search selection clearable
              placeholder={texts.text['Gives']} options={options.statuses}
              onChange={handleGiveChange} />
          </Grid.Column>
          <Grid.Column>
            <Dropdown fluid search selection clearable
              placeholder={texts.text['Causes']} options={options.statuses}
              onChange={handleCauseChange} />
          </Grid.Column>
          <Grid.Column>
            <Dropdown fluid search selection clearable
              placeholder={texts.text['Immunities']} options={options.statuses}
              onChange={handleImmunityChange} />
          </Grid.Column>
        </Grid>
        <Table celled striped selectable unstackable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Category</Table.HeaderCell>
              <Table.HeaderCell collapsing>Action</Table.HeaderCell>
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
              <Table.Cell disabled colSpan='4'>
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
            href={`https://orna.guide/${codex.ornaguide_category}s?show=${codex.ornaguide_id}`}
            target='_blank' rel="noreferrer">
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
    for (const [category, key] of codex.spells) {
      const spellCodex = codexes[category][key]
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
        <Grid columns={2} doubling>
          {codex.description != null &&
            <Grid.Column width={16}>
              {codex.description}
            </Grid.Column>
          }
          <ModalColumnForCodexItems text={texts.text['Skills']} items={codex.spells} codexes={codexes} />
          {causes_by_spells != null &&
            <Grid.Column>
              <Segment>
                <Label attached='top'>{texts.text['Causes']} ({texts.text['Skills']})</Label>
                <Table basic='very'>
                  <Table.Body>
                    {Object.entries(causes_by_spells).sort()
                      .map(([name, { probability, by }]) =>
                        <Table.Row key={name}>
                          <Table.Cell>{name}</Table.Cell>
                          <Table.Cell>{probability}%</Table.Cell>
                          <Table.Cell>{by.join(' ')}</Table.Cell>
                        </Table.Row>
                      )}
                  </Table.Body>
                </Table>
              </Segment>
            </Grid.Column>
          }
          <ModalColumnForStatuses text={texts.text['Gives']} items={codex.gives} />
          <ModalColumnForStatuses text={texts.text['Causes']} items={codex.causes} />
          <ModalColumnForStatuses text={texts.text['Immunities']} items={codex.immunities} />
          <ModalColumnForCodexItems text={texts.text['Drops']} items={codex.drops} codexes={codexes} />
          <ModalColumnForCodexItems text={texts.text['DroppedBy']} items={codex.dropped_by} codexes={codexes} />
          <ModalColumnForCodexItems text={texts.text['Materials']} items={codex.materials} codexes={codexes} />
        </Grid>
      </Modal.Content>
    </Modal>
  )
})

const ModalColumnForStatuses = React.memo(function ({ text, items }) {
  if (items == null) return
  return (
    <Grid.Column>
      <Segment>
        <Label attached='top'>{text}</Label>
        <Table basic='very'>
          <Table.Body>
            {items.map(([name, probability]) =>
              <Table.Row key={name}>
                <Table.Cell>{name}</Table.Cell>
                {probability != null && <Table.Cell>{probability}%</Table.Cell>}
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Segment>
    </Grid.Column>
  )
})

const ModalColumnForCodexItems = React.memo(function ({ text, items, codexes }) {
  if (items == null) return
  return (
    <Grid.Column>
      <Segment>
        <Label attached='top'>{text}</Label>
        <Table basic='very'>
          <Table.Body>
            {items.map(([category, id]) => codexes[category][id]).map(item =>
              <Table.Row key={item.key}>
                <Table.Cell>{item.name}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Segment>
    </Grid.Column>
  )
})

export default App
