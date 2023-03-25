import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'
import { StoreContext, StoreDispatchContext } from '../context/StoreContext'
import { LANGUAGE_DEFAULT } from '../data/setting'
import init from '../utils/init'


export default function DataLoader() {
  const { loading } = React.useContext(StoreContext)
  const dispatchDataContext = React.useContext(StoreDispatchContext)

  React.useEffect(() => {
    init(LANGUAGE_DEFAULT, (state) => {
      dispatchDataContext({
        type: 'INITIALIZED',
        ...state,
      })
    })
  }, [dispatchDataContext])

  return (
    <Dimmer active={loading}>
      <Loader>Loading</Loader>
    </Dimmer>
  )
}
