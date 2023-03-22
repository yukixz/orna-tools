import React from "react"
import { Container, Dropdown, Menu } from "semantic-ui-react"

export default function Header({ options, language, onChange }) {
  return (
    <Menu inverted>
      <Container>
        <Menu.Item as='a' header href='/' style={{ fontSize: '1.4em' }}>Codex</Menu.Item>
        <Menu.Item as='a' header href='/clock/'>Clock</Menu.Item>
        <Menu.Item as='a' header position='right'>
          <Dropdown button floating
            value={language} options={options} onChange={onChange} />
        </Menu.Item>
      </Container>
    </Menu>
  )
}