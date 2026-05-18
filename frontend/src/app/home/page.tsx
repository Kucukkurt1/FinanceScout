"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Landmark, LineChart, Lock, ShieldCheck, Sparkles, MousePointer2, BarChart3, Binary, Zap, TrendingUp } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarketSummary } from "@/components/site/market-summary";

export default function ApplicationHomePage() {
  const askAssistant = (q: string) => {
    window.dispatchEvent(new CustomEvent("fs-ask-assistant", { detail: { question: q } }));
  };

  return (
    <div className="overflow-hidden pb-32 text-white">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-10 md:px-10 md:pt-14">
        <div className="pointer-events-none absolute inset-x-5 top-3 hidden h-px bg-white/18 lg:block" />
        <div className="pointer-events-none absolute bottom-0 right-8 top-0 hidden w-px bg-white/14 xl:block" />

        <div className="grid min-h-[480px] items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.65fr)] xl:gap-20">
          <div className="relative border-l-[4px] border-white/45 pl-6 md:pl-9">
            <h1 className="font-heading mt-2 max-w-[760px] text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-white md:text-6xl lg:text-7xl">
              Finansal özetler ve <br /> <span className="bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">canlı</span> veriler
            </h1>
            <p className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-white/80 md:text-xl">
              Piyasa trendlerini takip edin, popüler varlıkları inceleyin ve derinlemesine AI analizi için merkezimizi kullanın.
            </p>
            <div className="mt-10">
              <Link
                href="/analiz"
                className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-14 px-8 text-md shadow-2xl shadow-primary/30")}
              >
                Analiz Aracını Aç
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </div>
          </div>

          <aside className="relative rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
             <div className="flex items-center gap-3 mb-8">
                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                   <Zap className="size-5" />
                </div>
                <h3 className="font-bold text-lg">AI Asistan İpucu</h3>
             </div>
             <p className="text-white/60 leading-relaxed text-sm font-medium">
                &quot;Bana Euro/TL&apos;nin önümüzdeki 30 gün içinde hangi yöne gidebileceğini ve risk seviyesini analiz eder misin?&quot;
             </p>
             <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Hızlı Sorular</p>
                <div className="flex flex-wrap gap-2">
                   {[
                     { l: "Kripto Analizi", q: "Kripto piyasasında volatilite nasıl yorumlanır?" },
                     { l: "Risk Nedir?", q: "Finansal analizde RMSE ve volatilite neyi ifade eder?" },
                     { l: "Enflasyon Etkisi", q: "Enflasyonun döviz kurları üzerindeki etkisini açıklar mısın?" }
                   ].map(btn => (
                     <button 
                       key={btn.l} 
                       onClick={() => askAssistant(btn.q)}
                       className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10 transition-colors"
                     >
                        {btn.l}
                     </button>
                   ))}
                </div>
             </div>
          </aside>
        </div>
      </section>

      {/* Market Summary Section */}
      <section className="mx-auto mt-24 max-w-7xl px-6 md:px-10">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300 mb-2">Piyasalar</p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
              Canlı Takip Listesi
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium text-white/40 border-l border-white/10 pl-6">
            Anlık Yahoo Finance verileriyle global piyasaların nabzını tutun.
          </p>
        </div>
        <MarketSummary />
      </section>

      {/* Featured Analyses - Günün Öne Çıkanları */}
      <section className="mx-auto mt-32 max-w-7xl px-6 md:px-10">
        <div className="flex items-center gap-4 mb-12">
           <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
           <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">Günün Öne Çıkan Analizleri</h2>
           <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Bitcoin Volatilite Analizi",
              d: "Ani fiyat hareketleri sonrası LSTM modelimizin öngörüleri.",
              sym: "BTC-USD",
              tag: "KRİPTO",
              color: "from-orange-500/20 to-transparent"
            },
            {
              t: "Dolar/TL Trend Sorgusu",
              d: "Yıllık trend çizgisi üzerinde mevsimsel etkilerin analizi.",
              sym: "USDTRY=X",
              tag: "DÖVİZ",
              color: "from-emerald-500/20 to-transparent"
            },
            {
              t: "THY Hissesi Geriye Dönük Test",
              d: "Geçmiş verilerle modelimizin %98 uyumluluğunu keşfedin.",
              sym: "THYAO.IS",
              tag: "HİSSE",
              color: "from-sky-500/20 to-transparent"
            }
          ].map((item) => (
            <Link 
              key={item.t} 
              href={`/analiz?s=${item.sym}`} 
              className={cn(
                "group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/8 hover:-translate-y-1",
                `bg-gradient-to-br ${item.color}`
              )}
            >
              <div className="flex justify-between items-start mb-6">
                 <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold tracking-widest">{item.tag}</span>
                 <ArrowRight className="size-5 text-white/20 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.t}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.d}</p>
              <div className="mt-8 flex items-baseline gap-2">
                 <span className="text-xs font-bold text-white/30 uppercase">Sembol:</span>
                 <span className="text-sm font-mono font-bold text-white uppercase">{item.sym}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Knowledge Base - Bilgi Köşesi */}
      <section className="mx-auto mt-40 max-w-7xl px-6 md:px-10">
        <div className="rounded-[50px] border border-white/10 bg-slate-950/40 p-10 md:p-20 relative overflow-hidden">
           <div className="absolute top-0 right-0 size-96 bg-primary/10 blur-[100px] -z-10" />
           <div className="">
              <h2 className="font-heading text-4xl font-bold mb-8">Finansal Okuryazarlık <br /> ve AI Metodolojisi</h2>
              <p className="text-white/60 text-lg leading-relaxed mb-12">
                 Sistemimizin ürettiği verileri daha iyi anlamak için temel kavramlara göz atın. Bilinçli analiz, başarılı stratejinin ilk adımıdır. Bu teknik terimler, modellerimizin sunduğu sonuçları doğru yorumlamanıza ve risklerinizi daha iyi yönetmenize yardımcı olur.
              </p>
              
              <div className="grid gap-10 md:grid-cols-3">
                 {[
                   { t: "RMSE Nedir?", d: "Modelin gerçek fiyatlardan ortalama ne kadar saptığını gösteren hata payı ölçüsüdür." },
                   { t: "Trend Mevsimselliği", d: "Fiyatın haftalık veya aylık olarak kendini tekrarlayan döngüsel hareketleridir." },
                   { t: "Oynaklık (Volatility)", d: "Varlığın fiyatındaki dalgalanma şiddeti. Yüksek oynaklık yüksek risk demektir." },
                   { t: "Güven Aralığı", d: "Fiyatın %95 ihtimalle içinde kalması beklenen en düşük ve en yüksek koridorudur." },
                   { t: "Backtest Skoru", d: "Modelin geçmiş veriler üzerindeki başarısını puanlayan doğruluk metriğidir." },
                   { t: "Logaritmik Getiri", d: "Fiyat değişimlerini normalize ederek ekstrem dalgalanmaları daha net görmeyi sağlar." },
                 ].map(k => (
                   <div key={k.t} className="space-y-3 text-left">
                      <h4 className="font-bold text-sky-400"># {k.t}</h4>
                      <p className="text-sm text-white/40 leading-relaxed">{k.d}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* Status Bar / Statistics */}
      <section className="mx-auto mt-32 max-w-7xl px-6 md:px-10">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-white/10">
            {[
              { l: "Analiz Modeli", v: "Hibrit (Prophet + LSTM)" },
              { l: "Veri Kaynağı", v: "Yahoo Finance" },
              { l: "Analiz Motoru", v: "Derin Öğrenme" },
              { l: "Ağ Mimarisi", v: "2 Katmanlı LSTM" },
            ].map(s => (
              <div key={s.l} className="text-center md:text-left">
                 <p className="text-xs font-bold text-sky-400 uppercase tracking-[0.2em] mb-2">{s.l}</p>
                 <p className="text-xl font-bold text-white tracking-tight">{s.v}</p>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
}
