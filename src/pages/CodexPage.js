import React from 'react'
import * as ReactRouter from 'react-router-dom'
import CodexInfo from '../components/CodexInfo'
import DataLoader from '../components/DataLoader'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { StoreContext } from '../context/StoreContext'
import _ from 'lodash'

export default function CodexPage() {
  const { id1, id2 } = ReactRouter.useParams()
  const { codexes } = React.useContext(StoreContext)
  const codex = _.get(codexes, `${id1}/${id2}`)

  return (
    <div>
      <DataLoader />
      <Header />
      <CodexInfo codex={codex} />
      <Footer />
    </div>
  )
}