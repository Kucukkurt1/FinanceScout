import Link from "next/link";
import { ArrowRight, BarChart3, Binary, ShieldCheck, Zap, Globe, Sparkles, Cpu, CheckCircle2, TrendingUp, LineChart, ShieldAlert, History, Network, Activity } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Her detayıyla bitmiş ve rafine edilmiş Landing Page */
export default function LandingPage() {
  return (
    <div className="overflow-hidden pb-40 text-white">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 md:px-10 md:pt-24 lg:pt-32 text-center flex flex-col items-center">
        <h1 className="font-heading mt-10 max-w-5xl text-5xl font-medium leading-[1.1] tracking-tight text-white md:text-7xl lg:text-[6rem]">
          Veriyi <span className="bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent italic pr-2">GÖRÜNÜR</span> Kılın, <br />
          Geleceği Analiz Edin
        </h1>
        
        <p className="mt-10 max-w-3xl text-lg font-medium leading-relaxed text-white/70 md:text-xl">
          Prophet&apos;in trend analiz gücü ile LSTM Derin Öğrenme&apos;nin hafızasını birleştirdik. 
          Piyasa hareketlerini şeffaf, dürüst ve bilimsel bir dille çözümleyin.
        </p>

        <div className="mt-14 flex flex-col items-center gap-5 sm:flex-row">
          <Link
            href="/home"
            className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-16 px-12 text-lg shadow-2xl shadow-primary/30")}
          >
            Uygulamayı Başlat
            <ArrowRight className="ml-2 size-6" />
          </Link>
          <Link
            href="/hizmetler"
            className={cn(buttonVariants({ variant: "glass", size: "lg" }), "h-16 px-12 text-lg")}
          >
            Özellikleri Keşfet
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div className="relative mt-24 w-full max-w-5xl">
          <div className="rounded-[40px] border border-white/10 bg-slate-950/60 p-4 shadow-3xl backdrop-blur-xl">
             <div className="overflow-hidden rounded-[32px] border border-white/5 bg-black/40">
                <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/5">
                   <div className="flex gap-2">
                      <div className="size-3 rounded-full bg-rose-500/50" />
                      <div className="size-3 rounded-full bg-amber-500/50" />
                      <div className="size-3 rounded-full bg-emerald-500/50" />
                   </div>
                   <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">FinanceScout Analiz Paneli</div>
                </div>
                <div className="p-8 grid md:grid-cols-[280px_1fr] gap-8 text-left">
                   <div className="space-y-6">
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-5">
                         <div>
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Varlık Seçimi</div>
                            <div className="flex items-center justify-between h-10 w-full rounded-xl bg-primary/20 border border-primary/30 px-4">
                               <span className="text-sm font-bold text-white">EURTRY=X</span>
                               <span className="text-[10px] text-primary font-bold">DÖVİZ</span>
                            </div>
                         </div>
                         <div>
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2">Analiz Kapsamı</div>
                            <div className="h-10 w-full rounded-xl bg-white/5 border border-white/5 px-4 flex items-center text-xs text-white/60">
                               365 Gün Geçmiş
                            </div>
                         </div>
                      </div>
                      <div className="h-12 w-full rounded-xl bg-white text-primary text-xs font-black flex items-center justify-center uppercase tracking-widest shadow-lg">Analizi Başlat</div>
                   </div>
                   <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                         {[
                           {l: "HATA PAYI", v: "%1.2", c: "text-emerald-400"},
                           {l: "RİSK", v: "ORTA", c: "text-amber-400"},
                           {l: "GÜVEN", v: "%95", c: "text-primary"}
                         ].map(m => (
                           <div key={m.l} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <div className="text-[9px] text-white/30 font-bold uppercase tracking-tighter">{m.l}</div>
                              <div className={cn("text-lg font-bold mt-1 tabular-nums", m.c)}>{m.v}</div>
                           </div>
                         ))}
                      </div>
                      <div className="relative h-48 w-full rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center p-6 overflow-hidden">
                         <div className="absolute left-6 top-6">
                            <p className="text-[10px] font-bold text-white/20 uppercase">Trend Analizi</p>
                            <p className="text-xl font-bold text-white">35.42 ₺</p>
                         </div>
                         <svg className="h-32 w-full mt-4" viewBox="0 0 400 100">
                            <path d="M0,85 Q50,45 100,65 T200,35 T300,55 T400,15" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />
                            <path d="M200,35 Q250,15 300,25 T400,10" fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="6 3" />
                            <circle cx="200" cy="35" r="4" fill="white" className="shadow-[0_0_10px_white]" />
                         </svg>
                         <div className="absolute bottom-4 right-6 flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 border border-primary/30">
                            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[9px] font-bold text-primary uppercase">Hibrit Model Aktif</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="mx-auto mt-40 max-w-4xl px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
           <div className="space-y-12 text-left">
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
              {[
                { icon: Globe, t: "Küresel Veri Erişimi", d: "100.000+ Hisse, Kripto ve Döviz çifti." },
                { icon: CheckCircle2, t: "Güven Hedefi", d: "Yüksek doğruluk odaklı algoritmik yapı." },
                { icon: ShieldCheck, t: "Güvenli Analiz", d: "Veri gizliliği ve şeffaf metodoloji." },
                { icon: Zap, t: "7/24 Anlık Güncelleme", d: "Piyasa kapanışlarıyla eşzamanlı veri akışı." },
              ].map((item) => (
                <div key={item.t} className="flex items-start gap-6 group">
                   <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                      <item.icon className="size-7 stroke-[url(#icon-gradient)]" />
                   </div>
                   <div>
                      <h4 className="text-xl font-bold text-white">{item.t}</h4>
                      <p className="mt-2 text-white/50 font-medium">{item.d}</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="relative">
              <div className="aspect-[4/5] rounded-[40px] bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 p-10 flex flex-col justify-between">
                 <Zap className="size-16 text-sky-300" />
                 <div>
                    <p className="text-6xl font-bold text-white mb-4 tracking-tighter">AI</p>
                    <p className="text-lg font-medium text-sky-200/60 leading-relaxed uppercase tracking-widest">Geleceği Bugün <br /> Modelle</p>
                 </div>
              </div>
              <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
           </div>
        </div>
      </section>

      {/* Hybrid Architecture */}
      <section className="mx-auto mt-56 max-w-7xl px-6 md:px-10">
        <div className="text-center mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-4">Teknolojik Altyapı</p>
          <h2 className="font-heading text-4xl font-bold text-white md:text-6xl tracking-tight">İki Gücün Birleşimi</h2>
          <p className="mt-8 max-w-3xl mx-auto text-lg text-white/60 leading-relaxed">
            FinanceScout, geleneksel istatistiksel modellerin trend yakalama yeteneği ile modern derin öğrenme algoritmalarının örüntü tanıma kabiliyetini tek bir potada eritir. 
            Bu hibrit yapı, piyasanın hem geçmiş hafızasını hem de gelecekteki olası kırılma noktalarını aynı anda analiz etmemize olanak tanır.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
           <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/8 transition-all group text-left">
              <TrendingUp className="size-12 mb-8 stroke-[url(#icon-gradient)]" />
              <h3 className="text-2xl font-bold text-white mb-4">Prophet</h3>
              <p className="text-white/50 leading-relaxed font-medium">
                Piyasanın &quot;ana yönünü&quot; belirler. Yıllık trendler, aylık döngüler ve bayram gibi özel günlerin fiyat üzerindeki etkisini matematiksel kesinlikle çözer.
              </p>
           </div>
           <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/8 transition-all group text-left">
              <Cpu className="size-12 mb-8 stroke-[url(#icon-gradient)]" />
              <h3 className="text-2xl font-bold text-white mb-4">LSTM</h3>
              <p className="text-white/50 leading-relaxed font-medium">
                Piyasanın &quot;hafızasını&quot; tutar. Prophet&apos;in göremediği ani fiyat hareketlerini ve kısa vadeli desenleri sinir ağları sayesinde yakalar.
              </p>
           </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="mx-auto mt-56 max-w-7xl px-6 md:px-10">
        <div className="relative overflow-hidden rounded-[60px] border border-white/10 bg-slate-950/40 p-12 md:p-24 text-center">
          <div className="relative z-10">
             <h2 className="font-heading text-4xl font-bold text-white md:text-6xl leading-tight">
               Şeffaf ve Dürüst Analiz
             </h2>
             <p className="mx-auto mt-8 max-w-3xl text-lg text-white/60 md:text-xl leading-relaxed font-medium">
               Biz bir &quot;kara kutu&quot; değiliz. Finans dünyasında güvenin şeffaflıktan geçtiğine inanıyoruz.
             </p>
             
             <div className="mt-24 grid gap-12 md:grid-cols-3 text-left">
                {[
                  { icon: History, t: "Geriye Dönük Kanıt", d: "Seçtiğiniz sürenin son %20'sini yapay zekadan saklar ve ne kadar isabetli tahmin yaptığını size kanıtlarız." },
                  { icon: ShieldAlert, t: "Hata Payı Yönetimi", d: "RMSE ve MAE metriklerini herkesin anlayabileceği bir dille sunarak modelin sapma paylarını açıkça gösteririz." },
                  { icon: BarChart3, t: "Bilimsel Yaklaşım", d: "Yatırım tavsiyesi değil, veriye dayalı objektif modeller sunarak karar destek katmanı sağlarız." }
                ].map(item => (
                  <div key={item.t} className="space-y-6">
                     <item.icon className="size-8 text-white" />
                     <h4 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">{item.t}</h4>
                     <p className="text-white/40 text-[15px] leading-relaxed font-medium">{item.d}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* How it Works - Adım Adım */}
      <section className="mx-auto mt-56 max-w-7xl px-6 md:px-10 text-center flex flex-col items-center">
         <h2 className="font-heading text-4xl font-bold text-white md:text-5xl leading-tight mb-20">
           Analiz Süreci <span className="text-white">Nasıl İşliyor?</span>
         </h2>
         <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 text-left">
               <div className="space-y-12">
                  {[
                    { num: "1", t: "Varlık ve Kapsam Seçimi", d: "Binlerce varlık arasından analize başlamak istediğiniz sembolü ve tarih aralığını belirlersiniz." },
                    { num: "2", t: "Hibrit Model İşleme", d: "Verileriniz aynı anda hem Prophet hem de LSTM modellerinden geçerek harmanlanır." },
                    { num: "3", t: "Sonuç ve Doğrulama", d: "Gelecek öngörüleri, hata payları ve geriye dönük test sonuçlarıyla birlikte saniyeler içinde sunulur." },
                  ].map(step => (
                    <div key={step.num} className="flex gap-8 items-start group">
                       <span className="text-6xl font-black font-heading leading-none bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent"> {step.num} </span>
                       <div>
                          <h4 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">{step.t}</h4>
                          <p className="mt-2 text-white/50 leading-relaxed font-medium">{step.d}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="lg:w-1/2 relative aspect-square w-full max-w-md">
               <div className="absolute inset-0 bg-primary/20 rounded-[60px] blur-3xl animate-pulse" />
               <div className="relative h-full w-full bg-white/5 border border-white/10 rounded-[60px] flex items-center justify-center p-12 overflow-hidden">
                  <div className="grid grid-cols-2 gap-4 w-full">
                     <div className="h-32 rounded-3xl bg-sky-500/20 border border-sky-400/30 flex flex-col items-center justify-center gap-2 shadow-lg">
                        <Globe className="size-6 text-sky-400" />
                        <span className="text-[10px] font-bold text-sky-400 uppercase">VERİ</span>
                     </div>
                     <div className="h-32 rounded-3xl bg-purple-500/20 border border-purple-400/30 flex flex-col items-center justify-center gap-2 shadow-lg">
                        <Cpu className="size-6 text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-400 uppercase">MODEL</span>
                     </div>
                     <div className="h-32 rounded-3xl bg-amber-500/20 border border-amber-400/30 flex flex-col items-center justify-center gap-2 shadow-lg">
                        <Binary className="size-6 text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-400 uppercase">TEST</span>
                     </div>
                     <div className="h-32 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex flex-col items-center justify-center gap-2 shadow-lg">
                        <TrendingUp className="size-6 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">SONUÇ</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto mt-56 max-w-7xl px-6 text-center md:px-10">
        <div className="flex flex-col items-center">
           <div className="size-20 rounded-[30px] bg-white/5 flex items-center justify-center text-white mb-12 border border-white/10 shadow-2xl">
              <TrendingUp className="size-10" />
           </div>
           <h2 className="font-heading text-5xl font-bold text-white md:text-7xl leading-tight whitespace-nowrap">
             Analiz Etmeye Hazır Mısınız?
           </h2>
           <p className="mt-10 text-white/50 max-w-3xl mx-auto text-lg leading-relaxed font-medium">
             Yapay zeka ile güçlendirilmiş, dürüst ve şeffaf finansal analiz deneyimi için uygulamayı hemen başlatın. 
             Prophet ve LSTM modellerinin hibrit gücüyle veriye dayalı stratejiler geliştirin, 
             piyasanın karmaşık yapısını bilimsel modellerle sadeleştirerek kararlarınızı sağlam bir zemine oturtun. 
             Küresel piyasalardaki verileri anlık olarak işleyerek, size sadece rakamlar değil, anlamlı ve aksiyon alınabilir öngörüler sunuyoruz.
           </p>
           <div className="mt-16">
             <Link
               href="/home"
               className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-20 px-16 text-xl rounded-2xl shadow-3xl shadow-primary/40 transition-all hover:scale-105")}
             >
               Şimdi Başlat
             </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
