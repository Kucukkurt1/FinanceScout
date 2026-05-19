import { SimpleArticle } from "@/components/site/simple-article";
import { ContactTeamView } from "@/components/site/contact-team-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hakkımızda",
};

export default function HakkimizdaPage() {
  return (
    <div className="pb-20">
      <SimpleArticle
        title="Hakkımızda"
        description="FinanceScout; karmaşık piyasa verilerini stratejik öngörülere dönüştüren, modern ve şeffaf bir finansal analiz ekosistemidir."
        wide
      >
        <section className="!mt-0">
          <h2 className="text-sky-400">Vizyonumuz ve Misyonumuz</h2>
          <p className="max-w-none text-base leading-relaxed text-white/85 md:text-lg md:leading-8">
            FinanceScout, finans dünyasının gürültüsünü azaltmak ve veri odaklı karar alma süreçlerini desteklemek amacıyla
            geliştirilmiş bir dijital platformdur. Temel önceliğimiz, kullanıcılara sunduğumuz her veride <strong>şeffaflık ve güven</strong> 
            sağlamaktır. Amacımız, sadece fiyat hareketlerini göstermek değil; bu hareketlerin ardındaki trendleri ve olası gelecek 
            senaryolarını bilimsel modellerle anlaşılır kılmaktır. 
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/85 md:text-lg md:leading-8">
            Geleneksel finansal analiz araçlarının karmaşıklığını ortadan kaldırarak, her seviyeden yatırımcının ve meraklının
            veriye dayalı içgörülere ulaşmasını hedefliyoruz. Şeffaflık, doğruluk ve yenilikçilik ilkelerimiz doğrultusunda,
            finansal okuryazarlığı artırmak ve teknoloji ile finansı bir araya getirmek için çalışıyoruz.
          </p>
        </section>

        <section>
          <h2 className="text-sky-400">Teknolojimiz ve Yaklaşımımız</h2>
          <p>
            Platformumuzun kalbinde, modern veri bilimi teknikleri ve ileri matematiksel modelleme yer almaktadır. 
            Özellikle Facebook tarafından geliştirilen <strong>Prophet</strong> zaman serisi tahmin kütüphanesini kullanarak,
            karmaşık trendleri, mevsimsel etkileri ve tatil dönemi değişimlerini otomatik olarak yakalıyoruz.
          </p>
          <p className="mt-4">
            Ayrıca, derin öğrenme temelli <strong>LSTM (Long Short-Term Memory)</strong> ağları ile verideki uzun dönemli bağımlılıkları
            analiz ederek modellerimizi destekliyoruz. Bu hibrit yaklaşım, hem istatistiksel sağlamlık hem de makine öğrenmesinin
            esnekliğini bir araya getirmektedir. Analizlerimizde hata paylarını (RMSE, MAE) ve model performansını şeffaf bir şekilde
            sunarak, kullanıcının sonucun güvenilirliğini değerlendirmesine olanak tanıyoruz.
          </p>
        </section>

        <section>
          <h2 className="text-sky-400">Veri Odaklı Karar Verme</h2>
          <p>
            FinanceScout, piyasa duyarlılığı (Sentiment Analysis) ve önemli küresel olayların (Economic Events) piyasa üzerindeki
            etkilerini de analizine dahil eder. Haber akışlarını ve sosyal medya sinyallerini işleyerek, rakamların ötesindeki
            psikolojik trendleri anlamaya çalışıyoruz. Amacımız, kullanıcılara 360 derecelik bir bakış açısı sunarak,
            belirsizliklerin hakim olduğu piyasalarda daha sağlam adımlar atmalarına yardımcı olmaktır.
          </p>
        </section>
      </SimpleArticle>

      <div className="mt-10">
        <ContactTeamView />
      </div>
    </div>
  );
}
