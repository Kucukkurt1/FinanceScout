import { SimpleArticle } from "@/components/site/simple-article";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
};

export default function IletisimPage() {
  return (
    <SimpleArticle
      title="İletişim"
      description="FinanceScout ile ilgili sorularınız, teknik destek talepleriniz veya iş birliği önerileriniz için bizimle iletişime geçin."
    >
      <section>
        <p>
          Analiz platformumuzun gelişimi için kullanıcılarımızın geri bildirimlerini çok önemsiyoruz. Platformun teknik
          işleyişi, tahmin modellerinin doğruluğu veya genel kullanıcı deneyimi hakkındaki düşüncelerinizi doğrudan
          ilgili ekip üyelerimize iletebilirsiniz.
        </p>
      </section>

      <section>
        <h2>Ekibimize Ulaşın</h2>
        <p>Hızlı ve etkin bir iletişim için mesajınızı ilgili birime yönlendirebilirsiniz:</p>
        <ul className="not-italic">
          <li>
            <strong>Teknik Altyapı & Yazılım:</strong> kucukkurtmm@gmail.com
          </li>
          <li>
            <strong>Veri Bilimi & Algoritmalar:</strong> ahmetb.topcu@gmail.com
          </li>
          <li>
            <strong>Finansal Analiz & İçerik:</strong> atamangazozcu@gmail.com
          </li>
        </ul>
      </section>

      <section>
        <h2>Sosyal Medya ve Topluluk</h2>
        <p>
          Bizi sosyal medya üzerinden takip ederek en yeni özelliklerden ve güncel piyasa analizlerinden haberdar
          olabilirsiniz:
        </p>
        <ul>
          <li><strong>LinkedIn:</strong> [Şirket/Proje Sayfası Bağlantısı]</li>
          <li><strong>GitHub:</strong> [Proje Repo Bağlantısı]</li>
          <li><strong>Twitter/X:</strong> @FinanceScout</li>
        </ul>
      </section>

      <section>
        <p className="text-sm italic">
          * Gönderilen tüm e-postalar 24-48 saat içerisinde değerlendirilmeye alınmaktadır.
        </p>
      </section>
    </SimpleArticle>
  );
}
