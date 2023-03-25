import React from "react"
import { Container, Dropdown, Menu } from "semantic-ui-react"
import { StoreContext, StoreDispatchContext } from "../context/StoreContext"
import init from "../utils/init"

export default function Header() {
  const { language, options } = React.useContext(StoreContext)
  const dispatchDataContext = React.useContext(StoreDispatchContext)

  const handleLanguageChange = React.useCallback((event, data) => {
    init(data.value, (state) => {
      dispatchDataContext({
        type: 'INITIALIZED',
        ...state,
      })
    })
  }, [dispatchDataContext])

  return (
    <Menu inverted style={{ margin: 0 }}>
      <Container>
        <Menu.Item as='a' header href='/' style={{ fontSize: '1.4em' }}>Codex</Menu.Item>
        <Menu.Item as='a' header href='/clock/'>Clock</Menu.Item>
        <Menu.Item as='a' header position='right'>
          <Dropdown button floating
            value={language} options={options.language}
            onChange={handleLanguageChange} />
        </Menu.Item>
      </Container>
    </Menu >
  )
}