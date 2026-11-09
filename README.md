# Marketstack API

A React + Vite trading-style market dashboard with a searchable watchlist, latest end-of-day quote metrics, and an interactive historical closing-price chart. Search company names or ticker symbols using Marketstack's ticker directory, then add a result to the watchlist. Dark theme is the default, with a persistent light-theme toggle. Vite server-side middleware proxies requests to Marketstack so the access key is not included in browser code.

## Getting started

```sh
npm install
npm run dev
```

Create a `.env.local` file in the project root and add your Marketstack key:

```env
MARKETSTACK_ACCESS_KEY=your_marketstack_access_key
```

The local env file is ignored by Git. Do not use a `VITE_` prefix for the key.

The app requests `/api/market-search` for ticker-directory results, `/api/market-data` for latest quotes, and `/api/market-history` for historical closing prices over the selected 1-month, 3-month, 6-month, or 1-year range. Historical data and ticker search availability depend on your Marketstack plan and exchange coverage. The default watchlist includes Apple (AAPL), Microsoft (MSFT), NVIDIA (NVDA), Amazon (AMZN), Alphabet (GOOGL), Meta (META), Tesla (TSLA), Netflix (NFLX), AMD (AMD), and Intel (INTC).

To verify a production build locally:

```sh
npm run build
npm run preview
```

Vite's preview server also provides the API middleware. A static-only deployment will need an equivalent server-side API proxy configured; do not put the key in frontend code or expose it through a public build variable.

## Project structure

```text
server/
  marketstackApiPlugin.js
src/
  api/
    marketData.js
  components/
    MarketHeader.jsx
    PriceChart.jsx
    SymbolSearch.jsx
    Watchlist.jsx
  api/
    marketData.js
  data/
    sampleSymbols.js
  styles/
    global.css
  App.jsx
  main.jsx
```

## Scripts

```sh
npm run dev
npm run build
npm run preview
```
