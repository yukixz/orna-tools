import React from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import CodexPage from './pages/CodexPage'
import SearchPage from './pages/SearchPage'
import { StoreProvider } from './context/StoreContext'
import 'semantic-ui-css/semantic.min.css'
import './App.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <SearchPage />
  },
  {
    path: '/codex/:id1/:id2/',
    element: <CodexPage />
  },
])

export default function App() {
  return (
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  )
}
