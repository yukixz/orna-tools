import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'
import { StoreContext, StoreDispatchContext } from '../context/StoreContext'
import init from '../utils/load'


export default function DataLoader() {
  const { loading } = React.useContext(StoreContext)
  const dispatchDataContext = React.useContext(StoreDispatchContext)

  React.useEffect(() => {
    init((state) => {
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
