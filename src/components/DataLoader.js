import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'
import { DataContext, DataDispatchContext } from '../context/DataContext'
import { LANGUAGE_DEFAULT } from '../data/setting'
import init from '../utils/init'


export default function DataLoader() {
  const data = React.useContext(DataContext)
  const dispatchDataContext = React.useContext(DataDispatchContext)

  React.useEffect(() => {
    init(LANGUAGE_DEFAULT, (state) => {
      dispatchDataContext({
        type: 'INITIALIZED',
        ...state,
      })
    })
  }, [dispatchDataContext])

  return (
    <Dimmer active={data.loading}>
      <Loader>Loading</Loader>
    </Dimmer>
  )
}
