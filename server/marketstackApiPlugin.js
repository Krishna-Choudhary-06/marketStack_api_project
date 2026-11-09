const MAX_SYMBOLS = 20;
const SYMBOL_PATTERN = /^[A-Z0-9.-]{1,15}$/;
const HISTORY_RANGES = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

async function fetchMarketData(request, response, accessKey) {
  const url = new URL(request.url ?? "/", "http://localhost");
  const symbolsParameter = url.searchParams.get("symbols") ?? "";
  const symbols = [...new Set(symbolsParameter.split(",").map((value) => value.trim().toUpperCase()))];

  if (
    symbols.length === 0 ||
    symbols.length > MAX_SYMBOLS ||
    symbols.some((symbol) => !SYMBOL_PATTERN.test(symbol))
  ) {
    sendJson(response, 400, {
      error: `Provide between 1 and ${MAX_SYMBOLS} valid ticker symbols.`,
    });
    return;
  }

  if (!accessKey) {
    sendJson(response, 503, {
      error: "Market data is not configured. Set MARKETSTACK_ACCESS_KEY in .env.local.",
    });
    return;
  }

  const apiUrl = new URL("https://api.marketstack.com/v1/eod/latest");
  apiUrl.searchParams.set("access_key", accessKey);
  apiUrl.searchParams.set("symbols", symbols.join(","));

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    sendJson(response, timedOut ? 504 : 502, {
      error: timedOut
        ? "Marketstack did not respond in time. Try again."
        : "Could not connect to Marketstack. Check your connection and try again.",
    });
    return;
  }

  let payload;
  try {
    payload = await upstreamResponse.json();
  } catch {
    sendJson(response, 502, { error: "Marketstack returned an unreadable response." });
    return;
  }

  if (!upstreamResponse.ok || payload?.error) {
    sendJson(response, 502, {
      error:
        payload?.error?.message ??
        `Marketstack returned an error (HTTP ${upstreamResponse.status}).`,
    });
    return;
  }

  if (!Array.isArray(payload?.data)) {
    sendJson(response, 502, { error: "Marketstack returned an unexpected data format." });
    return;
  }

  const data = payload.data
    .filter((record) => typeof record?.symbol === "string")
    .map(({ symbol, exchange, date, close, open, high, low, volume }) => ({
      symbol,
      exchange: typeof exchange === "string" ? exchange : null,
      date: typeof date === "string" ? date : null,
      close: typeof close === "number" ? close : null,
      open: typeof open === "number" ? open : null,
      high: typeof high === "number" ? high : null,
      low: typeof low === "number" ? low : null,
      volume: typeof volume === "number" ? volume : null,
    }));

  sendJson(response, 200, { data });
}

async function fetchMarketHistory(request, response, accessKey) {
  const url = new URL(request.url ?? "/", "http://localhost");
  const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
  const range = url.searchParams.get("range") ?? "";
  const rangeDays = HISTORY_RANGES[range];

  if (!SYMBOL_PATTERN.test(symbol) || !rangeDays) {
    sendJson(response, 400, { error: "Provide a valid ticker and supported date range." });
    return;
  }

  if (!accessKey) {
    sendJson(response, 503, {
      error: "Market data is not configured. Set MARKETSTACK_ACCESS_KEY in .env.local.",
    });
    return;
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - rangeDays);
  const apiUrl = new URL("https://api.marketstack.com/v1/eod");
  apiUrl.searchParams.set("access_key", accessKey);
  apiUrl.searchParams.set("symbols", symbol);
  apiUrl.searchParams.set("date_from", startDate.toISOString().slice(0, 10));
  apiUrl.searchParams.set("date_to", endDate.toISOString().slice(0, 10));
  apiUrl.searchParams.set("limit", "1000");
  apiUrl.searchParams.set("sort", "ASC");

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    sendJson(response, timedOut ? 504 : 502, {
      error: timedOut
        ? "Marketstack did not respond in time. Try again."
        : "Could not connect to Marketstack. Check your connection and try again.",
    });
    return;
  }

  let payload;
  try {
    payload = await upstreamResponse.json();
  } catch {
    sendJson(response, 502, { error: "Marketstack returned an unreadable response." });
    return;
  }

  if (!upstreamResponse.ok || payload?.error) {
    sendJson(response, 502, {
      error:
        payload?.error?.message ??
        `Marketstack returned an error (HTTP ${upstreamResponse.status}).`,
    });
    return;
  }

  if (!Array.isArray(payload?.data)) {
    sendJson(response, 502, { error: "Marketstack returned an unexpected data format." });
    return;
  }

  const data = payload.data
    .filter(
      (record) =>
        typeof record?.date === "string" &&
        typeof record?.close === "number" &&
        Number.isFinite(record.close)
    )
    .map(({ date, close, high, low, volume }) => ({
      date,
      close,
      high: typeof high === "number" ? high : null,
      low: typeof low === "number" ? low : null,
      volume: typeof volume === "number" ? volume : null,
    }));

  sendJson(response, 200, { data });
}

