/** Tarayıcıda varsayılan proxy (/api → backend). SSR için doğrudan backend. */
function apiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return "/api";
  return "http://127.0.0.1:8000";
}

function getBase() {
  return apiBase();
}

const NETWORK_HINT =
  "Tarayıcı API sunucusuna bağlanamadı. Backend çalışıyor mu? `backend` klasöründe: uvicorn main:app --reload --port 8000";

function isLikelyNetworkFailure(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = (err as Error).name;
  const msg = String((err as Error).message ?? "");
  return (
    name === "TypeError" ||
    name === "NetworkError" ||
    msg.includes("NetworkError") ||
    msg.includes("Failed to fetch") ||
    msg.includes("Load failed")
  );
}

async function netFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    if (isLikelyNetworkFailure(err)) throw new Error(NETWORK_HINT);
    throw err;
  }
}

export type SeriesPoint = {
  ds: string;
  y?: number | null;
  yhat?: number | null;
  yhat_lower?: number | null;
  yhat_upper?: number | null;
};

export type Metrics = {
  rmse?: number | null;
  mae?: number | null;
  mape?: number | null;
  volatility_daily?: number | null;
  volatility_annualized?: number | null;
  volatility_annualization_days?: number | null;
  holdout_points?: number | null;
  mean_bias?: number | null;
  regime?: "low_vol" | "high_vol" | null;
  walk_forward_rmse?: number | null;
  conformal_half_width?: number | null;
};

export type AssetClassParam = "auto" | "crypto" | "fx" | "stock";

export type ForecastApiResponse = {
  symbol: string;
  asset_class: string;
  history: SeriesPoint[];
  forecast: SeriesPoint[];
  backtest_metrics: Metrics;
  train_until_used?: string | null;
  holdout_actual?: SeriesPoint[] | null;
  holdout_predicted?: SeriesPoint[] | null;
};

export type BacktestApiResponse = {
  symbol: string;
  asset_class: string;
  metrics: Metrics;
  test_actual: SeriesPoint[];
  test_predicted: SeriesPoint[];
};

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const j: unknown = await res.json();
    if (j && typeof j === "object" && "detail" in j) {
      const d = (j as { detail: unknown }).detail;
      if (typeof d === "string") return d;
      return JSON.stringify(d);
    }
  } catch {
    /* ignore */
  }
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}

export type MarketItem = {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
};

export type MarketSummaryApiResponse = {
  items: MarketItem[];
};

export async function fetchMarketSummary(): Promise<MarketItem[]> {
  const res = await netFetch(`${getBase()}/market-summary`);
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  const j = (await res.json()) as MarketSummaryApiResponse;
  return j.items ?? [];
}

export async function fetchSymbols(q?: string): Promise<string[]> {
  const url = new URL("/symbols/search", getBase());
  if (q?.trim()) url.searchParams.set("q", q.trim());
  const res = await netFetch(url.toString());
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  const j = (await res.json()) as { symbols?: string[] };
  return j.symbols ?? [];
}

export async function postForecast(body: {
  symbol: string;
  history_days: number;
  forecast_days: number;
  asset_class?: AssetClassParam;
  train_until?: string;
  data_start?: string;
}): Promise<ForecastApiResponse> {
  const res = await netFetch(`${getBase()}/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return (await res.json()) as ForecastApiResponse;
}

export async function postBacktest(body: {
  symbol: string;
  history_days: number;
  test_fraction: number;
  asset_class?: AssetClassParam;
  train_until?: string;
  data_start?: string;
}): Promise<BacktestApiResponse> {
  const res = await netFetch(`${getBase()}/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return (await res.json()) as BacktestApiResponse;
}

export type CompareResponse = {
  symbols: { symbol: string; return_30d?: number | null; vol_annual?: number | null }[];
  correlation_labels: string[];
  correlation: (number | null)[][];
};

export type QualityResponse = {
  symbol: string;
  missing_days: number;
  outliers: string[];
  jump_days: string[];
};

export type MarketEvent = { date: string; title: string; category: string; symbols: string[] };

export async function postCompare(symbols: string[], history_days = 365): Promise<CompareResponse> {
  const res = await netFetch(`${getBase()}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols, history_days }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return (await res.json()) as CompareResponse;
}

export async function fetchQuality(symbol: string, history_days = 365): Promise<QualityResponse> {
  const url = new URL("/quality", getBase());
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("history_days", String(history_days));
  const res = await netFetch(url.toString());
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return (await res.json()) as QualityResponse;
}

export async function fetchEvents(from?: string, to?: string): Promise<MarketEvent[]> {
  const url = new URL("/events", getBase());
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);
  const res = await netFetch(url.toString());
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  const j = (await res.json()) as { events?: MarketEvent[] };
  return j.events ?? [];
}

export type EventImpactResponse = {
  symbol: string;
  event_date: string;
  category: string;
  event_title?: string | null;
  window_days: number;
  historical_samples: number;
  avg_event_return_pct?: number | null;
  median_event_return_pct?: number | null;
  model_forecast_return_pct?: number | null;
  direction: "up" | "down" | "neutral";
  direction_label: string;
  summary: string;
  similar_events: string[];
};

export async function fetchEventImpact(body: {
  symbol: string;
  event_date: string;
  category: string;
  event_title?: string;
  window_days?: number;
}): Promise<EventImpactResponse> {
  const res = await netFetch(`${getBase()}/events/impact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return (await res.json()) as EventImpactResponse;
}

export async function postFeedback(body: {
  message: string;
  rating?: number;
  email?: string;
  endpoint?: string;
}): Promise<void> {
  const res = await netFetch(`${getBase()}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
}
