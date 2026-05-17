"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { PriceChart, type ChartRow } from "@/components/price-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AssetClassParam, BacktestApiResponse, ForecastApiResponse, Metrics } from "@/lib/api";
import { fetchSymbols, postBacktest, postForecast } from "@/lib/api";
import {
  INSTRUMENT_CATEGORY_META,
  INSTRUMENTS_BY_CATEGORY,
  type InstrumentCategoryId,
} from "@/lib/instruments";

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

function MetricTile({
  title,
  hint,
  value,
}: {
  title: string;
  hint: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-white text-sm font-semibold">{title}</p>
      <p className="text-sky-200/60 text-xs leading-relaxed">{hint}</p>
      <div className="text-white pt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function MetricsSection({
  title,
  m,
  trainUntil,
}: {
  title: string;
  m: Metrics;
  trainUntil?: string | null;
}) {
  const risk = riskFromVol(m.volatility_annualized);
  const rmseHint =
    trainUntil && m.holdout_points != null
      ? `Model ${trainUntil} tarihine kadar eğitildi; bu tarihten sonraki gerçek kapanışlarla karşılaştırıldı (${m.holdout_points} ortak işlem günü). Rakam düştükçe tahmin gerçeğe yakın demektir.`
      : "Son tutulan test penceresinde hatanın büyüklüğü. Rakam düştükçe model gerçek fiyata daha yakın demektir.";
  const biasFinite = m.mean_bias != null && Number.isFinite(m.mean_bias);

  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-heading text-white text-xl font-semibold tracking-tight">{title}</h2>
      {trainUntil ? (
        <p className="border-primary/35 bg-sky-500/10 text-sky-100 border-l-[3px] px-4 py-3 text-sm leading-relaxed">
          <strong className="text-white">Kesit modu:</strong> Model veriyi yalnızca{" "}
          <strong className="text-white">{trainUntil}</strong> tarihine kadar «gördü». Bu tarihten sonraki gerçek fiyatlar,
          modele kapalı kalarak karşılaştırmada kullanıldı — böylece «bilmediği dönem» hatasını ölçebilirsiniz.
        </p>
      ) : null}
      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
        <MetricTile title="RMSE" hint={rmseHint} value={fmtNum(m.rmse)} />
        <MetricTile
          title="MAE"
          hint="Ortalama mutlak sapma; RMSE ile birlikte yorumlanır. Küçük olması iyidir."
          value={fmtNum(m.mae)}
        />
        <MetricTile
          title="Günlük oynaklık"
          hint="Son günlük kapanışlara göre, bir günden diğerine sıçrama özeti."
          value={fmtPct(m.volatility_daily)}
        />
        <MetricTile
          title="Yıllıklaştırılmış oynaklık"
          hint={
            m.volatility_annualization_days != null
              ? `Günlük oynaklığı yıla ölçeklemek için √${m.volatility_annualization_days} kullanıldı (bilgi amaçlı).`
              : "Günlük oynaklığın kabaca yıllık karşılığı (bilgi amaçlı)."
          }
          value={
            <div className="flex flex-col gap-1">
              <span>{fmtPct(m.volatility_annualized)}</span>
            </div>
          }
        />
        <div className="flex flex-col gap-2 py-1">
          <p className="text-white text-sm font-semibold">Risk özeti</p>
          <p className="text-sky-200/40 text-xs leading-relaxed">
            Yıllıklaştırılmış oynaklığa göre kabaca bir etiket; yatırım tavsiyesi değildir.
          </p>
          <span className={`mt-1 inline-flex w-fit rounded-md px-2.5 py-1 text-sm font-medium ${risk.className}`}>
            {risk.label}
          </span>
        </div>
      </div>
      {biasFinite ? (
        <p className="text-sky-200/60 text-sm leading-relaxed">
          <strong className="text-white">Ortalama sapma (bias):</strong> tahminler gerçek fiyatın ortalama olarak{" "}
          <strong className="text-white">{fmtNum(m.mean_bias)}</strong> kadar{" "}
          {(m.mean_bias as number) > 0 ? "üzerinde" : "altında"} kalmış. İleri tahminlerde düzeltme çarpanı düşünmek
          isterseniz bu işareti referans alabilirsiniz (otomatik uygulanmaz).
        </p>
      ) : null}
    </section>
  );
}

