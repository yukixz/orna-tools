import React from 'react'
import { Container } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'
import CodexTable from './components/CodexTable'
import CodexModal from './components/CodexModal'
import DataLoader from './components/DataLoader'
import Filters from './components/Filters'
import Header from './components/Header'
import { CodexModalProvider } from './context/CodexModalContext'
import { DataProvider } from './context/DataContext'


export default function App() {
  return (
    <DataProvider>
      <CodexModalProvider>
        <DataLoader />
        <Header />
        <Container>
          <Filters />
          <CodexTable />
        </Container >
        <CodexModal />
      </CodexModalProvider>
    </DataProvider>
  )
}
