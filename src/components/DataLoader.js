import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'
import { DataDispatchContext } from '../context/DataContext'
import { LANGUAGE_DEFAULT } from '../data/setting'
import init from '../utils/init'


export default function DataLoader() {
  const [isLoading, setIsLoading] = React.useState(true)
  const dispatchDataContext = React.useContext(DataDispatchContext)

  React.useEffect(() => {
    init(LANGUAGE_DEFAULT, (state) => {
      setIsLoading(false)
      dispatchDataContext({
        type: 'INITIALIZED',
        ...state,
      })
    })
  }, [dispatchDataContext])

  return (
    <Dimmer active={isLoading}>
      <Loader>Loading</Loader>
    </Dimmer>
  )
}
