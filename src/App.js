import React from 'react'
import Select from 'react-select';
import { Container, Grid, Table, Menu, Modal, Segment, Card } from 'semantic-ui-react'
import { Button, Dropdown, Label, Icon, Image, Input } from 'semantic-ui-react'
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
  },
  // i18n
  texts: {
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

async function init(language, dispatch) {
  // load data
  const data = {}
  for (const lang of Object.keys(LANGUAGES)) {
    data[lang] = await import(`./data/${lang}.json`)
  }
  const codexes = structuredClone(data[language].codex)
  const codexItems = []
  const options = {
    tags: new Set(),
    statuses: new Set(),
    tiers: new Set(),
    families: new Set(),
    rarities: new Set(),
    events: new Set(),
  }
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
      // item.x is value
      for (const [to, from] of [
        ['tiers', 'tier'],
        ['families', 'family'],
        ['rarities', 'rarity'],
        ['events', 'event'],
      ]) {
        if (item[from] == null) continue
        options[to].add(item[from])
      }
      // item.x is [value, ...]
      for (const [to, from] of [['tags', 'tags']]) {
        if (item[from] == null) continue
        for (const value of item[from]) {
          options[to].add(value)
        }
      }
      // item.x is [[value, ...unused], ...]
      for (const [to, from] of [
        ['statuses', 'causes'],
        ['statuses', 'cures'],
        ['statuses', 'gives'],
        ['statuses', 'immunities'],
      ]) {
        if (item[from] == null) continue
        for (const status of item[from]) {
          options[to].add(status[0])
        }
      }
    }
  }
  codexItems.sort((a, b) => a.key.localeCompare(b.key))
  // i18n
  const texts = {
    text: data[language].text,
    category: data[language].category,
  }
  for (const [key, values] of Object.entries(options)) {
    options[key] = Array.from(values).sort().map(value => ({ value, label: value }))
  }
  Object.assign(options, {
    language: Object.entries(LANGUAGES).map(([value, text]) => ({ value, text })),
    category: Object.entries(texts.category).map(([value, label]) => ({ value, label })),
  })
  // dispatch
  console.log(options)
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

  const handleCategoryChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { category: target?.value } })
  }, [])

  const handleTagChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { tag: target?.value } })
  }, [])

  const handleTierChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { tier: target?.value } })
  }, [])

  const handleFamilyChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { family: target?.value } })
  }, [])

  const handleRarityChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { rarity: target?.value } })
  }, [])

  const handleEventChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { event: target?.value } })
  }, [])

  const handleCauseChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { cause: target?.value } })
  }, [])

  const handleCureChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { cure: target?.value } })
  }, [])

  const handleGiveChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { give: target?.value } })
  }, [])

  const handleImmunityChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { immunity: target?.value } })
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
        <Grid as={Segment} columns={4} doubling id='filters'>
          <Grid.Row>
            <Grid.Column width={8}>
              <label>Search in ANY language</label>
              <Input fluid icon='search' onChange={handleSearchChange} />
            </Grid.Column>
            <DropdownFilterColumn label='Category' options={options.category}
              onChange={handleCategoryChange} />
            <DropdownFilterColumn label={texts.text['tags']} options={options.tags}
              onChange={handleTagChange} />
          </Grid.Row>
          <Grid.Row>
            <DropdownFilterColumn label={texts.text['tier']} options={options.tiers}
              onChange={handleTierChange} />
            <DropdownFilterColumn label={texts.text['family']} options={options.families}
              onChange={handleFamilyChange} />
            <DropdownFilterColumn label={texts.text['rarity']} options={options.rarities}
              onChange={handleRarityChange} />
            <DropdownFilterColumn label={texts.text['event']} options={options.events}
              onChange={handleEventChange} />
          </Grid.Row>
          <Grid.Row>
            <DropdownFilterColumn label={texts.text['causes']} options={options.statuses}
              onChange={handleCauseChange} />
            <DropdownFilterColumn label={texts.text['cures']} options={options.statuses}
              onChange={handleCureChange} />
            <DropdownFilterColumn label={texts.text['gives']} options={options.statuses}
              onChange={handleGiveChange} />
            <DropdownFilterColumn label={texts.text['immunities']} options={options.statuses}
              onChange={handleImmunityChange} />
          </Grid.Row>
        </Grid >
        <Table celled striped selectable unstackable>
          <Table.Body>
            {rows.slice(0, TABLE_MAX_ROWS).map(codex =>
              <TableRowForItem key={codex.key}
                codex={codex} texts={texts} onClick={handleShowDetail} />
            )}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.Cell disabled colSpan='4'>
                {rows.length <= TABLE_MAX_ROWS ? rows.length : TABLE_MAX_ROWS} / {rows.length}
              </Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Container >

      {
        modal != null &&
        <ModalForItem codex={modal.codex} codexes={codexes} texts={texts}
          onClose={handleCloseDetail} />
      }
    </div >
  )
}

