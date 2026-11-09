export async function fetchLatestMarketData(symbols, { signal } = {}) {
  const query = new URLSearchParams({ symbols: symbols.join(",") });
  const response = await fetch(`/api/market-data?${query}`, { signal });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The market data service returned an unreadable response.");
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Could not load market data.");
  }

  if (!Array.isArray(payload?.data)) {
    throw new Error("The market data service returned an unexpected response.");
  }

  return payload.data;
}

export async function fetchMarketHistory(symbol, range, { signal } = {}) {
  const query = new URLSearchParams({ symbol, range });
  const response = await fetch(`/api/market-history?${query}`, { signal });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The market data service returned an unreadable response.");
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Could not load price history.");
  }

  if (!Array.isArray(payload?.data)) {
    throw new Error("The market data service returned an unexpected response.");
  }

  return payload.data;
}

export async function searchMarketSymbols(query, { signal } = {}) {
  const params = new URLSearchParams({ query });
  const response = await fetch(`/api/market-search?${params}`, { signal });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The symbol search service returned an unreadable response.");
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Could not search Marketstack symbols.");
  }

  if (!Array.isArray(payload?.data)) {
    throw new Error("The symbol search service returned an unexpected response.");
  }

  return payload.data;
}

export function formatPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMarketDate(value) {
  if (typeof value !== "string") return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}
