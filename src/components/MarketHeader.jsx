function MarketHeader({ theme, onThemeToggle }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="Marketstack dashboard">
        <span className="brand-mark" aria-hidden="true">M</span>
        <span>marketstack<span className="brand-period">.</span></span>
        <span className="brand-divider" aria-hidden="true" />
        <span className="brand-section">Markets</span>
      </a>
      <div className="header-actions">
        <span className="connection-status">
          <span className="status-dot" aria-hidden="true" />
          End-of-day data
        </span>
        <button
          className="theme-toggle"
          type="button"
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <span aria-hidden="true">{theme === "dark" ? "☼" : "☾"}</span>
        </button>
      </div>
    </header>
  );
}

export default MarketHeader;
