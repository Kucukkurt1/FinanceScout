import {
  BadgeCheck,
  Landmark,
  Cpu,
  TrendingUp,
  History,
  Search,
  Globe,
  ShieldAlert,
  Brain,
  Coins,
} from "lucide-react";

import { HomeHeroDashboard } from "@/components/site/home-hero-dashboard";
import { cn } from "@/lib/utils";

/** Uygulama Bilgilendirme Ana Sayfası (/home) */
export default function ApplicationHomePage() {
  return (
    <div className="overflow-hidden pb-32 text-white">
      <HomeHeroDashboard />

      {/* Technology Explanation */}
      <section className="mx-auto mt-40 max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-left">
            <h2 className="font-heading text-4xl font-bold leading-tight">
              Hibrit AI Teknolojimiz <br />
              <span className="text-sky-400 text-3xl opacity-80">Nasıl Karar Verir?</span>
            </h2>
            <p className="text-white/60 leading-relaxed font-medium text-lg">
              Analiz merkezimiz, piyasanın hem geçmiş hafızasını hem de gelecekteki trend yönünü aynı anda işlemek için
              iki güçlü mimariyi harmanlar.
            </p>

            <div className="space-y-6 mt-10">
              <div className="flex gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 border border-sky-400/20">
                  <TrendingUp className="size-6 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold group-hover:text-sky-400 transition-colors">Prophet: Trend Analisti</h4>
                  <p className="mt-2 text-white/50 leading-relaxed font-medium text-[15px]">
                    Meta tarafından geliştirilen Prophet, yıllık döngüleri ve tatil günleri gibi özel etkileri matematiksel
                    olarak çözer.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 border border-sky-400/20">
                  <Cpu className="size-6 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold group-hover:text-sky-400 transition-colors">LSTM: Hafıza Katmanı</h4>
                  <p className="mt-2 text-white/50 leading-relaxed font-medium text-[15px]">
                    Derin öğrenme tabanlı LSTM (Uzun-Kısa Süreli Bellek) ağları, piyasadaki ani hareketleri ve kısa vadeli
                    desenleri hatırlar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative aspect-square max-w-md mx-auto w-full lg:ml-auto">
            <div className="absolute inset-0 bg-sky-500/20 rounded-[60px] blur-[100px] animate-pulse" />
            <div className="relative h-full w-full bg-white/5 border border-white/10 rounded-[60px] flex items-center justify-center p-12 overflow-hidden shadow-2xl shadow-sky-500/10 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-6">
                <div className="size-24 rounded-[32px] bg-sky-500 text-white flex items-center justify-center shadow-[0_0_50px_rgba(14,165,233,0.3)]">
                  <Brain className="size-12" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white tracking-tight">AI Entegrasyonu</p>
                  <p className="text-sky-400 font-bold uppercase tracking-[0.2em] text-xs mt-2">Aktif Analiz</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asset Coverage */}
      <section className="mx-auto mt-40 max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl font-bold">Neleri Analiz Edebilirsiniz?</h2>
          <p className="mt-4 text-white/50 font-medium max-w-2xl mx-auto">
            Geniş veri ağımız sayesinde binlerce farklı finansal varlığı tek bir platform üzerinden inceleyebilirsiniz.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Search, t: "Hisse Senetleri", d: "Borsa İstanbul ve ABD borsalarındaki binlerce şirket.", c: "sky" },
            { icon: Landmark, t: "Döviz Kurları", d: "Majör pariteler ve Türk Lirası odaklı kur değişimleri.", c: "emerald" },
            { icon: Coins, t: "Kripto Paralar", d: "Bitcoin, Ethereum ve önde gelen altcoin projeleri.", c: "amber" },
            { icon: Globe, t: "Emtia & Endeksler", d: "Altın, Gümüş, Petrol ve küresel borsa endeksleri.", c: "rose" },
          ].map((item) => (
            <div
              key={item.t}
              className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group"
            >
              <item.icon
                className={cn("size-10 mb-6 transition-transform group-hover:scale-110", {
                  "text-sky-400": item.c === "sky",
                  "text-emerald-400": item.c === "emerald",
                  "text-amber-400": item.c === "amber",
                  "text-white": item.c === "rose",
                })}
              />
              <h4 className="text-xl font-bold mb-3">{item.t}</h4>
              <p className="text-white/40 text-sm leading-relaxed font-medium">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Transparency & Trust */}
      <section className="mx-auto mt-40 max-w-7xl px-6">
        <div className="rounded-[48px] bg-white/[0.03] border border-white/10 p-10 md:p-20 overflow-hidden relative shadow-2xl shadow-black/20 backdrop-blur-sm">
          <div className="absolute top-0 right-0 size-96 bg-sky-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />

          <div className="relative z-10 grid lg:grid-cols-[1fr_0.8fr] gap-20">
            <div>
              <h2 className="font-heading text-4xl font-bold leading-tight mb-8 text-white">
                Şeffaflık Bizim <span className="text-sky-400 italic">Anayasamız</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed font-medium mb-12">
                Finansal modeller genellikle birer &quot;kara kutu&quot;dur. FinanceScout olarak biz, modelin nasıl performans
                gösterdiğini size dürüstçe sunarız.
              </p>

              <div className="grid sm:grid-cols-2 gap-8 text-left">
                <div>
                  <History className="size-8 text-sky-400 mb-4" />
                  <h5 className="font-bold text-lg mb-2 text-white">Backtest Gücü</h5>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Verinin son %20&apos;sini yapay zekadan saklar ve ne kadar isabetli tahmin yaptığını test ederiz.
                  </p>
                </div>
                <div>
                  <ShieldAlert className="size-8 text-amber-500 mb-4" />
                  <h5 className="font-bold text-lg mb-2 text-white">Hata Payı Metrikleri</h5>
                  <p className="text-sm text-white/40 leading-relaxed">
                    RMSE ve MAE gibi akademik doğruluk metriklerini sade bir dille raporlarız.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-6">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 shadow-inner">
                <div className="flex items-center gap-3 mb-4">
                  <BadgeCheck className="size-6 text-emerald-400" />
                  <span className="font-bold uppercase tracking-wider text-xs text-white/30">Doğrulama Raporu</span>
                </div>
                <div className="space-y-4">
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[94%] bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-white/40">
                    <span>MODEL GÜVENİLİRLİĞİ</span>
                    <span className="text-emerald-400">%94.2</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/20 italic text-center">
                *Analizler geçmiş verilere dayanır ve asla yatırım tavsiyesi değildir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-40 max-w-3xl px-6 text-center pb-8">
        <h2 className="font-heading text-3xl font-bold mb-8">Sıkça Sorulan Sorular</h2>
        <div className="space-y-4 text-left">
          {[
            {
              q: "Tahminler ne kadar güvenilir?",
              a: "AI modellerimiz piyasanın geçmiş döngülerini analiz eder. Ancak finansal piyasalar haber akışı ve beklenmedik olaylardan etkilendiği için bu tahminler birer 'olasılık' sunar, kesinlik vaat etmez.",
            },
            {
              q: "Veriler ne sıklıkla güncelleniyor?",
              a: "Piyasa verileri anlık olarak Yahoo Finance üzerinden çekilir. Analizler ise her talep edildiğinde güncel verilerle o saniyede yeniden hesaplanır.",
            },
            {
              q: "Platform ücretli mi?",
              a: "FinanceScout'un temel analiz ve bilgilendirme özellikleri tüm kullanıcılara ücretsiz olarak sunulmaktadır.",
            },
          ].map((faq, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h4 className="font-bold text-sky-200 mb-2">{faq.q}</h4>
              <p className="text-sm text-white/50 leading-relaxed font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
