import React from 'react'
import { Link } from 'react-router-dom'
import { Grid, Table, Segment, Card, Label, Container, Image, Icon } from 'semantic-ui-react'
import { StoreContext } from '../context/StoreContext'
import LinkButtons from './LinkButtons'


export default function CodexInfo({ codex }) {
  const { codexes, i18n } = React.useContext(StoreContext)

  const renderRowForCodexItems = React.useCallback((id) => {
    const codex = codexes[id]
    return (
      <Table.Row key={codex.id}>
        <Table.Cell><Link to={`/codex/${id}/`}>
          <Icon name='star' fitted />{codex.tier} {codex.name}
        </Link></Table.Cell>
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


  if (codex == null) {
    return null
  }
  return (
    <Container>
      <Grid columns={2} doubling>
        <CodexCard codex={codex} />
        <CodexSegment label={i18n.text['skills']} tableData={codex.spells} tableRenderRow={renderRowForCodexItems} />
        <CodexSegment label={`${i18n.text['causes']} (${i18n.text['skills']})`}
          tableData={codex.causes_by_spells} tableRenderRow={renderRowForCausesBySpells} />
        <CodexSegment label={i18n.text['gives']} tableData={codex.gives} tableRenderRow={renderRowForStatuses} />
        <CodexSegment label={i18n.text['causes']} tableData={codex.causes} tableRenderRow={renderRowForStatuses} />
        <CodexSegment label={i18n.text['immunities']} tableData={codex.immunities} tableRenderRow={renderRowForStatuses} />
        <CodexSegment label={i18n.text['drops']} tableData={codex.drops} tableRenderRow={renderRowForCodexItems} />
        <CodexSegment label={i18n.text['droppedBy']} tableData={codex.dropped_by} tableRenderRow={renderRowForCodexItems} />
        <CodexSegment label={i18n.text['materials']} tableData={codex.materials} tableRenderRow={renderRowForCodexItems} />
        <CodexSegment label={i18n.text['materials']} tableData={codex.material_for} tableRenderRow={renderRowForCodexItems} />
      </Grid>
    </Container >
  )
}

const CodexCard = React.memo(function ({ codex }) {
  return (
    <Grid.Column width={16} >
      <Card fluid>
        <Card.Content>
          <Image floated='left' size='tiny' src={codex.image_url} className='codex-icon' />
          <Card.Header>{codex.name}</Card.Header>
          <Card.Meta>
            <Icon name='star' />{codex.tier}
          </Card.Meta>
          {codex.description && <Card.Meta>{codex.description}</Card.Meta>}
          <Card.Description>
            {codex.family && <Label content={codex.family} />}
            {codex.rarity && <Label content={codex.rarity} />}
            {codex.place && <Label content={codex.place} />}
            {codex.useableBy && <Label content={codex.useableBy} />}
            {codex.event && <Label content={codex.event} icon='map' />}
          </Card.Description>
          {codex.tags && <Card.Description>
            {codex.tags.map((value, index) => <Label key={index} content={value} />)}
          </Card.Description>}
          {codex.stats && <Card.Description>
            {codex.stats.map((value, index) => <Label key={index} content={value} />)}
          </Card.Description>}
          <Card.Description>
            <LinkButtons codex={codex} floated='right' />
          </Card.Description>
        </Card.Content>
      </Card>
    </Grid.Column >
  )
})

const CodexSegment = React.memo(function ({ label, tableData, tableRenderRow }) {
  if (!tableData) return
  return (
    <Grid.Column>
      <Segment>
        {label != null &&
          <Label attached='top' content={label} />}
        {tableData != null &&
          <Table basic='very'
            tableData={Array.isArray(tableData) ? tableData : Object.entries(tableData)}
            renderBodyRow={tableRenderRow} />}
      </Segment>
    </Grid.Column >
  )
})
