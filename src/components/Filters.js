import React from 'react'
import Select from 'react-select';
import { Grid, Segment, Input } from 'semantic-ui-react'
import './Filters.css'

export default function Filters({ texts, options, dispatch }) {
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