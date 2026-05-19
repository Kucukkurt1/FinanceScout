import { SimpleArticle } from "@/components/site/simple-article";
import { FeedbackPanel } from "@/components/tools/feedback-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kurumsal",
};

export default function HakkimizdaPage() {
  return (
    <SimpleArticle
      title="Hakkımızda"
      description="FinanceScout; karmaşık piyasa verilerini stratejik öngörülere dönüştüren, modern ve şeffaf bir finansal analiz ekosistemidir."
      wide
    >
      <section className="!mt-0">
        <p className="max-w-none text-base leading-relaxed text-white/85 md:text-lg md:leading-8">
          FinanceScout, finans dünyasının gürültüsünü azaltmak ve veri odaklı karar alma süreçlerini desteklemek amacıyla
          geliştirilmiş bir dijital platformdur. Amacımız, sadece fiyat hareketlerini göstermek değil; bu hareketlerin
          ardındaki trendleri ve olası gelecek senaryolarını bilimsel modellerle anlaşılır kılmaktır.
        </p>
      </section>

      <section>
        <h2>Teknolojimiz ve Yaklaşımımız</h2>
        <p>
          Platformumuzun kalbinde, Facebook tarafından geliştirilen <strong>Prophet</strong> zaman serisi tahmin
          kütüphanesi yer almaktadır. Bu ileri seviye matematiksel modelleme sayesinde:
        </p>
        <ul>
          <li>
            <strong>Trend Analizi:</strong> Fiyatlardaki uzun dönemli eğilimleri mevsimsellikten arındırarak net bir
            şekilde sunuyoruz.
          </li>
          <li>
            <strong>Gelecek Öngörüleri:</strong> Geçmiş verileri kullanarak belirli bir güven aralığında gelecek
            tahminleri üretiyoruz.
          </li>
          <li>
            <strong>Hata Payı ve Volatilite:</strong> Tahminlerimizi RMSE ve MAE gibi metriklerle test ediyor, piyasa
            oynaklığını matematiksel olarak ölçüyoruz.
          </li>
        </ul>
      </section>

      <section>
        <h2>Kapsamlı Veri Ağı</h2>
        <p>
          Borsa İstanbul&apos;dan (BIST) Wall Street&apos;e, kripto para piyasalarından emtia ve döviz paritelerine kadar
          geniş bir yelpazede analiz imkanı sunuyoruz. Yahoo Finance API entegrasyonumuz ile küresel piyasaların nabzını
          tutuyoruz.
        </p>
      </section>

      <section id="geri-bildirim" className="scroll-mt-28 not-prose !mt-14">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-white md:text-3xl">Geri bildirim</h2>
        <p className="mt-3 max-w-4xl text-[15px] leading-relaxed text-white/65">
          Öneri, hata raporu veya özellik isteğinizi paylaşın; öncelik vermek istediğiniz geliştirmeyi seçin.
        </p>
        <div className="mt-6">
          <FeedbackPanel variant="about" />
        </div>
      </section>

      <section className="!mt-14 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-5 md:px-6">
        <h2 className="!mt-0 text-lg font-semibold text-amber-100/90">Önemli Not</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/75">
          FinanceScout bir demo ve öğrenme platformudur. Sunulan analizler, tahminler ve grafikler tamamen algoritmik
          modellerin çıktılarıdır ve kesinlikle <strong className="text-white">yatırım tavsiyesi niteliği taşımaz</strong>.
          Platformumuz üzerinde gerçek bir bankacılık, portföy yönetimi veya aracılık hizmeti sunulmamaktadır.
        </p>
      </section>
    </SimpleArticle>
  );
}
