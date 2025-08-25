import { createContext, useContext, useState } from 'react'

const StockContext = createContext(null)

export function StockProvider({ children }) {
  const [stocks, setStocks] = useState([])

  return (
    <StockContext.Provider value={{ stocks, setStocks }}>
      {children}
    </StockContext.Provider>
  )
}

// Note: Custom hook for consuming context safely
export function useStocks() {
  const ctx = useContext(StockContext)
  if (!ctx) throw new Error('useStocks must be used within a StockProvider')
  return ctx
}
