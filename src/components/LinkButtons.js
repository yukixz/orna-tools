import React from 'react'
import { Button } from 'semantic-ui-react'

export default function LinkButtons({ codex, floated }) {
  const handleClickButton = React.useCallback((event) => {
    event.stopPropagation()
  }, [])

  return (
    <Button.Group floated={floated} onClick={handleClickButton}>
      <Button icon='home'
        as='a' target='_blank'
        href={`https://playorna.com${codex.path}`} />
      <Button icon='bookmark' disabled={codex.ornaguide_id == null}
        as='a' target='_blank'
        href={`https://orna.guide/${codex.ornaguide_category}s?show=${codex.ornaguide_id}`}
      />
      <Button icon='calculator' disabled={codex.ornaguide_category !== "item"}
        as='a' target='_blank'
        href={`https://orna.guide/assess?item=${codex.ornaguide_id}`}
      />
    </Button.Group>
  )
}
