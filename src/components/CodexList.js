import React from 'react'
import * as ReactRouter from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Button, Label, Icon, Item, Segment } from 'semantic-ui-react'
import { StoreContext } from '../context/StoreContext'
import { CODEX_TABLE_MAX_ROWS } from '../data/setting'

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

  const handleClickButton = React.useCallback((event) => {
    event.stopPropagation()
  }, [])

  return (
    <Item className='codex' onClick={handleClick}>
      <Item.Image size='tiny' src={codex.image_url} />
      <Item.Content>
        <Item.Header>
          {codex.name} <Icon name='star' fitted />{codex.tier}
        </Item.Header>
        <Item.Extra>
          <Button.Group floated='right' onClick={handleClickButton}>
            <Button icon as={Link} to={`/codex/${codex.id}/`}>
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
