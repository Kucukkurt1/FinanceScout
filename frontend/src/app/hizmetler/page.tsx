import Link from "next/link";
import { ArrowRight, BarChart3, Binary, ShieldCheck, Zap, Globe, PieChart } from "lucide-react";
import type { Metadata } from "next";

import { ServicesChartMockup } from "@/components/site/services-chart-mockup";
import { ServicesRating } from "@/components/site/services-rating";
import { SITE_NAV_CLEARANCE } from "@/components/site/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Hizmetler · FinanceScout",
};

export default function HizmetlerPage() {
  return (
    <div className="overflow-hidden pb-24 text-white">
      <section className={cn("relative mx-auto max-w-7xl pt-12 md:pt-20", SITE_NAV_CLEARANCE)}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.2em] text-sky-100">
              <Zap className="size-4 shrink-0" />
              Hizmetlerimiz
            </p>
            <h1 className="font-heading mt-6 text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-white md:text-6xl lg:text-7xl">
              Finansal Analizde <br /> Yeni Standartlar
            </h1>
            <p className="mt-8 max-w-xl text-lg font-medium leading-relaxed text-white/80 md:text-xl md:leading-9">
              Karmaşık verileri, yapay zeka destekli modellerle anlaşılır ve aksiyon alınabilir özetlere dönüştürüyoruz.
              Yatırım stratejinizi destekleyen üç temel sütun üzerine inşa edilen hizmetlerimizi keşfedin.
            </p>
          </div>

          <ServicesChartMockup className="w-full lg:max-w-none" />
        </div>

        <div className="mt-16 grid gap-8 md:mt-20 md:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: "Piyasa Tahmini",
              desc: "100.000+ varlık üzerinde Prophet tabanlı zaman serisi analizi ile kısa ufuklu fiyat beklentilerini ve güven aralıklarını görün.",
              color: "bg-blue-500/20 text-blue-300",
            },
            {
              icon: Binary,
              title: "Geçmişe Dönük Test",
              desc: "Sistemi dürüstçe test edin. Seçtiğiniz sürenin son %20'sini yapay zekadan saklarız ve hiç bilmediği bu dönemde ne kadar başarılı tahmin yaptığını size dürüstçe raporlarız.",
              color: "bg-purple-500/20 text-purple-300",
            },
            {
              icon: PieChart,
              title: "Risk Profilleme",
              desc: "Varlık bazlı günlük ve yıllıklaştırılmış oynaklık metrikleri ile portföyünüzün maruz kaldığı risk seviyesini etiketleyin.",
              color: "bg-emerald-500/20 text-emerald-300",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group relative rounded-3xl border border-white/12 bg-white/5 p-8 transition-all hover:bg-white/10"
            >
              <div className={cn("flex size-14 items-center justify-center rounded-2xl ring-1 ring-white/10", item.color)}>
                <item.icon className="size-7" />
              </div>
              <h3 className="mt-8 text-2xl font-bold text-white">{item.title}</h3>
              <p className="mt-4 leading-relaxed text-white/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={cn("mx-auto mt-24 max-w-7xl md:mt-32", SITE_NAV_CLEARANCE)}>
        <div className="max-w-3xl">
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-white md:text-5xl">Neden FinanceScout?</h2>
          <p className="mt-6 text-lg text-white/70">
            Geleneksel analiz araçlarının aksine, biz hıza ve doğruluğa odaklanıyoruz. Platformumuz, finansal teknoloji
            dünyasının en sağlam temellerini bir araya getirir.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {[
            {
              icon: Globe,
              t: "Global Veri Erişimi",
              d: "Yahoo Finance entegrasyonu ile tüm dünya borsaları parmaklarınızın ucunda.",
            },
            {
              icon: ShieldCheck,
              t: "Şeffaf Metodoloji",
              d: "Kara kutu modeller yerine, her tahminin hata payını ve geçmiş performansını gösteriyoruz.",
            },
          ].map((f) => (
            <div key={f.t} className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sky-300">
                <f.icon className="size-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{f.t}</h4>
                <p className="mt-2 leading-relaxed text-white/60">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="metodoloji"
        className={cn("mx-auto mt-24 scroll-mt-28 md:mt-32", SITE_NAV_CLEARANCE)}
      >
        <div className="rounded-3xl border border-white/12 bg-white/[0.06] px-6 py-10 md:px-12 md:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
              Metodoloji ve şeffaflık
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg md:leading-8">
              FinanceScout nasıl tahmin üretir; varsayımlar, doğrulama yöntemleri ve bilinen sınırlar aşağıda özetlenmiştir.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-2 lg:gap-10 xl:gap-12">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-white md:text-xl">Veri kaynağı</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-[15px] md:leading-7">
                Günlük kapanış fiyatları Yahoo Finance üzerinden (yfinance) çekilir. Resmi borsa feed&apos;i değildir;
                gecikme ve eksik bar oluşabilir.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-white md:text-xl">Prophet + momentum harmanı</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-[15px] md:leading-7">
                Birincil tahminci Prophet&apos;tir. Gelecek patikası son kapanışa ankrelenir; ardından son 21 günün EWMA
                log-getirisiyle üretilen monoton momentum patikası ile harmanlanır.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-white md:text-xl">LSTM ensemble (opsiyonel)</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65 md:text-[15px] md:leading-7">
                Kısa hafıza için hafif bir LSTM, walk-forward RMSE&apos;ye göre Prophet ile ağırlıklı birleştirilir.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-white md:text-xl">Doğrulama</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/65 md:text-[15px] md:leading-7">
                <li>Varsayılan: son %20 holdout geriye dönük test</li>
                <li>Kesit modu: train_until sonrası kör karşılaştırma</li>
                <li>Walk-forward: kaydırmalı pencere ortalaması (API)</li>
              </ul>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-white/50 md:text-base">
            Ani haber veya politika şokları günlük kapanış modelinde yakalanmayabilir. Veri gecikmesi, eksik bar ve
            kısa geçmişte model yanıltıcı olabilir; sonuçlar yatırım tavsiyesi değildir.
          </p>
        </div>
      </section>

      <section className={cn("mx-auto mt-32 max-w-7xl", SITE_NAV_CLEARANCE)}>
        <div className="relative overflow-hidden rounded-[40px] border border-white/20 bg-white/5 px-8 py-16 text-center md:py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent opacity-50" />
          <div className="relative z-10">
            <h2 className="font-heading text-4xl font-semibold text-white md:text-6xl">Analize Bugün Başlayın</h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/70 md:text-xl">
              Karmaşık finansal tablolarla vakit kaybetmeyin. İhtiyacınız olan tüm özetler tek bir tık uzağınızda.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/analiz"
                className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-14 w-full px-10 sm:w-auto")}
              >
                Analiz Aracını Aç
                <ArrowRight className="ml-2 size-5" />
              </Link>
              <Link
                href="/iletisim"
                className={cn(buttonVariants({ variant: "glass", size: "lg" }), "h-14 w-full px-10 sm:w-auto")}
              >
                Destek Al
              </Link>
            </div>
            <ServicesRating />
          </div>
        </div>
      </section>
    </div>
  );
}
