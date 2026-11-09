import { useEffect, useMemo, useState } from "react";
import MarketHeader from "./components/MarketHeader.jsx";
import PriceChart from "./components/PriceChart.jsx";
import SymbolSearch from "./components/SymbolSearch.jsx";
import Watchlist from "./components/Watchlist.jsx";
import {
  fetchLatestMarketData,
  fetchMarketHistory,
  formatMarketDate,
  formatPrice,
  searchMarketSymbols,
} from "./api/marketData.js";
import { sampleSymbols } from "./data/sampleSymbols.js";

function getInitialTheme() {
  try {
    return localStorage.getItem("marketstack-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function App() {
  const [query, setQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState(sampleSymbols[0].symbol);
  const [watchlistSymbols, setWatchlistSymbols] = useState(sampleSymbols);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [range, setRange] = useState("3m");
  const [theme, setTheme] = useState(getInitialTheme);
  const [refreshKey, setRefreshKey] = useState(0);
  const [marketData, setMarketData] = useState([]);
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState("");
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("marketstack-theme", theme);
    } catch {
      // Theme still works for this session when storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    setIsQuoteLoading(true);
    setQuoteError("");

    fetchLatestMarketData(watchlistSymbols.map(({ symbol }) => symbol), {
      signal: controller.signal,
    })
      .then(setMarketData)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setQuoteError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsQuoteLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey, watchlistSymbols]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setIsSearching(true);
      setSearchError("");
      searchMarketSymbols(normalizedQuery, { signal: controller.signal })
        .then(setSearchResults)
        .catch((requestError) => {
          if (requestError.name !== "AbortError") {
            setSearchResults([]);
            setSearchError(requestError.message);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setIsHistoryLoading(true);
    setHistoryError("");
    setHistory([]);

    fetchMarketHistory(selectedSymbol, range, { signal: controller.signal })
      .then(setHistory)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setHistoryError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      });

    return () => controller.abort();
  }, [selectedSymbol, range, refreshKey]);

  const filteredSymbols = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return watchlistSymbols;

    return watchlistSymbols.filter(
      ({ symbol, company }) =>
        symbol.toLowerCase().includes(normalizedQuery) ||
        company.toLowerCase().includes(normalizedQuery)
    );
  }, [query, watchlistSymbols]);

  const selectedStock = watchlistSymbols.find(({ symbol }) => symbol === selectedSymbol);
  const selectedQuote = marketData.find(({ symbol }) => symbol === selectedSymbol);
  const dailyChange =
    selectedQuote?.close != null &&
    selectedQuote?.open != null &&
    selectedQuote.open !== 0
      ? ((selectedQuote.close - selectedQuote.open) / selectedQuote.open) * 100
      : null;

  function handleSelectSearchResult(result) {
    if (
      !watchlistSymbols.some(({ symbol }) => symbol === result.symbol) &&
      watchlistSymbols.length >= 20
    ) {
      setSearchError("Your watchlist is full. Remove a ticker before adding another.");
      return;
    }

    setWatchlistSymbols((current) =>
      current.some(({ symbol }) => symbol === result.symbol)
        ? current
        : [...current, result]
    );
    setSelectedSymbol(result.symbol);
    setQuery("");
    setSearchResults([]);
    setSearchError("");
  }

  return (
    <main className="app-shell">
      <MarketHeader
        theme={theme}
        onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />

      <section className="market-heading">
        <div>
          <p className="eyebrow">YOUR MARKET WORKSPACE</p>
          <h1>Market overview</h1>
          <p className="market-subtitle">
            Track your watchlist and explore historical price performance.
          </p>
        </div>
        <button
          className="refresh-button"
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={isQuoteLoading || isHistoryLoading}
        >
          <span aria-hidden="true">↻</span>
          Refresh data
        </button>
      </section>

      <div className="dashboard-layout">
        <aside className="panel watchlist-panel" aria-label="Watchlist">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR LIST</p>
              <h2>Watchlist</h2>
            </div>
            <span className="watchlist-count">{watchlistSymbols.length}</span>
          </div>
          <SymbolSearch
            query={query}
            onQueryChange={setQuery}
            results={searchResults}
            isSearching={isSearching}
            searchError={searchError}
            onSelectSymbol={handleSelectSearchResult}
            watchlistSymbols={watchlistSymbols}
          />
          <Watchlist
            symbols={filteredSymbols}
            marketData={marketData}
            isLoading={isQuoteLoading}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
          />
          <p className={`watchlist-note${quoteError ? " data-error" : ""}`} role={quoteError ? "alert" : undefined}>
            {quoteError || "End-of-day quotes · Marketstack"}
          </p>
        </aside>

        <div className="market-content">
          <div className="stat-grid" aria-label={`${selectedSymbol} market summary`}>
            <article className="panel stat-card">
              <span className="metric-label">Last close</span>
              <strong className="stat-value">
                {isQuoteLoading ? "Loading…" : formatPrice(selectedQuote?.close)}
              </strong>
              <span className="stat-caption">
                {selectedQuote ? formatMarketDate(selectedQuote.date) : "Latest available session"}
              </span>
            </article>
            <article className="panel stat-card">
              <span className="metric-label">Session change</span>
              <strong className={`stat-value${dailyChange == null ? "" : dailyChange >= 0 ? " positive" : " negative"}`}>
                {isQuoteLoading
                  ? "Loading…"
                  : dailyChange == null
                    ? "—"
                    : `${dailyChange >= 0 ? "+" : ""}${dailyChange.toFixed(2)}%`}
              </strong>
              <span className="stat-caption">Close vs. open</span>
            </article>
            <article className="panel stat-card">
              <span className="metric-label">Session range</span>
              <strong className="stat-value stat-range">
                {isQuoteLoading
                  ? "Loading…"
                  : `${formatPrice(selectedQuote?.low)} – ${formatPrice(selectedQuote?.high)}`}
              </strong>
              <span className="stat-caption">Low to high</span>
            </article>
            <article className="panel stat-card">
              <span className="metric-label">Volume</span>
              <strong className="stat-value">
                {isQuoteLoading || typeof selectedQuote?.volume !== "number"
                  ? isQuoteLoading
                    ? "Loading…"
                    : "—"
                  : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(selectedQuote.volume)}
              </strong>
              <span className="stat-caption">Shares traded</span>
            </article>
          </div>

          <PriceChart
            symbol={selectedSymbol}
            company={selectedStock?.company ?? ""}
            history={history}
            isLoading={isHistoryLoading}
            error={historyError}
            range={range}
            onRangeChange={setRange}
            onRetry={() => setRefreshKey((key) => key + 1)}
          />

          <p className="data-disclaimer">
            Historical end-of-day data is delayed and may be limited by your Marketstack plan.
            This dashboard is for informational purposes, not investment advice.
          </p>
        </div>
      </div>

      <footer className="footer">
        <span>Marketstack market dashboard</span>
        <span>Data as provided by Marketstack</span>
      </footer>
    </main>
  );
}

export default App;
