"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

import { fetchMarketSummary, type MarketItem } from "@/lib/api";
import { analizForecastHref } from "@/lib/instruments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const LOAD_TIMEOUT_MS = 25_000;

export function MarketSummary() {
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);

    try {
      const res = await fetchMarketSummary();
      if (!res?.length) {
        setError("Sunucu boş liste döndü. Backend ve Yahoo Finance erişimini kontrol edin.");
        setData([]);
        return;
      }
      setData(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Piyasa verisi alınamadı";
      setError(msg);
      setData([]);
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Piyasa verileri yükleniyor">
        <p className="text-sm text-white/50">Canlı fiyatlar yükleniyor…</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl border border-white/10 bg-white/15" />
          ))}
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6 text-center">
        <p className="text-sm leading-relaxed text-amber-100/90">{error ?? "Veri yok"}</p>
        <p className="mt-2 text-xs text-white/45">
          Backend: <code className="rounded bg-black/30 px-1">uvicorn main:app --reload --port 8000</code>
        </p>
        <Button type="button" variant="glass" size="sm" className="mt-4" onClick={() => void load()}>
          <RefreshCw className="mr-2 size-4" aria-hidden />
          Yeniden dene
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {data.map((item) => {
        const isUp = item.change_pct >= 0;
        return (
          <Link
            key={item.symbol}
            href={analizForecastHref(item.symbol)}
            className={cn(
              "flex min-h-[7.5rem] flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.08] p-4 transition-all",
              "hover:border-sky-400/40 hover:bg-white/[0.14] hover:shadow-lg hover:shadow-sky-500/10",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
            )}
            aria-label={`${item.name} için analiz merkezinde tahmin aç`}
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                {item.symbol}
              </span>
              <span className="mt-1 truncate text-sm font-semibold text-white">{item.name}</span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-2">
              <span className="font-mono text-lg font-bold tabular-nums text-white">
                {item.price.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
              </span>
              <div
                className={cn(
                  "flex shrink-0 items-center gap-0.5 text-xs font-bold",
                  isUp ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(item.change_pct).toFixed(2)}%
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
