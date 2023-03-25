import React from 'react'
import Select from 'react-select'
import { Button, Grid, Icon, Input, Segment } from 'semantic-ui-react'
import { StoreContext, StoreDispatchContext } from '../context/StoreContext'

export default function Filters() {
  const { filters, searchQuery } = React.useContext(StoreContext)
  const dispatch = React.useContext(StoreDispatchContext)

  const searchChangeTimeout = React.useRef()
  const handleSearchChange = React.useCallback((event, data) => {
    clearTimeout(searchChangeTimeout.current)
    searchChangeTimeout.current = setTimeout(() => {
      const query = data.value.trim().toLowerCase()
      dispatch({ type: 'SEARCH_UPDATE', query: query })
    }, 200)
  }, [dispatch])

  const handleInsert = React.useCallback(() => {
    dispatch({ type: 'FILTER_INSERT' })
  }, [dispatch])

  return (
    <Grid as={Segment} doubling columns={2}>
      <Grid.Column>
        <Input fluid autoFocus action='Search'
          defaultValue={searchQuery} onChange={handleSearchChange} />
      </Grid.Column>
      <Grid.Column>
        <Grid className='select-filter'>
          <Grid.Row textAlign='right'>
            <Grid.Column>
              <Button icon labelPosition='right' onClick={handleInsert}>
                Filters
                <Icon name='add' />
              </Button>
            </Grid.Column>
          </Grid.Row>
          {filters.map((filter, index) =>
            <SelectFilterRow key={index} index={index} filter={filter} />)}
        </Grid>
      </Grid.Column>
    </Grid>
  )
}

const SelectFilterRow = React.memo(function ({ index, filter }) {
  const { options } = React.useContext(StoreContext)
  const dispatch = React.useContext(StoreDispatchContext)
  const optionsOfType = options[filter.type?.value]

  const handleDelete = React.useCallback(() => {
    dispatch({ type: 'FILTER_DELETE', index: index })
  }, [dispatch, index])

  const handleChangeType = React.useCallback((target) => {
    dispatch({
      type: 'FILTER_UPDATE', index: index, filter: {
        type: target,
        value: null,
      },
    })
  }, [dispatch, index])

  const handleChangeSelect = React.useCallback((target) => {
    dispatch({
      type: 'FILTER_UPDATE', index: index, filter: {
        ...filter,
        value: target,
      },
    })
  }, [dispatch, index, filter])

  return (
    <Grid.Row stretched>
      <Grid.Column>
        <Select isSearchable placeholder='--' value={filter.type}
          options={options.type} onChange={handleChangeType} />
      </Grid.Column>
      <Grid.Column>
        <Select isSearchable placeholder='--' value={filter.value}
          options={optionsOfType} onChange={handleChangeSelect} />
      </Grid.Column>
      <Grid.Column className='action'>
        <Button icon onClick={handleDelete}>
          <Icon name='delete' />
        </Button>
      </Grid.Column>
    </Grid.Row>
  )
})