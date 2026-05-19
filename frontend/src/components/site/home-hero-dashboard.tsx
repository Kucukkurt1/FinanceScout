import Link from "next/link";
import { Activity, ArrowRight, BarChart3, LineChart, ShieldCheck, Sparkles } from "lucide-react";

import { HomeAssistantQuickActions } from "@/components/site/home-assistant-quick-actions";
import { MarketSummary } from "@/components/site/market-summary";
import { SITE_NAV_CLEARANCE } from "@/components/site/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHeroDashboard() {
  return (
    <div className="relative isolate">
      <section
        className={cn(
          "relative mx-auto max-w-7xl overflow-hidden px-6 pb-4 md:px-10",
          SITE_NAV_CLEARANCE,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.18),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-32 size-72 rounded-full bg-sky-500/10 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-48 size-64 rounded-full bg-indigo-500/10 blur-[90px]"
        />

        <div className="relative grid items-center gap-12 pt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:pt-16">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                FinanceScout · Canlı analiz merkezi
              </span>
            </div>

            <h1 className="font-heading mt-8 max-w-4xl text-[3rem] font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[5.2rem]">
              Finansal veriyi{" "}
              <span className="bg-gradient-to-r from-sky-200 via-sky-400 to-cyan-200 bg-clip-text text-transparent">
                karar gücüne
              </span>{" "}
              dönüştürün.
            </h1>

            <p className="mt-7 max-w-2xl text-base font-medium leading-relaxed text-white/58 md:text-lg md:leading-8">
              Canlı piyasa özetleri, AI destekli hızlı sorular ve Prophet + LSTM tabanlı modelleme tek bir şık panelde.
              Analize saniyeler içinde başlayın.
            </p>

            <div className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href="/analiz"
                className={cn(
                  buttonVariants({ variant: "brand", size: "lg" }),
                  "group min-h-[3.5rem] justify-center gap-2 rounded-2xl px-8 text-base shadow-[0_0_46px_-10px_rgba(56,189,248,0.7)]",
                )}
              >
                <LineChart className="size-4 opacity-90" aria-hidden />
                Analiz Aracını Başlat
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link
                href="/hizmetler#metodoloji"
                className={cn(
                  buttonVariants({ variant: "glass", size: "lg" }),
                  "min-h-[3.5rem] justify-center rounded-2xl px-8 text-base text-white/80",
                )}
              >
                Metodolojiyi Gör
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                { icon: BarChart3, label: "100K+", sub: "Varlık" },
                { icon: Activity, label: "Canlı", sub: "Veri" },
                { icon: ShieldCheck, label: "Şeffaf", sub: "Backtest" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={sub}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-4 backdrop-blur-sm"
                >
                  <Icon className="mb-3 size-4 text-sky-400/90" aria-hidden />
                  <span className="block text-sm font-bold text-white tabular-nums">{label}</span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-white/35">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:-mt-8">
            <div className="absolute -inset-8 rounded-[3rem] bg-sky-500/10 blur-3xl" aria-hidden />
            <div className="relative min-h-[32rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111f]/80 p-5 shadow-[0_30px_90px_-36px_rgba(56,189,248,0.65)] backdrop-blur-xl md:rounded-[2.75rem] md:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-300/80">Forecast Console</p>
                  <h2 className="mt-2 text-xl font-bold text-white">Öngörü paneli</h2>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Aktif
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.035] p-5 md:p-6">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-white/35">Doğruluk oranı</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight text-white">%94.2</p>
                  </div>
                </div>
                <svg className="h-40 w-full md:h-48" viewBox="0 0 520 190" role="img" aria-label="AI tahmin çizgisi">
                  <defs>
                    <linearGradient id="homeHeroLine" x1="0" x2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                      <stop offset="55%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#a5f3fc" />
                    </linearGradient>
                    <linearGradient id="homeHeroFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.26" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 146 C70 106 112 118 162 92 C224 60 263 82 319 52 C383 18 432 42 520 24 L520 190 L0 190 Z" fill="url(#homeHeroFill)" />
                  <path d="M0 146 C70 106 112 118 162 92 C224 60 263 82 319 52 C383 18 432 42 520 24" fill="none" stroke="url(#homeHeroLine)" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Model</p>
                  <p className="mt-2 text-sm font-bold text-white">Prophet + LSTM</p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Risk</p>
                  <p className="mt-2 text-sm font-bold text-sky-300">Ölçülebilir</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto mt-16 max-w-7xl px-6 md:mt-24 md:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-400/90">Canlı panel</p>
            <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Anlık piyasa nabzı
            </h2>
            <p className="mt-2 max-w-lg text-sm font-medium leading-relaxed text-white/45">
              Küresel varlıkların güncel fiyatları ve AI asistan ile tek ekrandan hızlı analiz.
            </p>
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-1 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] md:rounded-[2.5rem]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent"
          />

          <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-[#070d1a]/80 backdrop-blur-xl md:rounded-[2.25rem]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="border-b border-white/[0.06] p-6 md:p-8 lg:border-b-0 lg:border-r">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10">
                    <BarChart3 className="size-4 text-sky-400" aria-hidden />
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Piyasa özeti</p>
                    <p className="text-[11px] text-white/40">Yahoo Finance · güncel kapanış</p>
                  </div>
                </div>
                <MarketSummary readonly />
              </div>

              <div className="relative bg-gradient-to-b from-sky-500/[0.04] to-transparent p-6 md:p-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.12),transparent_55%)]"
                />
                <HomeAssistantQuickActions />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
