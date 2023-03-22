import React from 'react'
import Select from 'react-select'
import { Grid, Segment, Input } from 'semantic-ui-react'
import { DataContext, DataDispatchContext } from '../context/DataContext'
import './Filters.css'

export default function Filters() {
  const { options, i18n } = React.useContext(DataContext)
  const dispatch = React.useContext(DataDispatchContext)

  const searchChangeTimeout = React.useRef()
  const handleSearchChange = React.useCallback((event, data) => {
    clearTimeout(searchChangeTimeout.current)
    searchChangeTimeout.current = setTimeout(() => {
      const query = data.value.trim().toLowerCase()
      dispatch({ type: 'FILTERS_UPDATED', filters: { query } })
    }, 200)
  }, [dispatch])

  const handleCategoryChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { category: target?.value } })
  }, [dispatch])

  const handleTagChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { tag: target?.value } })
  }, [dispatch])

  const handleTierChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { tier: target?.value } })
  }, [dispatch])

  const handleFamilyChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { family: target?.value } })
  }, [dispatch])

  const handleRarityChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { rarity: target?.value } })
  }, [dispatch])

  const handleEventChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { event: target?.value } })
  }, [dispatch])

  const handleCauseChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { cause: target?.value } })
  }, [dispatch])

  const handleCureChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { cure: target?.value } })
  }, [dispatch])

  const handleGiveChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { give: target?.value } })
  }, [dispatch])

  const handleImmunityChange = React.useCallback((target) => {
    dispatch({ type: 'FILTERS_UPDATED', filters: { immunity: target?.value } })
  }, [dispatch])

  return (
    <Grid as={Segment} columns={4} doubling id='filters'>
      <Grid.Row>
        <Grid.Column width={8}>
          <label>Search in ANY language</label>
          <Input fluid icon='search' onChange={handleSearchChange} />
        </Grid.Column>
        <DropdownFilterColumn label='Category' options={options.category}
          onChange={handleCategoryChange} />
        <DropdownFilterColumn label={i18n.text['tags']} options={options.tags}
          onChange={handleTagChange} />
      </Grid.Row>
      <Grid.Row>
        <DropdownFilterColumn label={i18n.text['tier']} options={options.tiers}
          onChange={handleTierChange} />
        <DropdownFilterColumn label={i18n.text['family']} options={options.families}
          onChange={handleFamilyChange} />
        <DropdownFilterColumn label={i18n.text['rarity']} options={options.rarities}
          onChange={handleRarityChange} />
        <DropdownFilterColumn label={i18n.text['event']} options={options.events}
          onChange={handleEventChange} />
      </Grid.Row>
      <Grid.Row>
        <DropdownFilterColumn label={i18n.text['causes']} options={options.statuses}
          onChange={handleCauseChange} />
        <DropdownFilterColumn label={i18n.text['cures']} options={options.statuses}
          onChange={handleCureChange} />
        <DropdownFilterColumn label={i18n.text['gives']} options={options.statuses}
          onChange={handleGiveChange} />
        <DropdownFilterColumn label={i18n.text['immunities']} options={options.statuses}
          onChange={handleImmunityChange} />
      </Grid.Row>
    </Grid >
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
