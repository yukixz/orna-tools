import React from 'react'
import * as ReactRouter from 'react-router-dom'
import { Label, Icon, Item, Segment } from 'semantic-ui-react'
import { StoreContext } from '../context/StoreContext'
import { CODEX_TABLE_MAX_ROWS } from '../data/setting'
import LinkButtons from './LinkButtons'

export default function CodexList() {
  const { rows } = React.useContext(StoreContext)

  return (
    <Segment>
      <Item.Group divided unstackable>
        {rows.slice(0, CODEX_TABLE_MAX_ROWS).map(codex =>
          <TableRowForItem key={codex.id} codex={codex} />
        )}
      </Item.Group>
      <p>
        {rows.length <= CODEX_TABLE_MAX_ROWS ? rows.length : CODEX_TABLE_MAX_ROWS} / {rows.length}
      </p>
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
      <Item.Image size='tiny' src={codex.image_url} />
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
