const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  volatility_daily?: number | null;
  volatility_annualized?: number | null;
};

export type ForecastApiResponse = {
  symbol: string;
  history: SeriesPoint[];
  forecast: SeriesPoint[];
  backtest_metrics: Metrics;
};

export type BacktestApiResponse = {
  symbol: string;
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

export async function fetchSymbols(q?: string): Promise<string[]> {
  const url = new URL("/symbols/search", BASE);
  if (q?.trim()) url.searchParams.set("q", q.trim());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  const j = (await res.json()) as { symbols?: string[] };
  return j.symbols ?? [];
}

export async function postForecast(body: {
  symbol: string;
  history_days: number;
  forecast_days: number;
}): Promise<ForecastApiResponse> {
  const res = await fetch(`${BASE}/forecast`, {
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
}): Promise<BacktestApiResponse> {
  const res = await fetch(`${BASE}/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return (await res.json()) as BacktestApiResponse;
}
