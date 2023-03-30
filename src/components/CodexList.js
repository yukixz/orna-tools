import React from 'react'
import * as ReactRouter from 'react-router-dom'
import InfiniteScroll from 'react-infinite-scroller'
import { Label, Icon, Item, Segment } from 'semantic-ui-react'
import { StoreContext } from '../context/StoreContext'
import { CODEX_LIST_INITIAL, CODEX_LIST_INCREASE } from '../data/setting'
import LinkButtons from './LinkButtons'

export default function CodexList() {
  const { rows, filters } = React.useContext(StoreContext)

  const [showRowCount, setShowRowCount] = React.useState(CODEX_LIST_INITIAL)
  React.useEffect(() => {
    setShowRowCount(CODEX_LIST_INITIAL)
  }, [filters, setShowRowCount])
  const loadMore = React.useCallback(() => {
    setShowRowCount(showRowCount + CODEX_LIST_INCREASE)
  }, [showRowCount, setShowRowCount])

  return (
    <Segment>
      <InfiniteScroll as={Segment}
        loadMore={loadMore} hasMore={showRowCount < rows.length}
        loader={<p>{showRowCount} / {rows.length}</p>}
      >
        <Item.Group divided unstackable>
          {rows.slice(0, showRowCount).map(codex =>
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
      <Item.Image size='tiny' src={codex.image_url} className='codex-icon' />
      <Item.Content>
        <Item.Header>
          {codex.name} <Icon name='star' fitted />{codex.tier}
        </Item.Header>
        <Item.Extra>
          <LinkButtons codex={codex} floated='right' />
          <Label.Group size='small'>
            <Label content={i18n.category[codex.category]} />
            {codex.event && <Label content={codex.event} icon='map' />}
            {codex.place && <Label content={codex.place} />}
            {codex.useableBy && <Label content={codex.useableBy} />}
          </Label.Group>
        </Item.Extra>
      </Item.Content>
    </Item>
  )
})
