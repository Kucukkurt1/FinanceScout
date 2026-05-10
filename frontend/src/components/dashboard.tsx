"use client";

import { useEffect, useMemo, useState } from "react";

import { PriceChart, type ChartRow } from "@/components/price-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BacktestApiResponse, ForecastApiResponse, Metrics } from "@/lib/api";
import { fetchSymbols, postBacktest, postForecast } from "@/lib/api";

const ASSET_PRESETS = {
  crypto: "BTC-USD",
  fx: "EURUSD=X",
  stock: "THYAO.IS",
} as const;

function buildForecastChartData(res: ForecastApiResponse): ChartRow[] {
  const hist: ChartRow[] = res.history.map((h) => ({
    ds: h.ds,
    actual: h.y ?? undefined,
    fit: h.yhat ?? undefined,
    future: undefined,
    lower: h.yhat_lower ?? undefined,
    upper: h.yhat_upper ?? undefined,
  }));
  const fut: ChartRow[] = res.forecast.map((f) => ({
    ds: f.ds,
    actual: undefined,
    fit: undefined,
    future: f.yhat ?? undefined,
    lower: f.yhat_lower ?? undefined,
    upper: f.yhat_upper ?? undefined,
  }));
  return [...hist, ...fut];
}

function buildBacktestChartData(bt: BacktestApiResponse): ChartRow[] {
  const rows = new Map<string, ChartRow>();
  for (const a of bt.test_actual) {
    rows.set(a.ds, {
      ds: a.ds,
      actual: a.y ?? undefined,
      fit: undefined,
      future: undefined,
      lower: undefined,
      upper: undefined,
    });
  }
  for (const p of bt.test_predicted) {
    const cur = rows.get(p.ds) ?? { ds: p.ds };
    rows.set(p.ds, {
      ...cur,
      ds: p.ds,
      future: p.yhat ?? undefined,
      lower: p.yhat_lower ?? undefined,
      upper: p.yhat_upper ?? undefined,
    });
  }
  return Array.from(rows.values()).sort((a, b) => a.ds.localeCompare(b.ds));
}

