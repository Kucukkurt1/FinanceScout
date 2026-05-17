import { SimpleArticle } from "@/components/site/simple-article";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik bildirimi",
};

export default function GizlilikPage() {
  return (
    <SimpleArticle
      title="Gizlilik Bildirimi"
    >
      <section>
        <p>
          FinanceScout, kullanıcılarının dijital gizliliğini korumayı taahhüt eder. Bu bildirim, platformumuzu
          kullanırken toplanan bilgilerin türlerini ve bu bilgileri nasıl yönettiğimizi detaylandırmaktadır.
        </p>
      </section>

      <section>
        <h2>Çerezler ve İzleme Teknolojileri</h2>
        <p>
          Platformumuz, kullanıcı deneyimini iyileştirmek ve teknik performansı analiz etmek amacıyla &quot;çerez&quot;
          adı verilen küçük metin dosyalarını kullanabilir. Çerezler genellikle şu amaçlarla kullanılır:
        </p>
        <ul>
          <li><strong>Tercihlerin Hatırlanması:</strong> Dil seçimi veya son aranan semboller gibi tercihlerin kaydedilmesi.</li>
          <li><strong>Performans Analizi:</strong> Hangi sayfaların daha çok ziyaret edildiğini anlamak için anonim verilerin toplanması.</li>
          <li><strong>Güvenlik:</strong> Oturum güvenliğini sağlamak ve kötü niyetli aktiviteleri engellemek.</li>
        </ul>
        <p>
          Tarayıcı ayarlarınızı değiştirerek çerezleri reddedebilir veya çerez gönderildiğinde uyarı alabilirsiniz.
          Ancak çerezlerin devre dışı bırakılması, platformun bazı özelliklerinin tam performansla çalışmasını
          engelleyebilir.
        </p>
      </section>

      <section>
        <h2>Üçüncü Taraf Hizmetleri ve Bağlantılar</h2>
        <p>
          FinanceScout, finansal verileri çekmek için <strong>Yahoo Finance API</strong> gibi dış kaynakları
          kullanmaktadır. Ayrıca, sayfalarımızda üçüncü taraf web sitelerine bağlantılar bulunabilir. Bu sitelerin
          gizlilik politikalarından FinanceScout sorumlu değildir. Ziyaret ettiğiniz her sitenin gizlilik politikasını
          ayrıca incelemenizi öneririz.
        </p>
      </section>

      <section>
        <h2>Veri Güvenliği</h2>
        <p>
          Topladığımız verilerin (log kayıtları, iletişim e-postaları vb.) yetkisiz erişime, değiştirilmeye veya
          ifşa edilmesine karşı korunması için endüstri standardı güvenlik önlemlerini (SSL sertifikaları, güvenli
          sunucu yapılandırmaları vb.) uyguluyoruz. Ancak, internet üzerinden iletilen hiçbir verinin %100 güvenli
          olduğu garanti edilemez.
        </p>
      </section>

      <section>
        <h2>Çocukların Gizliliği</h2>
        <p>
          FinanceScout, 18 yaşın altındaki bireylerden bilerek kişisel veri toplamaz. Eğer bir ebeveynseniz ve
          çocuğunuzun bize veri sağladığını fark ederseniz, lütfen bizimle iletişime geçin; bu verileri sistemimizden
          derhal sileceğiz.
        </p>
      </section>

      <section>
        <h2>Değişiklikler</h2>
        <p>
          Bu Gizlilik Bildirimi, yeni özellikler eklendikçe veya yasal gereklilikler değiştikçe güncellenebilir.
          Değişiklikleri bu sayfa üzerinden takip edebilirsiniz.
        </p>
      </section>

      <section>
        <p className="text-sm italic">
          Son Güncelleme: 17 Mayıs 2026
        </p>
      </section>
    </SimpleArticle>
  );
}
