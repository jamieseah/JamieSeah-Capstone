import React, { useEffect, useState } from 'react'

const API_KEY = import.meta.env.VITE_ALPHAVANTAGE_KEY

// Small helper to format numbers
function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return '—'
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

function App() {
  const [stocks, setStocks] = useState([])
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  // Add a stock row
  function addStock(e) {
    e.preventDefault()
    setError('')
    const s = symbol.trim().toUpperCase()
    const q = Number(quantity)
    const p = Number(price)
    if (!s) return setError('Please enter a stock symbol.')
    if (!Number.isFinite(q) || q <= 0) return setError('Quantity must be a positive number.')
    if (!Number.isFinite(p) || p <= 0) return setError('Purchase price must be a positive number.')

    setStocks(prev => [
      ...prev,
      { id: crypto.randomUUID(), symbol: s, quantity: q, purchasePrice: p, currentPrice: null }
    ])
    setSymbol(''); setQuantity(''); setPrice('')
  }

  function removeStock(id) {
    setStocks(prev => prev.filter(s => s.id !== id))
  }

  // Fetch current prices whenever the list changes
  useEffect(() => {
    async function fetchPrices() {
      if (!API_KEY || stocks.length === 0) return
      const uniqueSymbols = [...new Set(stocks.map(s => s.symbol))]

      // Fetch each symbol one-by-one (simple and easy to follow)
      const priceMap = {}
      for (const sym of uniqueSymbols) {
        try {
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(sym)}&apikey=${API_KEY}`
          const res = await fetch(url)
          const data = await res.json()
          const priceStr = data?.['Global Quote']?.['05. price']
          priceMap[sym] = priceStr ? Number(priceStr) : null
        } catch {
          priceMap[sym] = null
        }
      }

      // Update rows with fetched prices
      setStocks(prev =>
        prev.map(row => ({
          ...row,
          currentPrice: priceMap[row.symbol] ?? row.currentPrice
        }))
      )
    }

    fetchPrices()
  }, [stocks.length]) // re-fetch when rows added/removed (simple trigger)

  return (
    <div className="container">
      <h1>Finance Dashboard</h1>

      <form className="card form" onSubmit={addStock}>

        <label>
          Symbol
          <input
            placeholder="AAPL"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            required
          />
        </label>

        <label>
          Quantity
          <input
            type="number"
            min="0"
            step="1"
            placeholder="10"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />
        </label>

        <label>
          Purchase price
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="150.00"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}
        <div className="button-group">
          <button className="btn" type="submit">Add</button>
  </div>
      </form>

      <div className="card">
        <h2>Stock List</h2>
        {stocks.length === 0 ? (
          <div className="empty">No stocks yet. Add your first one above.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th className="right">Qty</th>
                <th className="right">Buy</th>
                <th className="right">Current</th>
                <th className="right">Value</th>
                <th className="right">P/L</th>
                <th className="right">P/L %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(s => {
                const value = s.currentPrice != null ? s.currentPrice * s.quantity : null
                const pl = s.currentPrice != null ? (s.currentPrice - s.purchasePrice) * s.quantity : null
                const plPct = s.currentPrice != null && s.purchasePrice > 0
                  ? ((s.currentPrice - s.purchasePrice) / s.purchasePrice) * 100
                  : null
                const plClass = pl == null ? '' : pl > 0 ? 'pl-up' : pl < 0 ? 'pl-down' : ''

                return (
                  <tr key={s.id}>
                    <td><span className="badge">{s.symbol}</span></td>
                    <td className="right">{fmt(s.quantity, 0)}</td>
                    <td className="right">{fmt(s.purchasePrice)}</td>
                    <td className="right">{fmt(s.currentPrice)}</td>
                    <td className="right">{fmt(value)}</td>
                    <td className={`right ${plClass}`}>{fmt(pl)}</td>
                    <td className={`right ${plClass}`}>{plPct == null ? '—' : `${fmt(plPct)}%`}</td>
                    <td className="right">
                      <button className="btn-ghost" onClick={() => removeStock(s.id)}>Remove</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default App