function fmtNum(n: number | null | undefined, digits = 4) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtPct(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${(n * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

function riskFromVol(annual?: number | null) {
  if (annual === null || annual === undefined || Number.isNaN(annual)) {
    return { label: "Bilinmiyor", className: "bg-muted text-muted-foreground" };
  }
  if (annual < 0.15) return { label: "Düşük", className: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100" };
  if (annual < 0.35) return { label: "Orta", className: "bg-amber-500/15 text-amber-950 dark:text-amber-100" };
  return { label: "Yüksek", className: "bg-red-500/15 text-red-950 dark:text-red-100" };
}

function MetricsGrid({ m }: { m: Metrics }) {
  const risk = riskFromVol(m.volatility_annualized);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Card size="sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">RMSE (backtest)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-lg font-semibold tabular-nums">{fmtNum(m.rmse)}</CardContent>
      </Card>
      <Card size="sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">MAE (backtest)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-lg font-semibold tabular-nums">{fmtNum(m.mae)}</CardContent>
      </Card>
      <Card size="sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">Günlük volatilite</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-lg font-semibold tabular-nums">{fmtPct(m.volatility_daily)}</CardContent>
      </Card>
      <Card size="sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">Yıllıklandırılmış vol.</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-lg font-semibold tabular-nums">{fmtPct(m.volatility_annualized)}</CardContent>
      </Card>
      <Card size="sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground">Risk (vol. özeti)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <span className={`inline-flex rounded-md px-2 py-1 text-sm font-medium ${risk.className}`}>{risk.label}</span>
        </CardContent>
      </Card>
    </div>
  );
}

export function Dashboard() {
  const [symbol, setSymbol] = useState("BTC-USD");
  const [historyDays, setHistoryDays] = useState(365);
  const [forecastDays, setForecastDays] = useState(9);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastApiResponse | null>(null);
  const [backtest, setBacktest] = useState<BacktestApiResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSymbols()
      .then((s) => {
        if (!cancelled) setSuggestions(s);
      })
      .catch(() => {
        /* offline API — ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const forecastChart = useMemo(() => (forecast ? buildForecastChartData(forecast) : []), [forecast]);
  const backtestChart = useMemo(() => (backtest ? buildBacktestChartData(backtest) : []), [backtest]);

  async function run() {
    setError(null);
    setForecast(null);
    setBacktest(null);
    setLoading(true);
    try {
      const sym = symbol.trim().toUpperCase();
      if (!sym) throw new Error("Sembol gerekli.");

      const fc = await postForecast({
        symbol: sym,
        history_days: historyDays,
        forecast_days: forecastDays,
      });
      setForecast(fc);

      try {
        const bt = await postBacktest({
          symbol: sym,
          history_days: historyDays,
          test_fraction: 0.2,
        });
        setBacktest(bt);
      } catch (be) {
        setBacktest(null);
        const msg = be instanceof Error ? be.message : String(be);
        setError(`Tahmin oluşturuldu; backtest başarısız: ${msg}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">FinanceScout</h1>
        <p className="max-w-3xl text-muted-foreground">
          Yahoo Finance geçmiş verisi ile Prophet tabanlı kısa ufuk tahmini, basit backtest ve RMSE / MAE / volatilite
          özeti.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Sorgu</CardTitle>
          <CardDescription>Döviz, kripto ve hisse için Yahoo Finance ticker girin (ör. BTC-USD, EURUSD=X, THYAO.IS).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Hızlı varlık:</span>
            {(Object.keys(ASSET_PRESETS) as Array<keyof typeof ASSET_PRESETS>).map((k) => (
              <Button key={k} type="button" variant="outline" size="sm" onClick={() => setSymbol(ASSET_PRESETS[k])}>
                {k === "crypto" ? "Kripto" : k === "fx" ? "Döviz" : "Hisse"}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2 md:col-span-1">
              <Label htmlFor="symbol">Sembol</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="BTC-USD"
                autoComplete="off"
              />
              {suggestions.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Örnekler: {suggestions.slice(0, 6).join(", ")}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hist">Geçmiş (gün)</Label>
              <Input
                id="hist"
                type="number"
                min={60}
                max={3650}
                value={historyDays}
                onChange={(e) => setHistoryDays(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fh">Tahmin ufku (gün)</Label>
              <Input
                id="fh"
                type="number"
                min={1}
                max={90}
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t border-border/60 pt-4">
          <Button type="button" variant="secondary" disabled={loading} onClick={run}>
            {loading ? "Çalışıyor…" : "Analiz et"}
          </Button>
        </CardFooter>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-[380px] w-full rounded-xl" />
        </div>
      ) : null}

      {forecast && !loading ? (
        <>
          <MetricsGrid m={forecast.backtest_metrics} />

          <Tabs defaultValue="forecast">
            <TabsList variant="line">
              <TabsTrigger value="forecast">Tahmin grafiği</TabsTrigger>
              <TabsTrigger value="backtest">Backtest (test kümesi)</TabsTrigger>
            </TabsList>
            <TabsContent value="forecast" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{forecast.symbol}</CardTitle>
                  <CardDescription>
                    Mavi: kapanış fiyatı (geçmiş). Açık mavi çizgi: model uyumu. Turuncu: gelecek tahmini (Prophet).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PriceChart data={forecastChart} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="backtest" className="mt-4">
              {backtest ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Backtest — son %20 pencere</CardTitle>
                    <CardDescription>Gerçekleşen test günleri ile model çıktısı hizalanarak RMSE / MAE hesaplanır.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PriceChart data={backtestChart} />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-sm text-muted-foreground">
                    Backtest verisi yüklenemedi. Geçmiş gün sayısını artırıp tekrar deneyin.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
