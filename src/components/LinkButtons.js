import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'semantic-ui-react'

export default function LinkButtons({ codex, floated }) {
  const handleClickButton = React.useCallback((event) => {
    event.stopPropagation()
  }, [])

  return (
    <Button.Group floated={floated} onClick={handleClickButton}>
      <Button icon='align justify'
        as={Link} to={`/codex/${codex.id}/`} />
      <Button icon='home'
        as='a' target='_blank' rel="noreferrer"
        href={`https://playorna.com${codex.path}`} />
      <Button icon='bookmark'
        as='a' target='_blank' rel="noreferrer"
        href={`https://orna.guide/${codex.ornaguide_category}s?show=${codex.ornaguide_id}`}
      />
    </Button.Group>
  )
}
