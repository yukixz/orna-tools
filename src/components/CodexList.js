import React from 'react'
import * as ReactRouter from 'react-router-dom'
import InfiniteScroll from 'react-infinite-scroller'
import { Label, Icon, Item, Segment } from 'semantic-ui-react'
import { StoreContext, StoreDispatchContext } from '../context/StoreContext'
import LinkButtons from './LinkButtons'

export default function CodexList() {
  const { rows, rowsShowCount } = React.useContext(StoreContext)
  const dispatch = React.useContext(StoreDispatchContext)

  const loadMore = React.useCallback(() => {
    dispatch({
      type: 'LIST_LOAD_MORE',
    })
  }, [dispatch])

  return (
    <Segment>
      <Label icon='numbered list' content={rows.length} size='mini' attached='top right' />
      <InfiniteScroll
        loadMore={loadMore} hasMore={rowsShowCount < rows.length}
        loader={<p key={0}>...</p>}
      >
        <Item.Group divided unstackable>
          {rows.slice(0, rowsShowCount).map(codex =>
            <TableRowForItem key={codex.id} codex={codex} />
          )}
        </Item.Group>
      </InfiniteScroll>
    </Segment>
  )
}

const TableRowForItem = React.memo(function ({ codex }) {
  const { i18n } = React.useContext(StoreContext)

  const navigate = ReactRouter.useNavigate()
  const handleClick = React.useCallback((event) => {
    navigate(`/codex/${codex.id}/`)
  }, [codex, navigate])

  return (
    <Item className='codex' onClick={handleClick}>
      <Item.Image size='tiny' src={codex.image_url} loading='lazy' className='codex-icon' />
      <Item.Content>
        <Item.Header>
          {codex.name} <Icon name='star' fitted />{codex.tier}
        </Item.Header>
        <Item.Extra>
          <LinkButtons codex={codex} floated='right' />
          <Label.Group size='small'>
            <Label content={i18n.category[codex.category]} />
            {codex.exotic && <Label content={i18n.text['exotic']} />}
            {codex.events && codex.events.map((value, index) =>
              <Label key={index} content={value} icon='map' />)}
            {codex.place && <Label content={codex.place} />}
            {codex.useableBy && <Label content={codex.useableBy} />}
          </Label.Group>
        </Item.Extra>
      </Item.Content>
    </Item>
  )
})
