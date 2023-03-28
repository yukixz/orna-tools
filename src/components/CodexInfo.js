import React from 'react'
import { Link } from 'react-router-dom'
import { Grid, Table, Segment, Card, Label, Container, Header } from 'semantic-ui-react'
import { StoreContext } from '../context/StoreContext'


export default function CodexInfo({ codex }) {
  const { codexes, i18n } = React.useContext(StoreContext)

  const renderRowForCodexItems = React.useCallback((id) => {
    const item = codexes[id]
    return (
      <Table.Row key={item.id}>
        <Table.Cell><Link to={`/codex/${id}/`}>{item.name}</Link></Table.Cell>
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
    <Container as={Segment}>
      <Header>{codex.name}</Header>
      <Grid columns={2} doubling>
        <CodexCard description={codex.description} tags={codex.tags} />
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

const CodexCard = React.memo(function ({ description, tags }) {
  if (!description && !tags) return
  return (
    <Grid.Column width={16} >
      <Card fluid>
        <Card.Content>
          {description && <Card.Description>{description}</Card.Description>}
          {tags && <Card.Meta>{tags.map(tag => <Label key={tag}>{tag}</Label>)}</Card.Meta>}
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
          <Label attached='top'>{label}</Label>}
        {tableData != null &&
          <Table basic='very'
            tableData={Array.isArray(tableData) ? tableData : Object.entries(tableData)}
            renderBodyRow={tableRenderRow} />}
      </Segment>
    </Grid.Column >
  )
})