async function searchMarketSymbols(request, response, accessKey) {
  const url = new URL(request.url ?? "/", "http://localhost");
  const query = (url.searchParams.get("query") ?? "").trim();

  if (query.length < 2 || query.length > 60) {
    sendJson(response, 400, { error: "Enter at least 2 characters to search for a ticker." });
    return;
  }

  if (!accessKey) {
    sendJson(response, 503, {
      error: "Market data is not configured. Set MARKETSTACK_ACCESS_KEY in .env.local.",
    });
    return;
  }

  const apiUrl = new URL("https://api.marketstack.com/v1/tickers");
  apiUrl.searchParams.set("access_key", accessKey);
  apiUrl.searchParams.set("search", query);
  apiUrl.searchParams.set("limit", "10");

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    sendJson(response, timedOut ? 504 : 502, {
      error: timedOut
        ? "Marketstack search timed out. Try again."
        : "Could not connect to Marketstack. Check your connection and try again.",
    });
    return;
  }

  let payload;
  try {
    payload = await upstreamResponse.json();
  } catch {
    sendJson(response, 502, { error: "Marketstack returned an unreadable search response." });
    return;
  }

  if (!upstreamResponse.ok || payload?.error) {
    sendJson(response, 502, {
      error:
        payload?.error?.message ??
        `Marketstack returned an error (HTTP ${upstreamResponse.status}).`,
    });
    return;
  }

  if (!Array.isArray(payload?.data)) {
    sendJson(response, 502, { error: "Marketstack returned an unexpected search format." });
    return;
  }

  const data = payload.data
    .filter((record) => typeof record?.symbol === "string" && SYMBOL_PATTERN.test(record.symbol))
    .map((record) => ({
      symbol: record.symbol.toUpperCase(),
      company:
        typeof record.name === "string"
          ? record.name
          : typeof record.symbol === "string"
            ? record.symbol.toUpperCase()
            : "",
      exchange:
        typeof record.stock_exchange?.acronym === "string"
          ? record.stock_exchange.acronym
          : typeof record.stock_exchange?.name === "string"
            ? record.stock_exchange.name
            : "Marketstack",
    }));

  sendJson(response, 200, { data });
}

function createMiddleware(accessKey) {
  return (request, response, next) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (
      pathname !== "/api/market-data" &&
      pathname !== "/api/market-history" &&
      pathname !== "/api/market-search"
    ) {
      next();
      return;
    }

    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    if (pathname === "/api/market-data") {
      void fetchMarketData(request, response, accessKey);
    } else if (pathname === "/api/market-history") {
      void fetchMarketHistory(request, response, accessKey);
    } else {
      void searchMarketSymbols(request, response, accessKey);
    }
  };
}

export function marketstackApiPlugin(accessKey) {
  const middleware = createMiddleware(accessKey);

  return {
    name: "marketstack-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
