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
          <TableRowForItem key={codex.key} codex={codex} />
        )}
      </Item.Group>
      <p>
        {rows.length <= CODEX_TABLE_MAX_ROWS ? rows.length : CODEX_TABLE_MAX_ROWS} / {rows.length}
      </p>
    </Segment>
  )
}

const TableRowForItem = React.memo(function ({ codex }) {
  const navigate = ReactRouter.useNavigate()
  const handleClick = React.useCallback((event) => {
    navigate(`/codex/${codex.category}/${codex.id}`)
  }, [codex, navigate])
  const handleClickButton = React.useCallback((event) => {
    event.stopPropagation()
  }, [])

  return (
    <Item className='codex' onClick={handleClick}>
      <Item.Image size='tiny' src={codex.image_url} />
      <Item.Content>
        <Item.Header>{codex.name}</Item.Header>
        <Item.Meta><CodexLabels codex={codex} /></Item.Meta>
        <Item.Extra>
          <Button.Group floated='right' onClick={handleClickButton}>
            <Button icon as={Link} to={`/codex/${codex.category}/${codex.id}`}>
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
        </Item.Extra>
      </Item.Content>
    </Item>
  )
})

const CodexLabels = React.memo(function ({ codex, disable = {} }) {
  const { i18n } = React.useContext(StoreContext)

  return (
    <Label.Group size='small'>
      <Label>{i18n.category[codex.category]}</Label>
      {!disable.tier && codex.tier && <Label><Icon name='star' />{codex.tier}</Label>}
      {/* {!disable.family && codex.family && <Label>{codex.family}</Label>} */}
      {/* {!disable.rarity && codex.rarity && <Label>{codex.rarity}</Label>} */}
      {!disable.event && codex.event && <Label><Icon name='map' />{codex.event}</Label>}
      {!disable.place && codex.place && <Label>{codex.place}</Label>}
      {!disable.useableBy && codex.useableBy && <Label>{codex.useableBy}</Label>}
      {/* {!disable.tags && codex.tags && codex.tags.map(tag => <Label key={`tag:${tag}`}>{tag}</Label>)} */}
    </Label.Group>
  )
})