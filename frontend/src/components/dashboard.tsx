"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  AnalysisHubPanels,
  type HubMode,
} from "@/components/tools/analysis-hub-panels";

import { SITE_NAV_CLEARANCE } from "@/components/site/page-header";
import { PriceChart, type ChartRow } from "@/components/price-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AssetClassParam, BacktestApiResponse, ForecastApiResponse, SymbolSearchResult } from "@/lib/api";
import { fetchSymbolSearch, postBacktest, postForecast } from "@/lib/api";
import { STORAGE_KEYS, writeJson, type LastAnalysisSnapshot } from "@/lib/storage";
import {
  INSTRUMENT_CATEGORY_META,
  INSTRUMENTS_BY_CATEGORY,
  getAllInstruments,
  inferInstrumentFromSymbol,
  type InstrumentCategoryId,
  type InstrumentOption,
} from "@/lib/instruments";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  DatabaseZap,
  Globe,
  LineChart,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

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
    return { label: "Belirsiz", className: "bg-white/10 text-white/60" };
  }
  if (annual < 0.15)
    return {
      label: "Düşük Risk (Sakin)",
      className:
        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    };
  if (annual < 0.35)
    return {
      label: "Orta Risk",
      className:
        "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    };
  return {
    label: "Yüksek Risk",
    className:
      "bg-rose-500/20 text-rose-400 border border-rose-500/30",
  };
}

function assetLabelTr(ac: string) {
  if (ac === "crypto") return "Kripto";
  if (ac === "fx") return "Döviz";
  if (ac === "stock") return "Hisse senedi";
  return ac;
}

type SearchRow = InstrumentOption & {
  exchange?: string | null;
  quoteType?: string | null;
  source?: string;
};

function quoteTypeLabel(type?: string | null) {
  const normalized = type?.toUpperCase();
  if (!normalized) return "Yahoo";
  if (normalized.includes("CRYPTO")) return "Kripto";
  if (normalized.includes("CURRENCY") || normalized === "FX") return "Döviz";
  if (normalized.includes("ETF")) return "ETF";
  if (normalized.includes("INDEX")) return "Endeks";
  if (normalized.includes("FUTURE")) return "Vadeli";
  if (normalized.includes("EQUITY") || normalized === "STOCK") return "Hisse";
  return type;
}

function rowFromSearchResult(result: SymbolSearchResult, fallback?: InstrumentOption): SearchRow {
  const symbol = result.symbol.trim().toUpperCase();
  const inferred = inferInstrumentFromSymbol(symbol);
  return {
    symbol,
    label: result.name?.trim() || fallback?.label || symbol,
    profile: fallback?.profile ?? inferred.profile,
    exchange: result.exchange,
    quoteType: result.quote_type,
    source: result.source,
  };
}

const HUB_MODES: HubMode[] = ["compare", "portfolio", "calendar"];

const WORKSPACE_TABS: { id: "forecast" | HubMode; label: string }[] = [
  { id: "forecast", label: "Tahmin" },
  { id: "compare", label: "Karşılaştır" },
  { id: "portfolio", label: "Portföy taslağı" },
  { id: "calendar", label: "Olay takvimi" },
];

