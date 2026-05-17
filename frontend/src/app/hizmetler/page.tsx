import Link from "next/link";
import { ArrowRight, BarChart3, Binary, ShieldCheck, Zap, Globe, PieChart, Sparkles, History, ShieldAlert, Cpu, Database, Microscope, HelpCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Hizmetler · FinanceScout",
};

export default function HizmetlerPage() {
  return (
    <div className="overflow-hidden pb-40 text-white">
      {/* Header Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-12 md:px-10 md:pt-20">
        <div className="max-w-3xl">
          <h1 className="font-heading mt-6 text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-white md:text-6xl lg:text-7xl">
            Finansal Analizde <br /> Yeni Standartlar
          </h1>
          <p className="mt-8 text-lg font-medium leading-relaxed text-white/80 md:text-xl md:leading-9">
            Karmaşık verileri, yapay zeka destekli modellerle anlaşılır ve aksiyon alınabilir özetlere dönüştürüyoruz. 
            Yatırım stratejinizi destekleyen dört temel sütun üzerine inşa edilen hizmetlerimizi keşfedin.
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: BarChart3,
              title: "Piyasa Tahmini",
              desc: "100.000+ varlık üzerinde hibrit zaman serisi analizi ile kısa ufuklu fiyat beklentilerini ve güven aralıklarını görün.",
              color: "bg-blue-500/20 text-blue-300"
            },
            {
              icon: Binary,
              title: "Geçmişe Dönük Test",
              desc: "Sistemi dürüstçe test edin. Seçtiğiniz sürenin son %20'sini yapay zekadan saklar ve ne kadar başarılı olduğunu size kanıtlarız.",
              color: "bg-purple-500/20 text-purple-300"
            },
            {
              icon: PieChart,
              title: "Risk Profilleme",
              desc: "Varlık bazlı günlük ve yıllıklaştırılmış oynaklık metrikleri ile portföyünüzün maruz kaldığı risk seviyesini etiketleyin.",
              color: "bg-emerald-500/20 text-emerald-300"
            },
            {
              icon: Sparkles,
              title: "AI Asistan (Chatbot)",
              desc: "Karmaşık finansal kavramları veya analiz sonuçlarını doğal dilde sorun; yapay zeka asistanımız size anında özetlesin.",
              color: "bg-amber-500/20 text-amber-300"
            }
          ].map((item) => (
            <div key={item.title} className="group relative rounded-3xl border border-white/12 bg-white/5 p-8 transition-all hover:bg-white/10">
              <div className={cn("flex size-14 items-center justify-center rounded-2xl ring-1 ring-white/10", item.color)}>
                <item.icon className="size-7" />
              </div>
              <h3 className="mt-8 text-2xl font-bold text-white">{item.title}</h3>
              <p className="mt-4 leading-relaxed text-[15px] text-white/50">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Features / Why Us */}
      <section className="mx-auto mt-40 max-w-7xl px-6 md:px-10">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="space-y-10 text-left">
            <div>
              <h2 className="font-heading text-4xl font-bold tracking-tight text-white md:text-5xl">
                Neden FinanceScout?
              </h2>
              <p className="mt-6 text-lg text-white/60 font-medium">
                Geleneksel analiz araçlarının aksine, biz hıza ve doğruluğa odaklanıyoruz. 
                Platformumuz, finansal teknoloji dünyasının en sağlam temellerini bir araya getirir.
              </p>
            </div>

            <div className="grid gap-8">
              {[
                {
                  icon: Microscope,
                  t: "Hibrit Derin Öğrenme",
                  d: "Prophet ve LSTM modellerini birleştirerek hem uzun vadeli trendleri hem de kısa vadeli anomalileri aynı anda analiz ediyoruz."
                },
                {
                  icon: Globe,
                  t: "Global Veri Erişimi",
                  d: "Yahoo Finance entegrasyonu ile tüm dünya borsaları, kripto varlıklar ve döviz çiftleri parmaklarınızın ucunda."
                },
                {
                  icon: ShieldCheck,
                  t: "Şeffaf Metodoloji",
                  d: "Kara kutu modeller yerine, her tahminin hata payını ve geçmiş performansını (Backtest) açıkça gösteriyoruz."
                }
              ].map((f) => (
                <div key={f.t} className="flex gap-6 group">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-sky-400 border border-white/10 group-hover:bg-white/10 transition-colors">
                    <f.icon className="size-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{f.t}</h4>
                    <p className="mt-2 text-white/50 leading-relaxed font-medium">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square rounded-3xl border border-white/12 bg-white/5 p-6 md:p-8">
             <div className="flex h-full flex-col gap-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 backdrop-blur-xl shadow-2xl">
                {/* Mockup Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
                   <div className="flex gap-1.5">
                      <div className="size-2.5 rounded-full bg-rose-500/50" />
                      <div className="size-2.5 rounded-full bg-amber-500/50" />
                      <div className="size-2.5 rounded-full bg-emerald-500/50" />
                   </div>
                   <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">AI CORE v2.0</div>
                </div>
                
                {/* Mockup Content */}
                <div className="relative flex-1 px-6 pt-4">
                   <div className="space-y-1">
                      <div className="h-3 w-16 rounded bg-sky-400/30" />
                      <div className="h-8 w-32 rounded bg-white/10" />
                   </div>
                   
                   {/* Overlapping Line Chart Mockup - History vs Future Prediction */}
                   <div className="relative mt-10 h-48 w-full px-4">
                      <svg className="h-full w-full overflow-visible" viewBox="0 0 400 150">
                         {/* Bugun (Today) Indicator */}
                         <line x1="240" y1="0" x2="240" y2="150" stroke="white" strokeWidth="1" strokeDasharray="4 4" className="opacity-30" />
                         <text x="245" y="15" fill="white" fontSize="9" className="font-bold opacity-40 uppercase">Bugün</text>

                         {/* HISTORY SEGMENT */}
                         <path d="M0,120 Q40,100 80,110 T160,80 T240,95" fill="none" stroke="#38bdf8" strokeWidth="2" className="opacity-40" />
                         <path d="M0,122 Q40,98 80,113 T160,78 T240,93" fill="none" stroke="white" strokeWidth="2" />

                         {/* FUTURE SEGMENT */}
                         <path d="M240,93 Q320,60 400,70" fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="8 4" className="drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                         <circle cx="240" cy="93" r="4" fill="white" />
                         <circle cx="400" cy="70" r="4" fill="#fbbf24" className="animate-pulse shadow-[0_0_15px_rgba(251,191,36,1)]" />

                         <text x="10" y="145" fill="white" fontSize="9" className="font-bold opacity-30 uppercase">Geçmiş Veri</text>
                         <text x="260" y="145" fill="#fbbf24" fontSize="9" className="font-bold opacity-70 uppercase tracking-widest">Tahmin</text>
                      </svg>
                      
                      <div className="absolute top-0 right-0">
                         <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400 shadow-lg backdrop-blur-md">
                            GÜVEN: %95
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-auto flex items-center justify-around border-t border-white/10 bg-white/5 p-4">
                   {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-2 w-10 rounded-full bg-white/10" />
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Technical Infrastructure - Altyapı Şeması */}
      <section className="mx-auto mt-48 max-w-7xl px-6 md:px-10">
         <div className="text-center mb-24">
            <h2 className="font-heading text-4xl font-bold text-white md:text-5xl">Teknik Altyapı ve Veri Akışı</h2>
            <p className="mt-6 text-white/50 max-w-2xl mx-auto font-medium">Verileriniz sunucularımızda nasıl işleniyor? Adım adım teknik sürecimiz.</p>
         </div>
         
         <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { icon: Database, t: "Veri Toplama", d: "Yahoo Finance API üzerinden ham fiyat ve hacim verileri eşzamanlı olarak çekilir." },
              { icon: Cpu, t: "Hibrit İşleme", d: "Veriler Prophet trend filtresinden ve LSTM sinir ağlarından geçerek harmanlanır." },
              { icon: BarChart3, t: "Görselleştirme", d: "Recharts kütüphanesi ile yüksek performanslı, interaktif grafiklere dönüştürülür." }
            ].map((step, i) => (
              <div key={step.t} className="relative space-y-6">
                 <div className="mx-auto flex size-20 items-center justify-center rounded-[30px] bg-white text-sky-400 shadow-2xl shadow-white/5 border-white border">
                    <step.icon className="size-10" />
                 </div>
                 <h4 className="text-xl font-bold text-white">{step.t}</h4>
                 <p className="text-[15px] text-white/40 leading-relaxed font-medium">{step.d}</p>
              </div>
            ))}
         </div>
      </section>

      {/* FAQ Section - Sıkça Sorulan Sorular */}
      <section className="mx-auto mt-48 max-w-4xl px-6 md:px-10">
         <div className="text-center mb-16 flex flex-col items-center">
            <div className="size-16 rounded-2xl bg-white flex items-center justify-center text-sky-400 mb-6 shadow-xl">
               <HelpCircle className="size-9" />
            </div>
            <h2 className="font-heading text-4xl font-bold text-white">Sıkça Sorulan Sorular</h2>
         </div>
         
         <div className="space-y-4">
            {[
              { q: "Bu sistem bir yatırım tavsiyesi mi?", a: "Hayır. FinanceScout bilimsel veriye dayalı bir analiz aracıdır. Sonuçlar tamamen matematiksel modellerin ürünüdür ve yatırım tavsiyesi niteliği taşımaz." },
              { q: "Tahminler ne kadar doğru?", a: "Doğruluk oranı varlığın oynaklığına göre değişir. Her analizde sunduğumuz 'Geriye Dönük Test' sekmesi ile sistemin o varlık üzerindeki geçmiş başarısını görebilirsiniz." },
              { q: "Hangi varlıkları analiz edebilirim?", a: "Yahoo Finance üzerinde listelenen tüm global hisse senetleri, kripto paralar ve döviz çiftleri sistemimiz tarafından desteklenmektedir." },
              { q: "Veriler ne kadar güncel?", a: "Veriler Yahoo Finance üzerinden anlık olarak çekilir. Piyasa kapanışlarından sonraki ilk dakikalarda en güncel analiz sonuçlarını alırsınız." }
            ].map((faq, i) => (
              <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left hover:bg-white/8 transition-colors">
                 <h4 className="text-lg font-bold text-sky-400 mb-3"># {faq.q}</h4>
                 <p className="text-white/40 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
         </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto mt-48 max-w-7xl px-6 md:px-10">
        <div className="relative overflow-hidden rounded-[60px] border border-white/20 bg-white/5 px-8 py-16 text-center md:py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent opacity-50" />
          <div className="relative z-10">
            <h2 className="font-heading text-4xl font-bold text-white md:text-6xl">
              Analize Bugün Başlayın
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/60 font-medium md:text-xl leading-relaxed">
              Karmaşık finansal tablolarla vakit kaybetmeyin. İhtiyacınız olan tüm özetler tek bir tık uzağınızda.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/analiz"
                className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-14 px-10 w-full sm:w-auto shadow-2xl shadow-primary/20")}
              >
                Analiz Aracını Aç
                <ArrowRight className="ml-2 size-5" />
              </Link>
              <Link
                href="/iletisim"
                className={cn(buttonVariants({ variant: "glass", size: "lg" }), "h-14 px-10 w-full sm:w-auto")}
              >
                Destek Al
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
