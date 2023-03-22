import React from 'react'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import 'semantic-ui-css/semantic.min.css'
import CodexPage from './pages/CodexPage'
import SearchPage from './pages/SearchPage'
import { DataProvider } from './context/DataContext'

const router = createHashRouter([
  {
    path: '/',
    element: <SearchPage />
  },
  {
    path: '/codex/:category/:id',
    element: <CodexPage />
  },
])

export default function App() {
  return (
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  )
}
