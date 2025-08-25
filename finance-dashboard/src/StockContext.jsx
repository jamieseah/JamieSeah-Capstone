import { createContext, useState } from 'react'

export const StockContext = createContext(null)

export function StockProvider({ children }) {
  const [stocks, setStocks] = useState([])
  return (
    <StockContext.Provider value={{ stocks, setStocks }}>
      {children}
    </StockContext.Provider>
  )
}