export function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState("USDTRY=X");
  const [assetClass, setAssetClass] = useState<AssetClassParam>("fx");
  const [pickerCategory, setPickerCategory] = useState<InstrumentCategoryId>("fx");
  const [pickerQuery, setPickerQuery] = useState("");
  const [historyDays, setHistoryDays] = useState(365);
  const [forecastDays, setForecastDays] = useState(9);
  const [useTrainCutoff, setUseTrainCutoff] = useState(false);
  const [trainUntil, setTrainUntil] = useState("2022-12-31");
  const [dataStart] = useState("");
  const [suggestions, setSuggestions] = useState<SymbolSearchResult[]>([]);
  const [symbolSearchLoading, setSymbolSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastApiResponse | null>(null);
  const [backtest, setBacktest] = useState<BacktestApiResponse | null>(null);

  const workspaceParam = searchParams.get("workspace");
  const workspace: "forecast" | HubMode =
    workspaceParam && HUB_MODES.includes(workspaceParam as HubMode)
      ? (workspaceParam as HubMode)
      : "forecast";

  function goWorkspace(next: "forecast" | HubMode) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "forecast") params.delete("workspace");
    else params.set("workspace", next);
    const qs = params.toString();
    router.replace(qs ? `/analiz?${qs}` : "/analiz");
  }

  useEffect(() => {
    const sym = searchParams.get("symbol");
    const ac = searchParams.get("asset_class") as AssetClassParam | null;
    const hist = searchParams.get("history");
    const fc = searchParams.get("forecast");
    const cutoff = searchParams.get("cutoff");
    const tu = searchParams.get("train_until");

    window.queueMicrotask(() => {
      if (sym) {
        const upper = sym.trim().toUpperCase();
        setSymbol(upper);
        const inferred = inferInstrumentFromSymbol(upper);
        setPickerCategory(inferred.category);
        if (ac && ["auto", "crypto", "fx", "stock"].includes(ac)) setAssetClass(ac);
        else setAssetClass(inferred.profile);
      } else if (ac && ["auto", "crypto", "fx", "stock"].includes(ac)) {
        setAssetClass(ac);
      }

      if (hist) setHistoryDays(Number(hist));
      if (fc) setForecastDays(Number(fc));
      if (cutoff === "1" || tu) {
        setUseTrainCutoff(true);
        if (tu) setTrainUntil(tu);
      }
    });

    if (searchParams.get("run") === "1" && workspace !== "forecast") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("workspace");
      router.replace(`/analiz?${params.toString()}`);
    }
  }, [searchParams, workspace, router]);

  const autoRunInflight = useRef<string | null>(null);

  useEffect(() => {
    if (searchParams.get("run") !== "1") {
      autoRunInflight.current = null;
      return;
    }
    if (workspace !== "forecast") return;

    const symParam = searchParams.get("symbol")?.trim().toUpperCase();
    if (!symParam || autoRunInflight.current === symParam) return;

    autoRunInflight.current = symParam;
    const inferred = inferInstrumentFromSymbol(symParam);
    setSymbol(symParam);
    setAssetClass(inferred.profile);
    setPickerCategory(inferred.category);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("run");
    const qs = params.toString();
    router.replace(qs ? `/analiz?${qs}` : "/analiz", { scroll: false });

    void run({ symbol: symParam, asset_class: inferred.profile }).finally(() => {
      if (autoRunInflight.current === symParam) autoRunInflight.current = null;
    });
  }, [searchParams, workspace, router]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSymbolSearchLoading(true);
      fetchSymbolSearch(pickerQuery)
        .then((s) => {
          if (!cancelled) setSuggestions(s);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setSymbolSearchLoading(false);
        });
    }, pickerQuery.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pickerQuery]);

  const forecastChart = useMemo(() => (forecast ? buildForecastChartData(forecast) : []), [forecast]);
  const backtestChart = useMemo(() => (backtest ? buildBacktestChartData(backtest) : []), [backtest]);

  const symUpper = symbol.trim().toUpperCase();
  const allInstruments = useMemo(() => getAllInstruments(), []);

  const filteredPickerRows = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const localList = q
      ? allInstruments.filter((row) => row.label.toLowerCase().includes(q) || row.symbol.toLowerCase().includes(q))
      : INSTRUMENTS_BY_CATEGORY[pickerCategory];

    const rows = new Map<string, SearchRow>();
    const addRow = (row: SearchRow) => rows.set(row.symbol, row);

    if (q) {
      for (const result of suggestions) {
        const upper = result.symbol.trim().toUpperCase();
        const localHit = allInstruments.find((row) => row.symbol === upper);
        addRow(rowFromSearchResult(result, localHit));
      }
    }

    const typedRaw = pickerQuery.trim();
    const looksLikeSymbol =
      /[.\-^=]/.test(typedRaw) ||
      (/^[A-Za-z][A-Za-z0-9]{0,5}$/.test(typedRaw) && typedRaw === typedRaw.toUpperCase());
    if (q && looksLikeSymbol && !suggestions.some((s) => s.symbol.toUpperCase() === typedRaw.toUpperCase())) {
      const typed = typedRaw.toUpperCase();
      const inferred = inferInstrumentFromSymbol(typed);
      addRow({
        symbol: typed,
        label: "Yazdığınız sembolü kullan",
        profile: inferred.profile,
        exchange: "Manuel",
        quoteType: "TICKER",
        source: "typed",
      });
    }

    for (const row of localList) addRow({ ...row, exchange: "Öne çıkan", quoteType: row.profile, source: "local" });
    return Array.from(rows.values()).slice(0, q ? 30 : 14);
  }, [allInstruments, pickerCategory, pickerQuery, suggestions]);

  const pickerSelectionLabel = useMemo(() => {
    for (const { id } of INSTRUMENT_CATEGORY_META) {
      const hit = INSTRUMENTS_BY_CATEGORY[id].find((r) => r.symbol === symUpper);
      if (hit) return hit.label;
    }
    return null;
  }, [symUpper]);

  const activeSearchRow = useMemo(
    () => filteredPickerRows.find((row) => row.symbol === symUpper) ?? null,
    [filteredPickerRows, symUpper],
  );

  const lastHistoryPoint = forecast ? [...forecast.history].reverse().find((p) => p.y != null) : null;
  const lastForecastPoint = forecast ? [...forecast.forecast].reverse().find((p) => p.yhat != null) : null;
  const expectedChange =
    lastHistoryPoint?.y && lastForecastPoint?.yhat
      ? (lastForecastPoint.yhat - lastHistoryPoint.y) / lastHistoryPoint.y
      : null;

  async function run(overrides?: { symbol?: string; asset_class?: AssetClassParam }) {
    setError(null);
    setForecast(null);
    setBacktest(null);

    const finalHistory = Math.min(Math.max(historyDays, 60), 3650);
    const finalForecast = Math.min(Math.max(forecastDays, 1), 90);

    setHistoryDays(finalHistory);
    setForecastDays(finalForecast);

    setLoading(true);
    try {
      const sym = (overrides?.symbol ?? symbol).trim().toUpperCase();
      if (!sym) throw new Error("Lütfen bir sembol yazın (örnek: BTC-USD).");

      const ac = overrides?.asset_class ?? assetClass;

      const fc = await postForecast({
        symbol: sym,
        history_days: finalHistory,
        forecast_days: finalForecast,
        asset_class: ac,
        ...(useTrainCutoff && trainUntil.trim()
          ? { train_until: trainUntil.trim(), data_start: dataStart.trim() || undefined }
          : {}),
      });
      setForecast(fc);
      writeJson(STORAGE_KEYS.lastAnalysis, {
        symbol: sym,
        asset_class: fc.asset_class,
        history_days: finalHistory,
        forecast_days: finalForecast,
        train_until: useTrainCutoff ? trainUntil.trim() : undefined,
        forecast: fc,
        saved_at: new Date().toISOString(),
      } satisfies LastAnalysisSnapshot);

      const holdoutReady =
        Boolean(fc.train_until_used) &&
        Boolean(fc.holdout_actual?.length) &&
        Boolean(fc.holdout_predicted?.length);

      if (holdoutReady && fc.holdout_actual && fc.holdout_predicted) {
        setBacktest({
          symbol: fc.symbol,
          asset_class: fc.asset_class,
          metrics: fc.backtest_metrics,
          test_actual: fc.holdout_actual,
          test_predicted: fc.holdout_predicted,
        });
      } else {
        try {
          const bt = await postBacktest({
            symbol: sym,
            history_days: finalHistory,
            test_fraction: 0.2,
            asset_class: ac,
            ...(useTrainCutoff && trainUntil.trim()
              ? { train_until: trainUntil.trim(), data_start: dataStart.trim() || undefined }
              : {}),
          });
          setBacktest(bt);
        } catch (be) {
          setBacktest(null);
          const msg = be instanceof Error ? be.message : String(be);
          setError(
            `Ana tahmin hazır; «Geçmişe dönük test» sekmesi için ek grafik alınamadı. Geçmiş aralığını veya kesit tarihini kontrol edin. (${msg})`,
          );
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        msg ||
          "İstek başarısız oldu. Sembolün doğru olduğundan emin olun; veri servisinin erişilebilir olduğunu kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  }

  const showEmptyHint = workspace === "forecast" && !forecast && !loading;

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-[98rem] items-start gap-6 px-4 pb-24 pt-0 sm:px-6 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:gap-8",
        SITE_NAV_CLEARANCE,
      )}
    >
      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-sky-950/20 backdrop-blur-xl">
          <div className="absolute -right-20 -top-20 size-52 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-6 size-48 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative space-y-5">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200">
                <DatabaseZap className="size-3.5" />
                Yahoo Finance arama
              </div>
              <h2 className="font-heading text-2xl font-bold leading-tight text-white">
                İstediğiniz varlığı yazın, anında bulun.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Dolar, altın, Tesla, Bitcoin… Aklınıza ne geliyorsa yazmanız yeter. Seçtiğiniz anda geçmiş veriler ve
                AI tahmini hazır olur.
              </p>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Varlık ara</Label>
                {symbolSearchLoading ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-sky-300">
                    <Loader2 className="size-3 animate-spin" />
                    Yahoo aranıyor
                  </span>
                ) : null}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                <Input
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="dinar, altın, petrol, Tesla, USDTRY=X..."
                  className="h-14 rounded-2xl border-white/10 bg-black/30 pl-11 pr-24 text-sm text-white placeholder:text-white/30 focus-visible:ring-sky-400/30"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const typed = pickerQuery.trim().toUpperCase();
                    if (!typed) return;
                    const first = filteredPickerRows[0];
                    const inferred = inferInstrumentFromSymbol(first?.symbol ?? typed);
                    setSymbol(first?.symbol ?? typed);
                    setAssetClass(first?.profile ?? inferred.profile);
                    setPickerCategory(inferred.category);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const typed = pickerQuery.trim().toUpperCase();
                    if (!typed) return;
                    const first = filteredPickerRows[0];
                    const inferred = inferInstrumentFromSymbol(first?.symbol ?? typed);
                    setSymbol(first?.symbol ?? typed);
                    setAssetClass(first?.profile ?? inferred.profile);
                    setPickerCategory(inferred.category);
                  }}
                  className="absolute right-2 top-2 rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-primary transition hover:bg-sky-100"
                >
                  Seç
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-1">
                {filteredPickerRows.map((row) => {
                  const active = symUpper === row.symbol;
                  const inferred = inferInstrumentFromSymbol(row.symbol);
                  return (
                    <button
                      key={row.symbol}
                      type="button"
                      onClick={() => {
                        setSymbol(row.symbol);
                        setAssetClass(row.profile);
                        setPickerCategory(inferred.category);
                      }}
                      className={cn(
                        "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-all",
                        active
                          ? "bg-sky-400/15 ring-1 ring-sky-300/30"
                          : "hover:bg-white/[0.06]",
                      )}
                    >
                      <span className="min-w-0">
                        <span className={cn("block truncate text-sm font-bold", active ? "text-white" : "text-white/90")}>
                          {row.label}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-medium text-white/40">
                          <span className="font-mono text-sky-200/80">{row.symbol}</span>
                          <span>{row.exchange ?? "Yahoo Finance"}</span>
                          <span>{quoteTypeLabel(row.quoteType)}</span>
                        </span>
                      </span>
                      {active ? (
                        <CheckCircle2 className="size-4 shrink-0 text-sky-300" />
                      ) : (
                        <span className="size-1.5 shrink-0 rounded-full bg-white/20 transition group-hover:bg-sky-300" />
                      )}
                    </button>
                  );
                })}
                {filteredPickerRows.length === 0 ? (
                  <div className="px-4 py-6 text-xs leading-relaxed text-white/45">
                    Yahoo Finance sonucu bulunamadı. Sembolü biliyorsanız doğrudan yazıp <strong className="text-white/70">Seç</strong> butonuna basabilirsiniz.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Seçili varlık</Label>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/60">
                  {assetLabelTr(assetClass)}
                </span>
              </div>
              <div className="rounded-2xl bg-black/25 p-4">
                <p className="truncate text-sm font-semibold text-white">{pickerSelectionLabel ?? activeSearchRow?.label ?? "Özel sembol"}</p>
                <Input
                  value={symbol}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSymbol(next);
                    const inferred = inferInstrumentFromSymbol(next);
                    setAssetClass(inferred.profile);
                    setPickerCategory(inferred.category);
                  }}
                  placeholder="BTC-USD, GBPTRY=X, AAPL..."
                  className="mt-3 h-11 rounded-xl border-white/10 bg-white/5 font-mono text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Geçmiş gün</Label>
                <Input
                  type="number"
                  value={historyDays}
                  onChange={(e) => setHistoryDays(Number(e.target.value))}
                  className="h-10 border-white/10 bg-black/25 text-white"
                />
              </div>
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Tahmin gün</Label>
                <Input
                  type="number"
                  value={forecastDays}
                  onChange={(e) => setForecastDays(Number(e.target.value))}
                  className="h-10 border-white/10 bg-black/25 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {INSTRUMENT_CATEGORY_META.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPickerCategory(c.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-[11px] font-bold transition-all",
                    pickerCategory === c.id
                      ? "border-white/30 bg-white text-primary"
                      : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>

            <Button
              onClick={() => void run()}
              disabled={loading}
              className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-14 w-full rounded-2xl shadow-2xl shadow-sky-500/10")}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Model hesaplıyor
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Grafiği ve tahmini oluştur
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
            {error}
          </div>
        )}
      </aside>

      <main className="min-h-[600px] min-w-0 w-full space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
          <div className="absolute right-0 top-0 size-72 translate-x-1/3 -translate-y-1/2 rounded-full bg-sky-400/15 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                <Boxes className="size-3.5 text-sky-300" />
                Sınırsız Yahoo Finance kapsamı
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-white md:text-5xl">
                Aradığınız varlığı bulun, modeli anında grafiğe dökün.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/55 md:text-base">
                Sistem artık sabit listeye bağlı değil. Yahoo Finance aramasıyla döviz, hisse, kripto, emtia ve endeks sembollerini seçebilir; aynı tahmin ve backtest akışında çalıştırabilirsiniz.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Kaynak", value: "Yahoo" },
                { label: "Kapsam", value: "Global" },
                { label: "Model", value: "AI" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => goWorkspace(tab.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all",
                workspace === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {workspace !== "forecast" ? (
          <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <AnalysisHubPanels mode={workspace} />
          </div>
        ) : null}

        {showEmptyHint && (
          <div className="flex h-full min-h-[560px] flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.035] p-10 text-center md:p-20">
            <div className="mb-8 flex size-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sky-300/80">
              <LineChart className="size-10" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white">Aradığınız varlığı seçin, grafik hazır olsun</h3>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-white/45">
              Sol panele istediğinizi yazın: dolar, altın, Tesla, Bitcoin… Listeden seçtiğiniz anda geçmiş veriler, AI
              tahmini ve geriye dönük test grafiği otomatik ekrana gelir.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["KWDTRY=X", "GC=F", "BTC-USD", "TSLA", "BZ=F"].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    const inferred = inferInstrumentFromSymbol(sample);
                    setSymbol(sample);
                    setAssetClass(inferred.profile);
                    setPickerCategory(inferred.category);
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs font-bold text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}

        {workspace === "forecast" && loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-3xl bg-white/5 border border-white/10" />
              ))}
            </div>
            <Skeleton className="h-[500px] rounded-[40px] bg-white/5 border border-white/10" />
          </div>
        )}

        {workspace === "forecast" && forecast && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            {/* Metrik Kartları */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
               {[
                 { label: "Beklenen değişim", value: expectedChange === null ? "—" : fmtPct(expectedChange), icon: TrendingUp, iconColor: "text-emerald-300" },
                 { label: "Hata Payı (RMSE)", value: fmtNum(forecast.backtest_metrics.rmse), icon: BarChart3, iconColor: "text-sky-300" },
                 { label: "Yıllık oynaklık", value: fmtPct(forecast.backtest_metrics.volatility_annualized), icon: Globe, iconColor: "text-indigo-300" },
                 { label: "Risk Skoru", value: riskFromVol(forecast.backtest_metrics.volatility_annualized).label, badge: true, icon: ShieldCheck, iconColor: "text-amber-300" }
               ].map((m) => (
                 <div key={m.label} className="group rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10">
                    <div className="flex items-center justify-between mb-3">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{m.label}</p>
                       {m.icon && <m.icon className={cn("size-4 opacity-40 transition-opacity group-hover:opacity-100", m.iconColor)} />}
                    </div>
                    <div className="flex items-baseline gap-2">
                       {!m.badge && <span className="text-2xl font-bold text-white tabular-nums">{m.value}</span>}
                    </div>
                    {m.badge && (
                      <span className={cn(
                        "mt-1 inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase",
                        riskFromVol(forecast.backtest_metrics.volatility_annualized).className
                      )}>
                        {m.value}
                      </span>
                    )}
                 </div>
               ))}
            </div>

            {/* Grafik Alanı */}
            <div className="w-full min-w-0 rounded-[40px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
               <Tabs defaultValue="forecast">
                  <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                     <div>
                        <div className="flex items-center gap-3">
                           <h3 className="font-heading text-3xl font-bold text-white">{forecast.symbol} Analizi</h3>
                           <div className="rounded-full bg-sky-500/10 px-3 py-1 text-[10px] font-bold text-sky-400 uppercase tracking-tighter border border-sky-500/20">
                              {assetLabelTr(forecast.asset_class)}
                           </div>
                           {forecast.backtest_metrics.regime ? (
                             <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/80 uppercase">
                               {forecast.backtest_metrics.regime === "high_vol" ? "Yüksek vol rejimi" : "Düşük vol rejimi"}
                             </div>
                           ) : null}
                        </div>
                        <p className="mt-2 text-sm font-medium text-white/50">
                           Yapay zeka modellerimiz tarafından oluşturulan öngörü raporu.
                        </p>
                     </div>
                     <TabsList className="bg-white/5 p-1 rounded-none border border-white/10">
                        <TabsTrigger value="forecast" className="rounded-none px-6 py-2 text-xs font-bold text-white transition-all data-active:!bg-blue-500/20 data-active:!text-blue-400 hover:bg-blue-500/10 hover:!text-white">Tahmin</TabsTrigger>
                        <TabsTrigger value="backtest" className="rounded-none px-6 py-2 text-xs font-bold text-white transition-all uppercase data-active:!bg-blue-500/20 data-active:!text-blue-400 hover:bg-blue-500/10 hover:!text-white">Geriye Dönük Test</TabsTrigger>
                     </TabsList>
                  </div>

                  <TabsContent value="forecast" className="mt-0 w-full min-w-0 outline-none">
                     <PriceChart data={forecastChart} className="w-full" />
                     <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-sky-500/10 p-5 border border-sky-500/20">
                        <div className="flex items-center gap-3">
                           <div className="size-2 rounded-full bg-white animate-pulse" />
                           <p className="text-xs font-medium text-sky-200">
                              <strong>Kılavuz:</strong> Beyaz çizgi gerçek verileri, renkli kalın çizgi AI tahminini simgeler.
                           </p>
                        </div>
                        <span className="text-[10px] font-bold text-sky-300 uppercase tracking-widest">Canlı Veri Yayını</span>
                     </div>
                  </TabsContent>

                  <TabsContent value="backtest" className="mt-0 w-full min-w-0 outline-none">
                     {backtest ? (
                       <PriceChart data={backtestChart} className="w-full" />
                     ) : (
                       <div className="flex min-h-[420px] items-center justify-center text-white/20">
                         Veri bulunamadı.
                       </div>
                     )}
                     <div className="mt-8 rounded-2xl bg-purple-500/10 p-6 border border-purple-500/20">
                        <h4 className="text-purple-200 font-bold text-sm mb-2 uppercase tracking-wide">Bu Tarihler Neyi Gösteriyor?</h4>
                        <p className="text-xs font-medium text-purple-200/80 leading-relaxed">
                           Geriye Dönük Test, seçtiğiniz toplam geçmiş sürenin (örn. 500 gün) <strong>son %20&apos;lik dilimini</strong> kapsar. 
                           Sistem, verinin ilk %80&apos;ini &quot;öğrenmek&quot; için kullanır; kalan son bölümü ise hiç görmemiş gibi davranarak tahmin eder. 
                           Yukarıdaki grafikte gördüğünüz tarihler, modelin bu &quot;kör test&quot; sürecinde gerçek fiyatlara ne kadar yaklaştığını kanıtlayan <strong>doğrulama penceresidir.</strong>
                        </p>
                     </div>
                  </TabsContent>
               </Tabs>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

