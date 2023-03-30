import React from "react"
import Select from 'react-select'
import { Button, Container, Icon, Menu, Modal } from "semantic-ui-react"
import { StoreContext, StoreDispatchContext } from "../context/StoreContext"

export default function Header() {
  const [isOpen, setIsOpen] = React.useState(false)
  const handleOpenSetting = React.useCallback(() => {
    setIsOpen(true)
  }, [])
  const handleCloseSetting = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <Menu inverted style={{ marginTop: 0, borderRadius: 'unset' }}>
      <Container>
        <Menu.Item as='a' header href='/' style={{ fontSize: '1.4em' }}>Codex</Menu.Item>
        <Menu.Item as='a' header href='/clock/'>Clock</Menu.Item>
        <Menu.Item as='a' header position='right' onClick={handleOpenSetting}>
          <Icon name="language" />
        </Menu.Item>
      </Container>
      {isOpen && <SettingModal onClose={handleCloseSetting} />}
    </Menu >
  )
}

const SettingModal = React.memo(function ({ onClose }) {
  const { language, secondaryLanguages, options } = React.useContext(StoreContext)
  const dispatch = React.useContext(StoreDispatchContext)

  const selected = [].concat(language, secondaryLanguages)
    .map(lang => options.languages.find(({ value }) => value === lang))
  const [form, setForm] = React.useState({
    languages: selected,
  })

  const handleLanguagesChange = React.useCallback((value) => {
    setForm({ ...form, languages: value })
  }, [form, setForm])

  const handleSubmit = React.useCallback(() => {
    const languages = form.languages.map(item => item.value)
    const primary = languages.shift()
    dispatch({
      type: 'LANGUAGE_CHANGE',
      language: primary,
      secondaryLanguages: languages,
    })
    onClose()
  }, [form, onClose, dispatch])

  return (
    <Modal open={true} onClose={onClose}>
      <Modal.Header><Icon name='settings' /></Modal.Header>
      <Modal.Content>
        <Select isMulti
          defaultValue={selected} options={options.languages}
          onChange={handleLanguagesChange} />
      </Modal.Content>
      <Modal.Actions>
        <Button positive icon='checkmark' style={{ width: '6rem' }}
          onClick={handleSubmit} />
      </Modal.Actions>
    </Modal>
  )
})