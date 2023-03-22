import React from 'react'
import { Table, Button, Label, Icon, Image } from 'semantic-ui-react'
import { CODEX_TABLE_MAX_ROWS } from '../data/setting'

export default function CodexTable({ rows, texts, dispatch }) {
  const handleShowDetail = React.useCallback((codex) => {
    dispatch({ type: 'CODEX_MODAL_OPEN', codex })
  }, [dispatch])

  return (
    <Table celled striped selectable unstackable>
      <Table.Body>
        {rows.slice(0, CODEX_TABLE_MAX_ROWS).map(codex =>
          <TableRowForItem key={codex.key}
            codex={codex} texts={texts} onClick={handleShowDetail} />
        )}
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell disabled colSpan='4'>
            {rows.length <= CODEX_TABLE_MAX_ROWS ? rows.length : CODEX_TABLE_MAX_ROWS} / {rows.length}
          </Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table>
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