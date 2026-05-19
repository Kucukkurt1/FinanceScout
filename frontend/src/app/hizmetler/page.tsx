import Link from "next/link";
import { ArrowRight, BarChart3, Binary, ShieldCheck, Zap, Globe, PieChart } from "lucide-react";
import type { Metadata } from "next";

import { ServicesChartMockup } from "@/components/site/services-chart-mockup";
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
            <h1 className="font-heading text-5xl font-semibold leading-[1.1] tracking-[-0.03em] text-white md:text-6xl lg:text-7xl">
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
            Geleneksel analiz araçlarının aksine, biz hıza, şeffaflığa ve derin öğrenmeye odaklanıyoruz. 
            Platformumuz, modern finans dünyasının en güvenilir algoritmalarını kullanıcı dostu bir arayüzle birleştirir.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {[
            {
              icon: Globe,
              t: "Kapsamlı Global Veri",
              d: "Yahoo Finance API entegrasyonu sayesinde ABD, Avrupa ve Asya piyasalarından anlık veri çekiyor, Borsa İstanbul (BIST) verilerini ise özel optimizasyonlarla işliyoruz. Binlerce hisse senedi, döviz çifti ve emtia tek bir merkezde.",
            },
            {
              icon: ShieldCheck,
              t: "Hibrit Tahmin Mimarisi",
              d: "Sadece istatistiksel modellerle kalmıyoruz. Meta'nın Prophet kütüphanesini derin öğrenme (LSTM) tabanlı ağlarla harmanlayarak hem trend döngülerini hem de kısa vadeli piyasa gürültülerini aynı anda analiz ediyoruz.",
            },
            {
              icon: BarChart3,
              t: "İnteraktif Görselleştirme",
              d: "Karmaşık CSV tabloları yerine, etkileşimli grafikler ve anlamlı metriklerle karar vermenizi kolaylaştırıyoruz. Üst, orta ve alt güven aralıkları ile piyasanın olası tüm senaryolarını görün.",
            },
            {
              icon: Zap,
              t: "Sıfır Kurulum, Anlık Analiz",
              d: "Herhangi bir yazılım indirmenize gerek kalmadan, doğrudan tarayıcınız üzerinden saniyeler içinde analiz başlatın. PWA desteğimiz sayesinde FinanceScout'u mobil cihazınıza uygulama gibi kurabilirsiniz.",
            },
          ].map((f) => (
            <div key={f.t} className="flex gap-5 rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-sky-500/30 transition-colors">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <f.icon className="size-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{f.t}</h4>
                <p className="mt-3 leading-relaxed text-white/60 text-sm md:text-base">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="metodoloji"
        className={cn("mx-auto mt-24 scroll-mt-28 md:mt-32", SITE_NAV_CLEARANCE)}
      >
        <div className="rounded-[40px] border border-white/12 bg-white/[0.04] px-6 py-12 md:px-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-400 to-white">
              Metodoloji ve Şeffaflık
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg md:leading-8">
              FinanceScout'un tahmin motoru, akademik doğruluk metrikleri ve modern veri işleme teknikleri üzerine inşa edilmiştir. 
              İşte motorumuzun çalışma prensipleri:
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-all">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-white">Veri Entegrasyonu</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base md:leading-8">
                Günlük kapanış fiyatları Yahoo Finance (yfinance) üzerinden asenkron olarak çekilir. Veriler ham halde işlenmez; 
                eksik günlerin tamamlanması ve aykırı değerlerin (outliers) temizlenmesi gibi ön işleme süreçlerinden geçer.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-all">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-white">Prophet + Momentum Karışımı</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base md:leading-8">
                Meta (Facebook) tarafından geliştirilen Prophet, mevsimselliği ve tatil günlerini analiz eder. Biz buna 
                son 21 günün üstel hareketli ortalamasına (EWMA) dayalı momentum katmanını ekleyerek daha gerçekçi bir patika oluşturuyoruz.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-all">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-white">LSTM Derin Öğrenme</h3>
              <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base md:leading-8">
                LSTM (Long Short-Term Memory) ağlarımız, piyasanın "hafızasını" tutar. Ani fiyat dalgalanmalarını ve 
                geleneksel modellerin kaçırabileceği örüntüleri yakalamak için Prophet ile ağırlıklı bir ensemble oluşturulur.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition-all">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-white">Doğrulama (Validation)</h3>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-white/60 md:text-base md:leading-8">
                <li><strong className="text-white">Backtesting:</strong> Verinin son %20'si gizlenerek model başarısı ölçülür.</li>
                <li><strong className="text-white">RMSE & MAE:</strong> Ortalama hata payları matematiksel olarak hesaplanır.</li>
                <li><strong className="text-white">Walk-forward:</strong> Zaman içinde kayan pencerelerle dinamik testler yapılır.</li>
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-3xl p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-center text-sm leading-relaxed text-amber-200/70 md:text-base italic">
              Uyarı: Finansal piyasalar makroekonomik ve politik şoklara açıktır. Modellerimiz geçmiş verilere dayanarak 
              olasılık üretir, kesinlik vaat etmez. Sonuçlar yatırım tavsiyesi niteliği taşımaz.
            </p>
          </div>
        </div>
      </section>

      <section className={cn("mx-auto mt-32 max-w-7xl", SITE_NAV_CLEARANCE)}>
        <div className="relative overflow-hidden rounded-[48px] border border-white/20 bg-white/5 px-8 py-16 text-center md:py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent opacity-50" />
          <div className="relative z-10">
            <h2 className="font-heading text-4xl font-semibold text-white md:text-6xl">Analize Bugün Başlayın</h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-white/70 md:text-xl">
              Karmaşık finansal tablolarla vakit kaybetmeyin. İhtiyacınız olan tüm özetler tek bir tık uzağınızda.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/analiz"
                className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-14 w-full px-10 sm:w-auto shadow-xl shadow-sky-500/20")}
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
          </div>
        </div>
      </section>
    </div>
  );
}
