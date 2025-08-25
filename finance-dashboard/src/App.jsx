import { useEffect, useState, useCallback, useContext } from 'react'
import { StockContext } from './StockContext.jsx'

const API_KEY = import.meta.env.VITE_ALPHAVANTAGE_KEY

function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return '—'
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

export default function App() {
  const {stocks, setStocks } = useContext(StockContext)
  const [symbol, setSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const [apiStatus, setApiStatus] = useState('')

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

  const fetchPrices = useCallback(async () => {
    if (!API_KEY || stocks.length === 0) return
    setApiStatus('')

    const uniqueSymbols = [...new Set(stocks.map(s => s.symbol))]
    const priceMap = {}

    for (const sym of uniqueSymbols) {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(sym)}&apikey=${API_KEY}`
        const res = await fetch(url)
        const data = await res.json()

        if (data?.Note) { setApiStatus('Rate-limited by AlphaVantage (free tier). Try again shortly.'); continue }
        if (data?.Information) { setApiStatus(data.Information); continue }
        if (data?.['Error Message']) { setApiStatus(`Invalid symbol: ${sym}`); continue }

        const priceStr = data?.['Global Quote']?.['05. price'] ?? data?.['Global Quote']?.['05. Price']
        priceMap[sym] = priceStr ? Number(priceStr) : null
      } catch {
        setApiStatus('Network error fetching prices.')
      }
    }

    setStocks(prev =>
      prev.map(row => ({
        ...row,
        currentPrice: priceMap[row.symbol] ?? row.currentPrice ?? null
      }))
    )
  }, [stocks.length, setStocks]) 

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  return (
    <div className="container">
      <h1>Finance Dashboard</h1>
      <form className="card form" onSubmit={addStock}>
        <h2>Add a stock</h2>

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
        <button className="btn" type="submit">Add</button>
      </form>

      <div className="card">
        <h2>Your Holdings</h2>
        {stocks.length === 0 ? (
          <div className="empty">No stocks yet. Add your first one above.</div>
        ) : (
          <>
            {apiStatus && (
              <div className="error" style={{ marginBottom: '0.6rem' }}>{apiStatus}</div>
            )}
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
                        <button className="btn-ghost" type="button" onClick={() => removeStock(s.id)}>Remove</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}