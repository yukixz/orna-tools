import React from "react"
import { Container, Divider, Icon, List } from "semantic-ui-react"

export default function Footer() {
  return (
    <div>
      <Divider />
      <Container>
        <List horizontal link>
          <List.Item as='a'>
            <Icon name='hashtag' />
            {window.location.hostname}
          </List.Item>
          <List.Item as='a' href="https://github.com/yukixz/orna-tools" target='_blank' rel='noreferrer'>
            <Icon name='github' />
            GitHub
          </List.Item>
          <List.Item as='a' href="https://playorna.com/" target='_blank' rel='noreferrer'>
            <Icon name='home' />
            Orna: The GPS RPG
          </List.Item>
        </List>
      </Container>
    </div>
  )
}