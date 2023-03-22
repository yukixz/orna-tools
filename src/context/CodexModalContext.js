import { createContext, useReducer } from 'react'

export const CodexModalContext = createContext(null)
export const CodexModalDispatchContext = createContext(null)

export function CodexModalProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <CodexModalContext.Provider value={state}>
      <CodexModalDispatchContext.Provider value={dispatch}>
        {children}
      </CodexModalDispatchContext.Provider>
    </CodexModalContext.Provider>
  )
}

const initialState = null

function reducer(state, action) {
  switch (action.type) {
    case 'CLOSE': {
      return null
    }
    case 'OPEN': {
      return action.codex
    }
    default: {
      throw Error(`Unknown action: ${action.type}`)
    }
  }
}
