import { SimpleArticle } from "@/components/site/simple-article";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kurumsal",
};

export default function HakkimizdaPage() {
  return (
    <SimpleArticle
      title="Hakkımızda"
      description="FinanceScout; karmaşık piyasa verilerini stratejik öngörülere dönüştüren, modern ve şeffaf bir finansal analiz ekosistemidir."
    >
      <section>
        <p>
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

      <section>
        <h2>Kurucu Ekibimiz</h2>
        <p>
          FinanceScout, teknoloji ve finansı bir araya getiren vizyoner bir ekip tarafından hayata geçirilmiştir.
          Sorularınız veya iş birliği talepleriniz için bize ulaşabilirsiniz:
        </p>
        <ul className="not-italic">
          <li>
            <strong>Kurucu Ortak & Yazılım Geliştirici:</strong> Mehmet Emin Küçükkurt
          </li>
          <li>
            <strong>Veri Bilimcisi:</strong> Ahmet Topçu
          </li>
          <li>
            <strong>Finansal Analist:</strong> Ataman Gazozcu
          </li>
        </ul>
      </section>

      <section>
        <h2>Önemli Not</h2>
        <p>
          FinanceScout bir demo ve öğrenme platformudur. Sunulan analizler, tahminler ve grafikler tamamen algoritmik
          modellerin çıktılarıdır ve kesinlikle <strong>yatırım tavsiyesi niteliği taşımaz</strong>. Platformumuz
          üzerinde gerçek bir bankacılık, portföy yönetimi veya aracılık hizmeti sunulmamaktadır.
        </p>
      </section>
    </SimpleArticle>
  );
}
