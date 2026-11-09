import { useEffect, useRef } from "react";

function SymbolSearch({
  query,
  onQueryChange,
  results,
  isSearching,
  searchError,
  onSelectSymbol,
  watchlistSymbols,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    function handleShortcut(event) {
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="symbol-search">
      <label className="search-field">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <span className="visually-hidden">Search company name or ticker symbol</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search any company or ticker"
          autoComplete="off"
        />
        <kbd>/</kbd>
      </label>
      {query.trim().length >= 2 && (
        <div className="search-results" role="listbox" aria-label="Market search results">
          {isSearching ? (
            <p className="search-message" role="status">Searching Marketstack…</p>
          ) : searchError ? (
            <p className="search-message search-error" role="alert">{searchError}</p>
          ) : results.length > 0 ? (
            results.map((result) => {
              const isAdded = watchlistSymbols.some(({ symbol }) => symbol === result.symbol);
              return (
                <button
                  className="search-result"
                  type="button"
                  key={`${result.symbol}-${result.exchange}`}
                  role="option"
                  aria-selected="false"
                  disabled={isAdded}
                  onClick={() => onSelectSymbol(result)}
                >
                  <span className="search-result-identity">
                    <strong>{result.symbol}</strong>
                    <span>{result.company}</span>
                  </span>
                  <span className="search-result-exchange">
                    {isAdded ? "In watchlist" : result.exchange}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="search-message" role="status">
              No matching tickers found. Try a ticker like GOOGL or a company name.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SymbolSearch;
