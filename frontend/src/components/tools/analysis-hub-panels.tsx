"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, BarChart3, Bot, CalendarClock, Plus, Trash2, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EventsCalendar } from "@/components/tools/events-calendar";
import { SymbolPicker } from "@/components/tools/symbol-picker";
import { DisclaimerBanner } from "@/components/site/disclaimer-banner";
import { PriceChart, type ChartRow } from "@/components/price-chart";
import {
  postCompare,
  postForecast,
  type CompareResponse,
  type ForecastApiResponse,
} from "@/lib/api";
import type { InstrumentOption } from "@/lib/instruments";
import { inferInstrumentFromSymbol } from "@/lib/instruments";
import { cn } from "@/lib/utils";

export type HubMode = "compare" | "portfolio" | "calendar";

export function AnalysisHubPanels({ mode }: { mode: HubMode }) {
  if (mode === "compare") return <ComparePanel />;
  if (mode === "portfolio") return <PortfolioPanel />;
  if (mode === "calendar") return <EventsCalendar />;
  return null;
}

/* ------------------------- yardımcılar ------------------------- */

function fmtNumber(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: digits });
}

function fmtTRY(n: number | null | undefined, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: digits })} ₺`;
}

function fmtPct(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toLocaleString("tr-TR", { maximumFractionDigits: digits })}%`;
}

