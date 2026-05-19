import { SimpleArticle } from "@/components/site/simple-article";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yasal Bilgiler ve Güvenlik",
};

export default function YasalPage() {
  return (
    <SimpleArticle
      title="Yasal Bilgiler ve Güvenlik"
      description="Gizlilik politikamız, KVKK aydınlatma metni ve platform güvenlik standartlarımız."
      wide
    >
      <section id="guvenlik">
        <h2 className="text-sky-400">Güvenlik ve Güven</h2>
        <p>
          FinanceScout tarayıcınızdan doğrudan kendi çalıştırdığınız arka uca bağlanır; kimlik doğrulama veya ödeme verisi
          talep etmez. Üretim ortamında HTTPS ve erişim günlükleri standart olarak kullanılmalıdır.
        </p>
        <p>
          Sonuçlar makine öğrenmesi tabanlıdır ve geçmiş performans geleceği yansıtmaz. Gerçek işlemler için düzenleyici
          gerekliliklere ve kurum içi risk politikalarına uyun.
        </p>
      </section>

      <hr className="border-white/10 my-12" />

      <section id="gizlilik">
        <h2 className="text-sky-400">Gizlilik Bildirimi</h2>
        <p>
          FinanceScout, kullanıcılarının dijital gizliliğini korumayı taahhüt eder. Bu bildirim, platformumuzu
          kullanırken toplanan bilgilerin türlerini ve bu bilgileri nasıl yönettiğimizi detaylandırmaktadır.
        </p>
        
        <h3>Çerezler ve İzleme Teknolojileri</h3>
        <p>
          Platformumuz, kullanıcı deneyimini iyileştirmek ve teknik performansı analiz etmek amacıyla &quot;çerez&quot;
          adı verilen küçük metin dosyalarını kullanabilir. Çerezler genellikle tercihlerin hatırlanması, performans analizi ve güvenlik amaçlarıyla kullanılır.
        </p>
        
        <h3>Üçüncü Taraf Hizmetleri</h3>
        <p>
          FinanceScout, finansal verileri çekmek için <strong>Yahoo Finance API</strong> gibi dış kaynakları
          kullanmaktadır. Bu sitelerin gizlilik politikalarından FinanceScout sorumlu değildir.
        </p>
      </section>

      <hr className="border-white/10 my-12" />

      <section id="kvkk">
        <h2 className="text-sky-400">KVKK Aydınlatma Metni</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel verileriniz; veri sorumlusu
          sıfatıyla FinanceScout proje ekibi tarafından işlenebilecektir.
        </p>
        
        <h3>İşlenen Veriler</h3>
        <ul>
          <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, log kayıtları ve tarayıcı bilgileri.</li>
          <li><strong>İletişim Bilgileri:</strong> E-posta yoluyla paylaştığınız ad-soyad ve e-posta adresi.</li>
        </ul>

        <h3>İşleme Amaçları</h3>
        <p>Verileriniz; platform güvenliği, kullanıcı geri bildirimleri ve iletişim taleplerinin karşılanması amacıyla işlenmektedir.</p>
      </section>

      <section className="mt-12">
        <p className="text-sm italic text-white/40">
          Bu metin son olarak 19 Mayıs 2026 tarihinde güncellenmiştir.
        </p>
      </section>
    </SimpleArticle>
  );
}
