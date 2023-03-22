import React from 'react'
import { Grid, Table, Modal, Segment, Card, Label } from 'semantic-ui-react'
import { CodexModalContext, CodexModalDispatchContext } from '../context/CodexModalContext'
import { DataContext } from '../context/DataContext'


export default function CodexModal() {
  const codex = React.useContext(CodexModalContext)
  const dispatch = React.useContext(CodexModalDispatchContext)
  const { codexes, i18n } = React.useContext(DataContext)

  const handleClose = React.useCallback(() => {
    dispatch({ type: 'CLOSE' })
  }, [dispatch])

  const renderRowForCodexItems = React.useCallback(([category, id]) => {
    const item = codexes[category][id]
    return (
      <Table.Row key={item.key}>
        <Table.Cell>{item.name}</Table.Cell>
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


  let causes_by_spells = null
  if (codex.spells != null) {
    causes_by_spells = {}
    for (const [category, key] of codex.spells) {
      const spellCodex = codexes[category][key]
      if (spellCodex.causes == null) {
        continue
      }
      for (const [status, probability] of spellCodex.causes) {
        if (causes_by_spells[status] == null) {
          causes_by_spells[status] = {
            probability: 0,
            by: []
          }
        }
        causes_by_spells[status].by.push(`${spellCodex.name} (${probability}%)`)
        if (probability > causes_by_spells[status].probability) {
          causes_by_spells[status].probability = probability
        }
      }
    }
  }
  return (
    <Modal open={true} onClose={handleClose}>
      <Modal.Header>
        {codex.name} ({codex.id})
      </Modal.Header>
      <Modal.Content scrolling>
        <Grid columns={2} doubling>
          <ModalCard description={codex.description} tags={codex.tags} />
          <ModalSegment label={i18n.text['skills']} tableData={codex.spells} tableRenderRow={renderRowForCodexItems} />
          <ModalSegment label={`${i18n.text['causes']} (${i18n.text['skills']})`}
            tableData={causes_by_spells} tableRenderRow={renderRowForCausesBySpells} />
          <ModalSegment label={i18n.text['gives']} tableData={codex.gives} tableRenderRow={renderRowForStatuses} />
          <ModalSegment label={i18n.text['causes']} tableData={codex.causes} tableRenderRow={renderRowForStatuses} />
          <ModalSegment label={i18n.text['immunities']} tableData={codex.immunities} tableRenderRow={renderRowForStatuses} />
          <ModalSegment label={i18n.text['drops']} tableData={codex.drops} tableRenderRow={renderRowForCodexItems} />
          <ModalSegment label={i18n.text['droppedBy']} tableData={codex.dropped_by} tableRenderRow={renderRowForCodexItems} />
          <ModalSegment label={i18n.text['materials']} tableData={codex.materials} tableRenderRow={renderRowForCodexItems} />
        </Grid>
      </Modal.Content>
    </Modal >
  )
}

const ModalCard = React.memo(function ({ description, tags }) {
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

const ModalSegment = React.memo(function ({ label, tableData, tableRenderRow }) {
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