export function Dashboard() {
  const [symbol, setSymbol] = useState("USDTRY=X");
  const [assetClass, setAssetClass] = useState<AssetClassParam>("fx");
  const [pickerCategory, setPickerCategory] = useState<InstrumentCategoryId>("fx");
  const [pickerQuery, setPickerQuery] = useState("");
  const [historyDays, setHistoryDays] = useState(365);
  const [forecastDays, setForecastDays] = useState(9);
  const [useTrainCutoff, setUseTrainCutoff] = useState(false);
  const [trainUntil, setTrainUntil] = useState("2022-12-31");
  const [dataStart, setDataStart] = useState("");
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

  const symUpper = symbol.trim().toUpperCase();
  const filteredPickerRows = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const list = INSTRUMENTS_BY_CATEGORY[pickerCategory];
    if (!q) return list;
    return list.filter(
      (row) => row.label.toLowerCase().includes(q) || row.symbol.toLowerCase().includes(q),
    );
  }, [pickerCategory, pickerQuery]);

  const pickerSelectionLabel = useMemo(() => {
    for (const { id } of INSTRUMENT_CATEGORY_META) {
      const hit = INSTRUMENTS_BY_CATEGORY[id].find((r) => r.symbol === symUpper);
      if (hit) return hit.label;
    }
    return null;
  }, [symUpper]);

  async function run() {
    setError(null);
    setForecast(null);
    setBacktest(null);
    
    // Değerleri limitlere göre sınırla (Clamping)
    const finalHistory = Math.min(Math.max(historyDays, 60), 3650);
    const finalForecast = Math.min(Math.max(forecastDays, 1), 90);
    
    setHistoryDays(finalHistory);
    setForecastDays(finalForecast);

    setLoading(true);
    try {
      const sym = symbol.trim().toUpperCase();
      if (!sym) throw new Error("Lütfen bir sembol yazın (örnek: BTC-USD).");

      const fc = await postForecast({
        symbol: sym,
        history_days: finalHistory,
        forecast_days: finalForecast,
        asset_class: assetClass,
        ...(useTrainCutoff && trainUntil.trim()
          ? { train_until: trainUntil.trim(), data_start: dataStart.trim() || undefined }
          : {}),
      });
      setForecast(fc);

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
            history_days: historyDays,
            test_fraction: 0.2,
            asset_class: assetClass,
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
          "İstek başarısız oldu. Sembolün doğru olduğundan emin olun; sunucunun çalıştığını kontrol edin (localhost:8000).",
      );
    } finally {
      setLoading(false);
    }
  }

  const showEmptyHint = !forecast && !loading;

  return (
    <div className="mx-auto grid w-full max-w-7xl items-start gap-8 px-6 pb-20 pt-0 lg:grid-cols-[380px_1fr]">
      {/* Sol Panel: Ayarlar */}
      <aside className="lg:sticky lg:top-28 space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="font-heading mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <BarChart3 className="size-5 text-white" />
            Analiz Ayarları
          </h2>

          <div className="space-y-6">
            {/* Varlık Seçici */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Varlık Seçimi</Label>
              <div className="grid grid-cols-2 gap-2">
                {INSTRUMENT_CATEGORY_META.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPickerCategory(c.id)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-[11px] font-bold transition-all",
                      pickerCategory === c.id 
                        ? "bg-white text-primary shadow-xl shadow-white/10" 
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
              
              <div className="relative mt-4">
                 <Input
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Ara (ör. Dolar, BTC)..."
                  className="h-10 border-white/10 bg-white/5 pl-4 pr-10 text-sm text-white placeholder:text-white/30 focus:ring-primary/30"
                />
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/20 pr-1 custom-scrollbar">
                {filteredPickerRows.map((row) => {
                  const active = symUpper === row.symbol;
                  return (
                    <button
                      key={row.symbol}
                      onClick={() => {
                        setSymbol(row.symbol);
                        setAssetClass(row.profile);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
                        active ? "bg-white/20 border-l-2 border-white" : "hover:bg-white/5 border-l-2 border-transparent"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-bold", active ? "text-white" : "text-white/90")}>{row.label}</span>
                        <span className={cn("text-[10px] font-medium", active ? "text-white" : "text-white/40")}>{row.symbol}</span>
                      </div>
                      {active && <div className="size-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manuel Sembol */}
            <div className="space-y-3">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/50 outline-none">
                   Özel Sembol Gir
                   <span className="transition-transform group-open:rotate-180">↓</span>
                </summary>
                <div className="mt-4 pt-2">
                  <Input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="BTC-USD, THYAO.IS..."
                    className="h-10 border-white/10 bg-white/5 text-sm font-mono text-white"
                  />
                </div>
              </details>
            </div>

            {/* Parametreler */}
            <div className="grid grid-cols-1 gap-4 border-t border-white/5 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Geçmiş Veri (Gün)</Label>
                  <span className="text-[9px] font-medium text-white/30 italic">60 - 3650</span>
                </div>
                <Input
                  type="number"
                  value={historyDays}
                  onChange={(e) => setHistoryDays(Number(e.target.value))}
                  className="h-10 border-white/10 bg-white/5 text-white"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Tahmin Ufku (Gün)</Label>
                  <span className="text-[9px] font-medium text-white/30 italic">1 - 90</span>
                </div>
                <Input
                  type="number"
                  value={forecastDays}
                  onChange={(e) => setForecastDays(Number(e.target.value))}
                  className="h-10 border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>

            <Button 
              onClick={run} 
              disabled={loading}
              className={cn(buttonVariants({ variant: "brand", size: "lg" }), "w-full shadow-2xl shadow-primary/20")}
            >
              {loading ? "Hesaplanıyor..." : "Analizi Başlat"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
            {error}
          </div>
        )}
      </aside>

      {/* Sağ Panel: Grafikler ve Sonuçlar */}
      <main className="min-h-[600px] space-y-8">
        {showEmptyHint && (
          <div className="flex h-full min-h-[600px] flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/5 p-20 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-white/5 text-white/20 mb-8">
               <LineChart className="size-10" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white">Analize Hazır</h3>
            <p className="mt-4 max-w-md text-lg font-medium text-white/40">
              Sol taraftan bir varlık seçip ayarlarınızı yapılandırdıktan sonra &ldquo;Analizi Başlat&rdquo; butonuna tıklayarak sonuçları görebilirsiniz.
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-3xl bg-white/5 border border-white/10" />
              ))}
            </div>
            <Skeleton className="h-[500px] rounded-[40px] bg-white/5 border border-white/10" />
          </div>
        )}

        {forecast && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            {/* Metrik Kartları */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
               {[
                 { label: "Hata Payı (RMSE)", value: fmtNum(forecast.backtest_metrics.rmse), icon: Zap },
                 { label: "Günlük Oynaklık", value: fmtPct(forecast.backtest_metrics.volatility_daily), icon: TrendingUp },
                 { label: "Yıllık Tahmini", value: fmtPct(forecast.backtest_metrics.volatility_annualized), icon: Globe },
                 { label: "Risk Skoru", value: riskFromVol(forecast.backtest_metrics.volatility_annualized).label, badge: true, icon: ShieldCheck }
               ].map((m) => (
                 <div key={m.label} className="group rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10">
                    <div className="flex items-center justify-between mb-3">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{m.label}</p>
                       <m.icon className="size-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
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
            <div className="rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
               <Tabs defaultValue="forecast">
                  <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                     <div>
                        <div className="flex items-center gap-3">
                           <h3 className="font-heading text-3xl font-bold text-white">{forecast.symbol} Analizi</h3>
                           <div className="rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold text-primary uppercase tracking-tighter">
                              {assetLabelTr(forecast.asset_class)}
                           </div>
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

                  <TabsContent value="forecast" className="mt-0 outline-none">
                     <div className="h-[450px] w-full">
                        <PriceChart data={forecastChart} />
                     </div>
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

                  <TabsContent value="backtest" className="mt-0 outline-none">
                     <div className="h-[450px] w-full">
                        {backtest ? (
                           <PriceChart data={backtestChart} />
                        ) : (
                           <div className="flex h-full items-center justify-center text-white/20">Veri bulunamadı.</div>
                        )}
                     </div>
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

// Helper icons and styles
import { LineChart, TrendingUp, BarChart3, Zap, ShieldCheck, Globe } from "lucide-react";
