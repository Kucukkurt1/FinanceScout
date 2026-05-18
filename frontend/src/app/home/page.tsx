import Link from "next/link";
import { ArrowRight, BadgeCheck, Landmark, LineChart, Lock, ShieldCheck, Sparkles, MousePointer2, BarChart3, Binary } from "lucide-react";

import { SITE_NAV_CLEARANCE } from "@/components/site/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarketSummary } from "@/components/site/market-summary";

/** Uygulama Ana Sayfası (/home) */
export default function ApplicationHomePage() {
  return (
    <div className="overflow-hidden pb-24 text-white">
      {/* Hero Section */}
      <section className={cn("relative mx-auto max-w-7xl pt-10 md:pt-14", SITE_NAV_CLEARANCE)}>
        <div className="pointer-events-none absolute inset-x-5 top-3 hidden h-px bg-white/18 lg:block" />
        <div className="pointer-events-none absolute bottom-0 right-8 top-0 hidden w-px bg-white/14 xl:block" />

        <div className="grid min-h-[520px] items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.72fr)] xl:gap-16">
          <div className="relative border-l-[4px] border-white/45 pl-6 md:pl-9">
            <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-sky-100 drop-shadow-sm flex items-center gap-2">
              <Sparkles className="size-4" />
              Uygulama Paneli
            </p>
            <h1 className="font-heading mt-5 max-w-[760px] text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.35)] md:text-6xl lg:text-[4.75rem]">
              Finansal özetler ve canlı veriler
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/90 drop-shadow-sm md:text-xl">
              Piyasa trendlerini takip edin, popüler varlıkları inceleyin ve derinlemesine AI analizi için merkezimizi kullanın.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/analiz"
                className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-12 px-7")}
              >
                Hemen Analiz Yap
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          <aside className="relative border-y border-white/22 py-8 lg:border-l lg:border-y-0 lg:py-12 lg:pl-10">
            <div className="absolute -right-20 top-1/2 hidden h-72 w-72 -translate-y-1/2 rounded-full bg-white/10 blur-3xl lg:block" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/68">Hızlı Erişim</p>
            <div className="relative mt-8 space-y-8">
              {[
                {
                  icon: BarChart3,
                  t: "Varlık Analizi",
                  d: "Kripto, Döviz ve Hisse senedi tahminleri.",
                  href: "/analiz"
                },
                {
                  icon: Binary,
                  t: "Backtest",
                  d: "Modelin geçmiş performansını test edin.",
                  href: "/analiz"
                },
                {
                  icon: ShieldCheck,
                  t: "Hizmetler",
                  d: "Platform özelliklerini keşfedin.",
                  href: "/hizmetler"
                },
              ].map(({ icon: Icon, t, d, href }) => (
                <Link key={t} href={href} className="group grid grid-cols-[48px_1fr] gap-5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/18 bg-white/10 text-white shadow-lg shadow-black/10 transition-colors group-hover:bg-white/16">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="border-b border-white/14 pb-8 group-last:border-b-0 group-last:pb-0">
                    <p className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">{t}</p>
                    <p className="mt-2 max-w-sm text-[15px] leading-7 text-white/78">{d}</p>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Market Summary Section */}
      <section className={cn("mx-auto mt-20 max-w-7xl", SITE_NAV_CLEARANCE)}>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">Canlı Piyasalar</p>
            <h2 className="font-heading mt-3 text-3xl font-semibold tracking-[-0.02em] text-white md:text-4xl">
              Piyasa Özeti
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium text-white/60">
            Anlık Yahoo Finance verileriyle piyasanın nabzını tutun.
          </p>
        </div>
        <MarketSummary />
      </section>
    </div>
  );
}