const DropdownFilterColumn = React.memo(function ({ label, options, onChange }) {
  return (
    <Grid.Column>
      <label>{label}</label>
      <Select isSearchable isClearable
        placeholder='--' options={options} onChange={onChange} />
    </Grid.Column >
  )
})

const TableRowForItem = React.memo(function ({ codex, texts, onClick }) {
  const handleClick = React.useCallback(() => onClick(codex), [codex, onClick])
  return (
    <Table.Row>
      <Table.Cell onClick={handleClick}>
        <Image src={codex.image_url} size='mini' inline />
        {codex.name}
      </Table.Cell>
      <Table.Cell>
        <CodexLabels codex={codex} texts={texts} disable={{ family: true }} />
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

const CodexLabels = React.memo(function ({ codex, texts, disable = {} }) {
  return (
    <Label.Group size='small'>
      <Label>{texts.category[codex.category]}</Label>
      {!disable.tier && codex.tier && <Label><Icon name='star' />{codex.tier}</Label>}
      {/* {!disable.family && codex.family && <Label>{codex.family}</Label>} */}
      {/* {!disable.rarity && codex.rarity && <Label>{codex.rarity}</Label>} */}
      {/* {!disable.event && codex.event && <Label><Icon name='map' />{codex.event}</Label>} */}
      {/* {!disable.tags && codex.tags && codex.tags.map(tag => <Label key={`tag:${tag}`}>{tag}</Label>)} */}
    </Label.Group>
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

  const renderRowForCodexItems = React.useCallback(([category, id]) => {
    const item = codexes[category][id]
    return (
      <Table.Row key={item.key}>
        <Table.Cell>{item.name}</Table.Cell>
      </Table.Row>
    )
  }, [codexes])
  const renderRowForStatuses = React.useCallback(([name, probability]) => {
    return (
      <Table.Row key={name}>
        <Table.Cell>{name}</Table.Cell>
        {probability != null && <Table.Cell>{probability}%</Table.Cell>}
      </Table.Row>
    )
  }, [])
  const renderRowForCausesBySpells = React.useCallback(([name, { probability, by }]) => {
    return (
      <Table.Row key={name}>
        <Table.Cell>{name}</Table.Cell>
        <Table.Cell>{probability}%</Table.Cell>
        <Table.Cell>{by.join(' ')}</Table.Cell>
      </Table.Row>
    )
  }, [])

  return (
    <Modal open={true} onClose={onClose}>
      <Modal.Header>
        {codex.name} ({codex.id})
      </Modal.Header>
      <Modal.Content scrolling>
        <Grid columns={2} doubling>
          <ModalCard description={codex.description} tags={codex.tags} />
          <ModalSegment label={texts.text['skills']} tableData={codex.spells} tableRenderRow={renderRowForCodexItems} />
          <ModalSegment label={`${texts.text['causes']} (${texts.text['skills']})`}
            tableData={causes_by_spells} tableRenderRow={renderRowForCausesBySpells} />
          <ModalSegment label={texts.text['gives']} tableData={codex.gives} tableRenderRow={renderRowForStatuses} />
          <ModalSegment label={texts.text['causes']} tableData={codex.causes} tableRenderRow={renderRowForStatuses} />
          <ModalSegment label={texts.text['immunities']} tableData={codex.immunities} tableRenderRow={renderRowForStatuses} />
          <ModalSegment label={texts.text['drops']} tableData={codex.drops} tableRenderRow={renderRowForCodexItems} />
          <ModalSegment label={texts.text['droppedBy']} tableData={codex.dropped_by} tableRenderRow={renderRowForCodexItems} />
          <ModalSegment label={texts.text['materials']} tableData={codex.materials} tableRenderRow={renderRowForCodexItems} />
        </Grid>
      </Modal.Content>
    </Modal >
  )
})

const ModalSegment = React.memo(function ({ label, tableData, tableRenderRow }) {
  if (!tableData) return
  return (
    <Grid.Column>
      <Segment>
        {label != null &&
          <Label attached='top'>{label}</Label>}
        {tableData != null &&
          <Table basic='very'
            tableData={Array.isArray(tableData) ? tableData : Object.entries(tableData)}
            renderBodyRow={tableRenderRow} />}
      </Segment>
    </Grid.Column >
  )
})

const ModalCard = React.memo(function ({ description, tags }) {
  if (!description && !tags) return
  return (
    <Grid.Column width={16} >
      <Card fluid>
        <Card.Content>
          {description && <Card.Description>{description}</Card.Description>}
          {tags && <Card.Meta>{tags.map(tag => <Label key={tag}>{tag}</Label>)}</Card.Meta>}
        </Card.Content>
      </Card>
    </Grid.Column >
  )
})

export default App
