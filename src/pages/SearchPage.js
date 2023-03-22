import React from 'react'
import { Container } from 'semantic-ui-react'
import CodexTable from '../components/CodexTable'
import DataLoader from '../components/DataLoader'
import Filters from '../components/Filters'
import Header from '../components/Header'

export default function SearchPage() {
  return (
    <div>
      <DataLoader />
      <Header />
      <Container>
        <Filters />
        <CodexTable />
      </Container >
    </div>
  )
}