/** Recharts Tooltip formatter — value undefined veya string gelebilir */
function fmtRechartsTry(value: unknown): string {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return `${value.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`;
  }
  if (value != null && value !== "") {
    const n = Number(value);
    if (!Number.isNaN(n)) {
      return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺`;
    }
  }
  return "—";
}

function lastNonNull<T extends { y?: number | null; yhat?: number | null }>(arr: T[], key: "y" | "yhat"): T | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i][key];
    if (v != null && !Number.isNaN(v)) return arr[i];
  }
  return null;
}

function buildForecastChart(res: ForecastApiResponse, historyTail = 180): ChartRow[] {
  const hist: ChartRow[] = res.history.slice(-historyTail).map((h) => ({
    ds: h.ds,
    actual: h.y ?? undefined,
    fit: h.yhat ?? undefined,
    lower: h.yhat_lower ?? undefined,
    upper: h.yhat_upper ?? undefined,
  }));
  const fut: ChartRow[] = res.forecast.map((f) => ({
    ds: f.ds,
    future: f.yhat ?? undefined,
    lower: f.yhat_lower ?? undefined,
    upper: f.yhat_upper ?? undefined,
  }));
  return [...hist, ...fut];
}

function volLabel(annual: number | null | undefined) {
  if (annual == null || Number.isNaN(annual))
    return { label: "Belirsiz", className: "bg-white/10 text-white/60 border-white/15" };
  if (annual < 0.15)
    return { label: "Sakin", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
  if (annual < 0.35)
    return { label: "Orta", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
  return { label: "Yüksek", className: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
}

function corrLabel(corr: number | null) {
  if (corr == null || Number.isNaN(corr)) return { text: "Yetersiz veri", tone: "neutral" as const };
  if (corr > 0.65) return { text: "Çok güçlü pozitif birlikte hareket", tone: "warm" as const };
  if (corr > 0.3) return { text: "Orta düzey pozitif ilişki", tone: "warm" as const };
  if (corr > -0.3) return { text: "Belirgin ilişki yok / ayrışma var", tone: "neutral" as const };
  if (corr > -0.65) return { text: "Orta düzey ters hareket", tone: "cool" as const };
  return { text: "Çok güçlü ters hareket", tone: "cool" as const };
}

/* ------------------------- Karşılaştır ------------------------- */

type CompareRow = {
  symbol: string;
  label: string;
  current: number | null;
  target: number | null;
  lower: number | null;
  upper: number | null;
  changePct: number | null;
  return30d: number | null;
  volAnnual: number | null;
  rmse: number | null;
  chart: ChartRow[];
};

const COMPARE_HORIZONS: { id: number; label: string; help: string }[] = [
  { id: 14, label: "2 hafta", help: "Kısa vadeli görünüm" },
  { id: 30, label: "1 ay", help: "Aylık eğilim" },
  { id: 90, label: "3 ay", help: "Çeyreklik ufuk" },
  { id: 180, label: "6 ay", help: "Orta vade" },
];

function ComparePanel() {
  const [a, setA] = useState<string | null>("USDTRY=X");
  const [aLabel, setALabel] = useState("ABD Doları");
  const [b, setB] = useState<string | null>("EURTRY=X");
  const [bLabel, setBLabel] = useState("Euro");
  const [horizon, setHorizon] = useState(30);
  const [compare, setCompare] = useState<CompareResponse | null>(null);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const correlation = useMemo(() => {
    if (!compare?.correlation || compare.correlation.length < 2) return null;
    return compare.correlation[0][1] ?? null;
  }, [compare]);

  async function run() {
    if (!a || !b || a === b) {
      setError("Lütfen birbirinden farklı iki varlık seçin.");
      return;
    }
    setError(null);
    setLoading(true);
    setRows([]);
    setCompare(null);
    try {
      const symbols = [a, b];
      const [cmp, fcA, fcB] = await Promise.all([
        postCompare(symbols, 365),
        postForecast({ symbol: a, history_days: 365, forecast_days: horizon, asset_class: "auto" }),
        postForecast({ symbol: b, history_days: 365, forecast_days: horizon, asset_class: "auto" }),
      ]);

      const toRow = (fc: ForecastApiResponse, label: string): CompareRow => {
        const lastHist = lastNonNull(fc.history, "y");
        const lastFc = lastNonNull(fc.forecast, "yhat");
        const cur = lastHist?.y ?? null;
        const tgt = lastFc?.yhat ?? null;
        const stat = cmp.symbols.find((s) => s.symbol === fc.symbol);
        return {
          symbol: fc.symbol,
          label,
          current: cur,
          target: tgt,
          lower: lastFc?.yhat_lower ?? null,
          upper: lastFc?.yhat_upper ?? null,
          changePct: cur && tgt ? (tgt - cur) / cur : null,
          return30d: stat?.return_30d ?? null,
          volAnnual: stat?.vol_annual ?? null,
          rmse: fc.backtest_metrics.rmse ?? null,
          chart: buildForecastChart(fc),
        };
      };

      setCompare(cmp);
      setRows([toRow(fcA, aLabel), toRow(fcB, bLabel)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Karşılaştırma yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  const horizonMeta = COMPARE_HORIZONS.find((h) => h.id === horizon) ?? COMPARE_HORIZONS[1];

  const aiComment = useMemo(() => {
    if (rows.length < 2) return null;
    const [r0, r1] = rows;
    const leader = (r0.changePct ?? 0) >= (r1.changePct ?? 0) ? r0 : r1;
    const laggard = leader === r0 ? r1 : r0;
    const corrInfo = corrLabel(correlation);
    const volA = volLabel(r0.volAnnual).label;
    const volB = volLabel(r1.volAnnual).label;
    const calmer =
      r0.volAnnual != null && r1.volAnnual != null
        ? r0.volAnnual <= r1.volAnnual
          ? r0
          : r1
        : null;

    const parts: string[] = [];
    parts.push(
      `${horizonMeta.label} ufkunda model, ${leader.label} tarafında daha güçlü görünüm üretiyor: beklenen değişim ${fmtPct(leader.changePct)}, karşılaştırılan ${laggard.label} için ise ${fmtPct(laggard.changePct)}.`,
    );
    parts.push(
      `Risk profili açısından ${r0.label} ${volA.toLowerCase()}, ${r1.label} ${volB.toLowerCase()} sınıfa giriyor${calmer ? ` — daha sakin olan ${calmer.label}` : ""}.`,
    );
    parts.push(`Son 1 yıllık veriye göre ${corrInfo.text.toLowerCase()} (korelasyon ${correlation != null ? correlation.toFixed(2) : "—"}).`);
    if (correlation != null && correlation > 0.65) {
      parts.push("İki varlık benzer yönlerde hareket ettiği için birlikte tutmak çeşitlendirmeyi azaltır.");
    } else if (correlation != null && correlation < -0.3) {
      parts.push("Ters yönlü hareket eğilimi, birinin diğerinin riskini kısmen dengelemesini sağlayabilir.");
    } else {
      parts.push("Hareketleri birbirinden kopuk olduğu için birlikte taşımak çeşitlendirme katkısı sunabilir.");
    }
    parts.push("Bu yorum bilgilendirme amaçlıdır; yatırım tavsiyesi değildir.");
    return parts.join(" ");
  }, [rows, correlation, horizonMeta]);

  const corrTone = corrLabel(correlation).tone;

  return (
    <div className="space-y-7">
      <DisclaimerBanner />

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-6">
          <h3 className="font-heading text-2xl font-bold text-white">İki varlığı karşılaştır</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            İki varlık seçin ve karşılaştırma süresini belirleyin. Performans, oynaklık, korelasyon ve AI yorumu tek
            ekranda gelir.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <SymbolPicker
            label="1. varlık"
            value={a}
            selectedLabel={aLabel}
            hideSelectedPreview
            onSelect={(row) => {
              setA(row.symbol);
              setALabel(row.label);
            }}
            placeholder="Dolar, altın, Tesla…"
          />
          <SymbolPicker
            label="2. varlık"
            value={b}
            selectedLabel={bLabel}
            hideSelectedPreview
            onSelect={(row) => {
              setB(row.symbol);
              setBLabel(row.label);
            }}
            placeholder="Euro, Bitcoin, THYAO…"
          />
        </div>

        <div className="mt-6">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Karşılaştırma ufku</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPARE_HORIZONS.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHorizon(h.id)}
                className={cn(
                  "rounded-xl border px-4 py-2 text-xs font-bold transition-all",
                  horizon === h.id
                    ? "border-sky-400/40 bg-sky-400/15 text-sky-100"
                    : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                {h.label}
                <span className="ml-2 text-[10px] font-medium text-white/40">{h.help}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="brand" size="lg" onClick={run} disabled={loading || !a || !b}>
            {loading ? "Hesaplanıyor…" : "Karşılaştır"}
          </Button>
          {error ? <span className="text-sm text-rose-300">{error}</span> : null}
        </div>
      </div>

      {rows.length === 2 ? (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            {rows.map((row) => {
              const positive = (row.changePct ?? 0) >= 0;
              const vol = volLabel(row.volAnnual);
              return (
                <section
                  key={row.symbol}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20"
                >
                  <div className="border-b border-white/10 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-heading text-xl font-bold text-white">{row.label}</h4>
                        <p className="mt-1 font-mono text-xs text-white/40">{row.symbol}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                          positive ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300",
                        )}
                      >
                        {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                        {fmtPct(row.changePct)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <Metric label="Güncel" value={fmtNumber(row.current, 4)} />
                      <Metric label={`Hedef · ${horizonMeta.label}`} value={fmtNumber(row.target, 4)} />
                      <Metric label="Son 30 gün" value={fmtPct(row.return30d)} />
                      <Metric
                        label="Yıllık oynaklık"
                        value={fmtPct(row.volAnnual)}
                        badge={<span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", vol.className)}>{vol.label}</span>}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <PriceChart data={row.chart} compact className="min-h-[260px]" />
                  </div>
                </section>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
            <div className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-indigo-500/5 p-6 shadow-xl shadow-sky-950/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200">
                <Bot className="size-3.5" />
                AI yorumu
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{aiComment}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                <BarChart3 className="size-3.5" />
                Korelasyon
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-mono text-4xl font-bold text-white">
                  {correlation != null ? correlation.toFixed(2) : "—"}
                </span>
                <span className="text-xs text-white/45">−1 ↔ +1</span>
              </div>
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    corrTone === "warm"
                      ? "bg-emerald-400"
                      : corrTone === "cool"
                        ? "bg-rose-400"
                        : "bg-white/30",
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(8, ((correlation ?? 0) + 1) * 50))}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/55">{corrLabel(correlation).text}.</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-bold tabular-nums text-white">{value}</span>
        {badge}
      </div>
    </div>
  );
}

/* --------------------- Portföy taslağı --------------------- */

type PortfolioLine = {
  id: string;
  symbol: string;
  label: string;
  investment: number;
};

type PortfolioRow = {
  symbol: string;
  label: string;
  investment: number;
  current: number;
  target: number;
  lower: number | null;
  upper: number | null;
  targetValue: number;
  gain: number;
  gainPct: number;
  volAnnual: number | null;
  trajectory: { ds: string; value: number }[];
  error?: string;
};

const HORIZON_OPTIONS: { id: number; label: string; sub: string }[] = [
  { id: 30, label: "1 ay", sub: "≈ 30 gün" },
  { id: 90, label: "3 ay", sub: "≈ 90 gün" },
  { id: 180, label: "6 ay", sub: "≈ 180 gün" },
  { id: 365, label: "1 yıl", sub: "≈ 365 gün" },
  { id: 540, label: "1.5 yıl", sub: "≈ 540 gün" },
  { id: 730, label: "2 yıl", sub: "≈ 730 gün" },
];

const PIE_COLORS = ["#38bdf8", "#fbbf24", "#a78bfa", "#34d399", "#f87171", "#60a5fa", "#f472b6", "#fb923c"];

let _pid = 0;
const nextId = () => `pf-${++_pid}`;

function PortfolioPanel() {
  const [horizon, setHorizon] = useState(180);
  const [customDate, setCustomDate] = useState<string>("");
  const [lines, setLines] = useState<PortfolioLine[]>([
    { id: nextId(), symbol: "BTC-USD", label: "Bitcoin", investment: 15000 },
    { id: nextId(), symbol: "THYAO.IS", label: "Türk Hava Yolları", investment: 10000 },
    { id: nextId(), symbol: "USDTRY=X", label: "ABD Doları / Türk Lirası", investment: 5000 },
  ]);
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ranHorizon, setRanHorizon] = useState<number>(horizon);

  const effectiveHorizon = useMemo(() => {
    if (!customDate) return horizon;
    const target = new Date(`${customDate}T00:00:00`);
    if (Number.isNaN(target.getTime())) return horizon;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(7, Math.min(730, days));
  }, [customDate, horizon]);

  const totalInvestment = useMemo(() => lines.reduce((a, l) => a + (Number.isFinite(l.investment) ? l.investment : 0), 0), [lines]);

  function addLine(row: InstrumentOption) {
    setLines((prev) => [...prev, { id: nextId(), symbol: row.symbol, label: row.label, investment: 5000 }]);
  }

  function updateInvestment(id: string, value: number) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, investment: value } : l)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  async function simulate() {
    if (lines.length === 0) {
      setError("Önce en az bir varlık ekleyin.");
      return;
    }
    if (totalInvestment <= 0) {
      setError("Toplam yatırım sıfırdan büyük olmalı.");
      return;
    }
    setError(null);
    setLoading(true);
    setRows([]);
    try {
      const horizonDays = effectiveHorizon;
      const fetched = await Promise.all(
        lines.map(async (line): Promise<PortfolioRow> => {
          try {
            const fc = await postForecast({
              symbol: line.symbol,
              history_days: 365,
              forecast_days: horizonDays,
              asset_class: "auto",
            });
            const lastHist = lastNonNull(fc.history, "y");
            const lastFc = lastNonNull(fc.forecast, "yhat");
            const current = lastHist?.y ?? 0;
            const target = lastFc?.yhat ?? current;
            const gainPct = current > 0 ? (target - current) / current : 0;
            const gain = line.investment * gainPct;
            const targetValue = line.investment * (1 + gainPct);

            const baseValue = line.investment;
            const trajectory: { ds: string; value: number }[] = [];
            if (current > 0) {
              for (const h of fc.history.slice(-90)) {
                if (h.y != null) trajectory.push({ ds: h.ds, value: (h.y / current) * baseValue });
              }
              for (const f of fc.forecast) {
                if (f.yhat != null) trajectory.push({ ds: f.ds, value: (f.yhat / current) * baseValue });
              }
            }

            return {
              symbol: fc.symbol,
              label: line.label,
              investment: line.investment,
              current,
              target,
              lower: lastFc?.yhat_lower ?? null,
              upper: lastFc?.yhat_upper ?? null,
              targetValue,
              gain,
              gainPct,
              volAnnual: fc.backtest_metrics.volatility_annualized ?? null,
              trajectory,
            };
          } catch (e) {
            return {
              symbol: line.symbol,
              label: line.label,
              investment: line.investment,
              current: 0,
              target: 0,
              lower: null,
              upper: null,
              targetValue: line.investment,
              gain: 0,
              gainPct: 0,
              volAnnual: null,
              trajectory: [],
              error: e instanceof Error ? e.message : "veri alınamadı",
            };
          }
        }),
      );
      setRows(fetched);
      setRanHorizon(horizonDays);
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    if (rows.length === 0) return null;
    const valid = rows.filter((r) => !r.error);
    const invested = valid.reduce((a, r) => a + r.investment, 0);
    const projected = valid.reduce((a, r) => a + r.targetValue, 0);
    const gain = projected - invested;
    const gainPct = invested > 0 ? gain / invested : 0;
    const weightedVol =
      valid.reduce((a, r) => a + (r.volAnnual ?? 0) * r.investment, 0) / Math.max(invested, 1);
    return { invested, projected, gain, gainPct, weightedVol, errorCount: rows.length - valid.length };
  }, [rows]);

  const trajectoryChart = useMemo(() => {
    if (rows.length === 0) return [];
    const valid = rows.filter((r) => !r.error && r.trajectory.length > 0);
    if (valid.length === 0) return [];
    const allDates = Array.from(
      new Set(valid.flatMap((r) => r.trajectory.map((p) => p.ds))),
    ).sort();
    return allDates.map((ds) => {
      const point: Record<string, number | string | null> = { ds };
      let total = 0;
      let count = 0;
      for (const r of valid) {
        const hit = r.trajectory.find((t) => t.ds === ds);
        const v = hit?.value ?? null;
        point[r.symbol] = v;
        if (v != null) {
          total += v;
          count++;
        }
      }
      point.__total = count > 0 ? total : null;
      return point;
    });
  }, [rows]);

  const allocationData = useMemo(
    () => rows.filter((r) => !r.error).map((r) => ({ label: r.label, value: r.investment, projected: r.targetValue })),
    [rows],
  );

  const aiComment = useMemo(() => {
    if (rows.length === 0 || !totals) return null;
    const valid = rows.filter((r) => !r.error);
    if (valid.length === 0) return "Veri çekilemeyen varlıklar nedeniyle simülasyon üretilemedi.";

    const best = [...valid].sort((a, b) => b.gainPct - a.gainPct)[0];
    const worst = [...valid].sort((a, b) => a.gainPct - b.gainPct)[0];
    const riskiest = [...valid].sort((a, b) => (b.volAnnual ?? 0) - (a.volAnnual ?? 0))[0];
    const calmest = [...valid].sort((a, b) => (a.volAnnual ?? 0) - (b.volAnnual ?? 0))[0];

    const horizonText =
      ranHorizon >= 365 ? `${Math.round(ranHorizon / 30)} ay (${ranHorizon} gün)` : `${ranHorizon} gün`;

    const parts: string[] = [];
    parts.push(
      `Model, ${horizonText} sonunda toplam ${fmtTRY(totals.invested)} yatırımın ${fmtTRY(totals.projected, 0)} değere ulaşmasını öngörüyor — bu yaklaşık ${fmtPct(totals.gainPct)} bir değişime karşılık geliyor.`,
    );
    parts.push(
      `Pozitif tarafta en güçlü görünüm ${best.label} (${fmtPct(best.gainPct)}); en zayıf görünüm ise ${worst.label} (${fmtPct(worst.gainPct)}).`,
    );
    if (riskiest.symbol !== calmest.symbol) {
      parts.push(
        `Oynaklık tarafında en hareketli ${riskiest.label} (yıllık ${fmtPct(riskiest.volAnnual)}), en sakin ${calmest.label} (yıllık ${fmtPct(calmest.volAnnual)}).`,
      );
    }
    if (ranHorizon >= 365) {
      parts.push("Uzak ufuk tahminleri belirsizlik bandı genişler — modelin güven aralığı değil, beklentisi gösterilmiştir.");
    } else {
      parts.push("Daha kısa ufuklar genelde daha dar belirsizlik bandı sunar.");
    }
    parts.push("Bu rakamlar geçmiş kapanışlara dayalı model çıktısıdır; yatırım tavsiyesi değildir.");
    return parts.join(" ");
  }, [rows, totals, ranHorizon]);

  const horizonMeta = HORIZON_OPTIONS.find((h) => h.id === horizon) ?? HORIZON_OPTIONS[2];
  const futureDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + effectiveHorizon);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  }, [effectiveHorizon]);

  return (
    <div className="space-y-7">
      <DisclaimerBanner />

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-6">
          <h3 className="font-heading text-2xl font-bold text-white">Portföy taslağı simülasyonu</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            Bir hedef tarih (veya süre) seçin, varlıkları ve her birine ayıracağınız tutarı girin. Model, o ufka kadar
            her varlığın seyrini tahmin ederek toplam değer ve kâr/zararı simüle eder.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200/80">
              <CalendarClock className="size-3.5" />
              Hedef ufuk
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {HORIZON_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setHorizon(opt.id);
                    setCustomDate("");
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-bold transition-all",
                    horizon === opt.id && !customDate
                      ? "border-sky-400/40 bg-sky-400/15 text-sky-100"
                      : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <span>{opt.label}</span>
                  <span className="ml-1.5 text-[10px] font-medium text-white/40">{opt.sub}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                veya bir hedef tarih seç
              </Label>
              <Input
                type="date"
                value={customDate}
                min={new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}
                max={new Date(Date.now() + 730 * 86400000).toISOString().slice(0, 10)}
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-2 h-11 border-white/10 bg-black/30 text-white"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-white/45">
                Hedef tarih: <strong className="text-white/75">{futureDate}</strong>
                {customDate ? " (kendi tarihiniz)" : ` · ${horizonMeta.label} preset`}.
                Etkili ufuk: <span className="font-mono text-white/70">{effectiveHorizon}</span> gün.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/80">
              <Plus className="size-3.5" />
              Varlık ekle
            </div>
            <div className="mt-3">
              <SymbolPicker label="Varlık ara" value={null} onSelect={addLine} placeholder="altın, BTC, Tesla, dinar..." />
            </div>
            <div className="mt-4 rounded-xl border border-white/5 bg-black/30 p-3 text-[11px] leading-relaxed text-white/55">
              Listeye eklediğiniz her varlık için aşağıda yatırım tutarını ayarlayabilirsiniz. Toplam yatırım:{" "}
              <strong className="text-white">{fmtTRY(totalInvestment)}</strong>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {lines.map((line) => {
            const inferred = inferInstrumentFromSymbol(line.symbol);
            return (
              <div
                key={line.id}
                className="grid items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{line.label}</p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-xs text-white/40">
                    <span>{line.symbol}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase text-white/55">
                      {inferred.profile}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                    Yatırım tutarı (₺)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={Number.isFinite(line.investment) ? line.investment : 0}
                    onChange={(e) => updateInvestment(line.id, Number(e.target.value))}
                    className="mt-1 h-10 border-white/10 bg-black/30 font-mono text-white"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(line.id)}
                  className="self-end text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                >
                  <Trash2 className="size-4" />
                  Kaldır
                </Button>
              </div>
            );
          })}
          {lines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/50">
              Listede varlık yok. Yukarıdaki arama kutusundan varlık ekleyin.
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="brand" size="lg" onClick={simulate} disabled={loading || lines.length === 0}>
            {loading ? "Model çalışıyor…" : "Simülasyonu çalıştır"}
          </Button>
          {error ? <span className="text-sm text-rose-300">{error}</span> : null}
        </div>
      </div>

      {totals ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Toplam yatırım" value={fmtTRY(totals.invested)} subtitle={`${rows.length} varlık`} />
          <SummaryCard
            label={`Tahmini değer · ${ranHorizon}g`}
            value={fmtTRY(totals.projected, 0)}
            subtitle="Model son ufuk"
            tone="sky"
          />
          <SummaryCard
            label="Tahmini kâr / zarar"
            value={fmtTRY(totals.gain, 0)}
            subtitle={fmtPct(totals.gainPct)}
            tone={totals.gain >= 0 ? "emerald" : "rose"}
          />
          <SummaryCard
            label="Portföy oynaklığı"
            value={fmtPct(totals.weightedVol)}
            subtitle="Yıllık ağırlıklı"
            tone="amber"
          />
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/80">
                <TrendingUp className="size-3.5" />
                Toplam portföy değer trajektorisi
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-white/60">
                ₺ cinsinden
              </span>
            </div>
            {trajectoryChart.length > 0 ? (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryChart} margin={{ top: 10, right: 8, bottom: 4, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="ds"
                      tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={28}
                      tickFormatter={(v) => new Date(`${v}T00:00:00`).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" })}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      tickFormatter={(v) => (typeof v === "number" ? v.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) : String(v))}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15,23,42,0.95)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        color: "white",
                        fontSize: 12,
                      }}
                      labelFormatter={(v) => new Date(`${v}T00:00:00`).toLocaleDateString("tr-TR")}
                      formatter={(value, name) => [
                        fmtRechartsTry(value),
                        String(name) === "__total" ? "Toplam" : String(name ?? ""),
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (v === "__total" ? "Toplam portföy" : v)}
                    />
                    <Line
                      type="monotone"
                      dataKey="__total"
                      stroke="#fbbf24"
                      strokeWidth={3}
                      dot={false}
                      connectNulls
                      name="__total"
                    />
                    {rows
                      .filter((r) => !r.error)
                      .map((r, i) => (
                        <Line
                          key={r.symbol}
                          type="monotone"
                          dataKey={r.symbol}
                          stroke={PIE_COLORS[i % PIE_COLORS.length]}
                          strokeWidth={1.5}
                          dot={false}
                          opacity={0.7}
                          connectNulls
                          name={r.label}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-white/45">Trajektori için veri bulunamadı.</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/80">
              <BarChart3 className="size-3.5" />
              Dağılım — yatırım vs. tahmini değer
            </div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allocationData} margin={{ top: 10, right: 8, bottom: 24, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (typeof v === "number" ? v.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) : String(v))}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      color: "white",
                      fontSize: 12,
                    }}
                    formatter={(value) => fmtRechartsTry(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)" }} iconType="circle" iconSize={8} />
                  <Bar dataKey="value" name="Yatırım" radius={[6, 6, 0, 0]}>
                    {allocationData.map((_, i) => (
                      <Cell key={`inv-${i}`} fill="rgba(255,255,255,0.35)" />
                    ))}
                  </Bar>
                  <Bar dataKey="projected" name="Tahmini değer" radius={[6, 6, 0, 0]}>
                    {allocationData.map((entry, i) => (
                      <Cell
                        key={`pred-${i}`}
                        fill={entry.projected >= entry.value ? "#34d399" : "#f87171"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-black/20 text-[10px] font-bold uppercase tracking-widest text-white/45">
              <tr>
                <th className="px-4 py-3 text-left">Varlık</th>
                <th className="px-3 py-3 text-right">Yatırım</th>
                <th className="px-3 py-3 text-right">Güncel fiyat</th>
                <th className="px-3 py-3 text-right">Tahmini fiyat</th>
                <th className="px-3 py-3 text-right">Tahmini değer</th>
                <th className="px-3 py-3 text-right">Kâr / Zarar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const positive = r.gain >= 0;
                if (r.error) {
                  return (
                    <tr key={r.symbol} className="border-b border-white/5">
                      <td className="px-4 py-3 text-white/80">
                        <p className="font-bold">{r.label}</p>
                        <p className="font-mono text-xs text-white/40">{r.symbol}</p>
                      </td>
                      <td colSpan={5} className="px-3 py-3 text-right text-xs text-rose-300">
                        {r.error}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={r.symbol} className="border-b border-white/5 transition-colors hover:bg-white/[0.025]">
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{r.label}</p>
                      <p className="font-mono text-xs text-white/40">{r.symbol}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-white/85">{fmtTRY(r.investment)}</td>
                    <td className="px-3 py-3 text-right font-mono text-white/85">{fmtNumber(r.current, 4)}</td>
                    <td className="px-3 py-3 text-right font-mono text-white/85">
                      {fmtNumber(r.target, 4)}
                      {r.lower != null && r.upper != null ? (
                        <span className="ml-1 text-[10px] text-white/35">
                          ({fmtNumber(r.lower, 4)}–{fmtNumber(r.upper, 4)})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-white">{fmtTRY(r.targetValue, 0)}</td>
                    <td className={cn("px-3 py-3 text-right font-mono font-bold", positive ? "text-emerald-300" : "text-rose-300")}>
                      {fmtTRY(r.gain, 0)}
                      <span className="ml-1 text-xs font-medium">({fmtPct(r.gainPct)})</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {aiComment ? (
        <div className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-indigo-500/5 p-6 shadow-xl shadow-sky-950/20">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200">
            <Bot className="size-3.5" />
            AI yorumu
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/85">{aiComment}</p>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
  tone = "neutral",
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "neutral" | "sky" | "emerald" | "rose" | "amber";
}) {
  const toneClass = {
    neutral: "border-white/10 bg-white/[0.04]",
    sky: "border-sky-400/25 bg-sky-500/10",
    emerald: "border-emerald-400/25 bg-emerald-500/10",
    rose: "border-rose-400/25 bg-rose-500/10",
    amber: "border-amber-400/25 bg-amber-500/10",
  }[tone];

  const valueClass = {
    neutral: "text-white",
    sky: "text-sky-200",
    emerald: "text-emerald-200",
    rose: "text-rose-200",
    amber: "text-amber-200",
  }[tone];

  return (
    <div className={cn("rounded-3xl border p-5 backdrop-blur-md", toneClass)}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</p>
      <p className={cn("mt-2 font-mono text-2xl font-bold tabular-nums", valueClass)}>{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-white/55">{subtitle}</p> : null}
    </div>
  );
}
