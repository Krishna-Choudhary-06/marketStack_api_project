import { useMemo, useState } from "react";
import { formatCompactPrice, formatMarketDate, formatPrice } from "../api/marketData.js";

const CHART_WIDTH = 760;
const CHART_HEIGHT = 280;
const PLOT_LEFT = 58;
const PLOT_RIGHT = 748;
const PLOT_TOP = 18;
const PLOT_BOTTOM = 238;
const RANGE_OPTIONS = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

function PriceChart({
  symbol,
  company,
  history,
  isLoading,
  error,
  range,
  onRangeChange,
  onRetry,
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const chart = useMemo(() => {
    if (history.length === 0) return null;

    const values = history.map(({ close }) => close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min || max * 0.02 || 1) * 0.12;
    const lower = min - padding;
    const upper = max + padding;
    const points = history.map((record, index) => ({
      ...record,
      x:
        PLOT_LEFT +
        (history.length === 1 ? 0 : (index / (history.length - 1)) * (PLOT_RIGHT - PLOT_LEFT)),
      y: PLOT_BOTTOM - ((record.close - lower) / (upper - lower)) * (PLOT_BOTTOM - PLOT_TOP),
    }));
    const linePath = points
      .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ");

    return { points, linePath, lower, upper, min, max };
  }, [history]);

  const periodChange =
    history.length > 1
      ? ((history[history.length - 1].close - history[0].close) / history[0].close) * 100
      : null;
  const isPositive = periodChange === null || periodChange >= 0;
  const activePoint = chart?.points[activeIndex ?? chart.points.length - 1];
  const gridLines = chart
    ? Array.from({ length: 4 }, (_, index) => {
        const ratio = index / 3;
        const value = chart.upper - ratio * (chart.upper - chart.lower);
        const y = PLOT_TOP + ratio * (PLOT_BOTTOM - PLOT_TOP);
        return { value, y };
      })
    : [];

  function handlePointerMove(event) {
    if (!chart) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;
    const nearestIndex = Math.round(
      ((relativeX - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT)) * (chart.points.length - 1)
    );
    setActiveIndex(Math.max(0, Math.min(chart.points.length - 1, nearestIndex)));
  }

  return (
    <section className="panel chart-panel" aria-label={`${symbol} price chart`}>
      <div className="chart-heading">
        <div>
          <p className="eyebrow">PRICE PERFORMANCE</p>
          <div className="chart-title-row">
            <h2>{symbol}</h2>
            <span className="chart-company">{company}</span>
          </div>
        </div>
        <div className="range-selector" aria-label="Chart date range">
          {RANGE_OPTIONS.map((option) => (
            <button
              className={range === option.value ? "is-active" : ""}
              type="button"
              key={option.value}
              onClick={() => onRangeChange(option.value)}
              aria-pressed={range === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-metrics">
        <div className="chart-last-price">
          <span className="metric-label">Last close</span>
          <strong>{formatPrice(history.at(-1)?.close)}</strong>
        </div>
        <span className={`period-change${isPositive ? " positive" : " negative"}`}>
          <span aria-hidden="true">{isPositive ? "↗" : "↘"}</span>
          {periodChange === null
            ? "Not enough data"
            : `${isPositive ? "+" : ""}${periodChange.toFixed(2)}%`}
          <span className="period-caption">selected period</span>
        </span>
      </div>

      <div
        className="chart-wrap"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActiveIndex(null)}
      >
        {isLoading ? (
          <div className="chart-state" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            Loading price history…
          </div>
        ) : error ? (
          <div className="chart-state chart-error" role="alert">
            <p>{error}</p>
            <button className="retry-button" type="button" onClick={onRetry}>Try again</button>
          </div>
        ) : chart?.points.length ? (
          <>
            <svg
              className="price-chart"
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="img"
              aria-label={`${symbol} closing price history from ${formatMarketDate(history[0].date)} to ${formatMarketDate(history.at(-1).date)}`}
            >
              <defs>
                <linearGradient id="chart-area-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {gridLines.map(({ value, y }) => (
                <g key={y}>
                  <line className="chart-grid" x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={y} y2={y} />
                  <text className="chart-axis-label" x="0" y={y + 4}>
                    {formatCompactPrice(value)}
                  </text>
                </g>
              ))}
              <path
                d={`${chart.linePath} L ${chart.points.at(-1).x} ${PLOT_BOTTOM} L ${chart.points[0].x} ${PLOT_BOTTOM} Z`}
                fill="url(#chart-area-fill)"
              />
              <path className="chart-line" d={chart.linePath} />
              {chart.points.length > 1 && activePoint && (
                <>
                  <line
                    className="chart-crosshair"
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1={PLOT_TOP}
                    y2={PLOT_BOTTOM}
                  />
                  <circle
                    className="chart-focus-point"
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                  />
                </>
              )}
              <text className="chart-date-label" x={PLOT_LEFT} y="270">
                {formatMarketDate(history[0].date)}
              </text>
              <text className="chart-date-label" x={PLOT_RIGHT} y="270" textAnchor="end">
                {formatMarketDate(history.at(-1).date)}
              </text>
            </svg>
            {chart.points.length > 1 && activePoint && (
              <div
                className="chart-tooltip"
                style={{
                  left: `${(activePoint.x / CHART_WIDTH) * 100}%`,
                  top: `${(activePoint.y / CHART_HEIGHT) * 100}%`,
                }}
              >
                <strong>{formatPrice(activePoint.close)}</strong>
                <span>{formatMarketDate(activePoint.date)}</span>
              </div>
            )}
          </>
        ) : (
          <div className="chart-state">No historical prices for this symbol and range.</div>
        )}
      </div>

      {chart && !isLoading && !error && (
        <div className="chart-footer">
          <span>{history.length} trading sessions</span>
          <span>
            Range {formatPrice(chart.min)} — {formatPrice(chart.max)}
          </span>
        </div>
      )}
    </section>
  );
}

export default PriceChart;
