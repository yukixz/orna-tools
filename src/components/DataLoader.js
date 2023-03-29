import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'
import { StoreContext, StoreDispatchContext, init } from '../context/StoreContext'


export default function DataLoader() {
  const { loading } = React.useContext(StoreContext)
  const dispatch = React.useContext(StoreDispatchContext)

  React.useEffect(() => {
    init().then(data =>
      dispatch({
        type: 'INITIALIZED',
        data,
      }))
  }, [dispatch])

  return (
    <Dimmer active={loading}>
      <Loader>Loading</Loader>
    </Dimmer>
  )
}