import React from 'react'
import * as ReactRouter from 'react-router-dom'
import CodexInfo from '../components/CodexInfo'
import DataLoader from '../components/DataLoader'
import Header from '../components/Header'
import { DataContext } from '../context/DataContext'
import _ from 'lodash'

export default function CodexPage() {
  const { category, id } = ReactRouter.useParams()
  const { codexes } = React.useContext(DataContext)
  const codex = _.get(codexes, [category, id])

  return (
    <div>
      <DataLoader />
      <Header />
      <CodexInfo codex={codex} />
    </div>
  )
}