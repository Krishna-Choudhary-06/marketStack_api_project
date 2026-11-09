import { formatMarketDate, formatPrice } from "../api/marketData.js";

function Watchlist({ symbols, marketData, isLoading, selectedSymbol, onSelectSymbol }) {
  if (symbols.length === 0) {
    return (
      <p className="empty-state" role="status">
        No tickers match your search.
      </p>
    );
  }

  const marketDataBySymbol = new Map(
    marketData.map((record) => [record.symbol, record])
  );

  return (
    <ul className="symbol-list">
      {symbols.map(({ symbol, company, exchange: sampleExchange }) => {
        const quote = marketDataBySymbol.get(symbol);

        return (
          <li key={symbol}>
            <button
              className={`symbol-row${selectedSymbol === symbol ? " is-selected" : ""}`}
              type="button"
              onClick={() => onSelectSymbol(symbol)}
              aria-pressed={selectedSymbol === symbol}
            >
            <div className="symbol-identity">
              <span className="symbol-avatar" aria-hidden="true">
                {symbol.slice(0, 1)}
              </span>
              <div>
                <p className="symbol-name">{symbol}</p>
                <p className="company-name">{company}</p>
              </div>
            </div>
            <div className="quote-details" aria-live="polite">
              <span className="quote-price">
                {isLoading ? "Loading…" : formatPrice(quote?.close)}
              </span>
              <span className="quote-date">
                {quote ? formatMarketDate(quote.date) : sampleExchange}
              </span>
            </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default Watchlist;
