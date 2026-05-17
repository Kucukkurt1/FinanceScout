import { SimpleArticle } from "@/components/site/simple-article";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK aydınlatma",
};

export default function KvkkPage() {
  return (
    <SimpleArticle
      title="KVKK Aydınlatma Metni"
    >
      <section>
        <p>
          FinanceScout olarak, kişisel verilerinizin güvenliğine ve gizliliğine önem veriyoruz.
          Bu Aydınlatma Metni, platformumuzu ziyaret ettiğinizde veya bizimle iletişime geçtiğinizde işlenen kişisel
          verileriniz hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.
        </p>
      </section>

      <section>
        <h2>1. Veri Sorumlusu</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel verileriniz; veri sorumlusu
          sıfatıyla FinanceScout proje ekibi tarafından aşağıda açıklanan kapsamda işlenebilecektir.
        </p>
      </section>

      <section>
        <h2>2. İşlenen Kişisel Verileriniz</h2>
        <p>Platformumuzun kullanımı sırasında aşağıdaki veri kategorileri işlenmektedir:</p>
        <ul>
          <li>
            <strong>İşlem Güvenliği Bilgileri:</strong> Platformu ziyaretiniz sırasında otomatik olarak toplanan IP
            adresi, log kayıtları ve tarayıcı bilgileri.
          </li>
          <li>
            <strong>İletişim Bilgileri:</strong> Bizimle e-posta yoluyla iletişime geçtiğinizde paylaştığınız ad-soyad,
            e-posta adresi ve mesaj içeriği.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
        <p>Kişisel verileriniz şu amaçlarla işlenmektedir:</p>
        <ul>
          <li>Platformun teknik altyapısının yönetilmesi ve güvenliğinin sağlanması.</li>
          <li>Kullanıcı geri bildirimlerinin değerlendirilmesi ve teknik destek süreçlerinin yürütülmesi.</li>
          <li>Piyasa analiz hizmetlerimizin optimize edilmesi ve hata ayıklama süreçleri.</li>
          <li>İletişim taleplerinize yanıt verilmesi.</li>
        </ul>
      </section>

      <section>
        <h2>4. Kişisel Verilerin Aktarılması</h2>
        <p>
          FinanceScout, topladığı verileri üçüncü şahıslara veya kurumlara ticari amaçlarla satmaz veya kiralamaz.
          Verileriniz, yalnızca yasal yükümlülüklerin yerine getirilmesi amacıyla yetkili kamu kurum ve kuruluşları ile
          paylaşılabilecektir.
        </p>
      </section>

      <section>
        <h2>5. Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
        <p>
          Kişisel verileriniz, tamamen otomatik yollarla (sunucu kayıtları) veya elektronik ortamda gönderdiğiniz
          e-postalar aracılığıyla toplanmaktadır. Bu süreçte hukuki sebebimiz; KVKK Madde 5/2-f uyarınca &quot;ilgili
          kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri
          işlenmesinin zorunlu olması&quot;dır.
        </p>
      </section>

      <section>
        <h2>6. İlgili Kişinin Hakları</h2>
        <p>
          KVKK&apos;nın 11. maddesi uyarınca bize başvurarak; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi
          talep etme, işlenme amacını öğrenme, verilerin düzeltilmesini veya silinmesini isteme gibi haklara sahipsiniz.
          Taleplerinizi iletişim sayfamızda yer alan e-posta adresleri üzerinden bize iletebilirsiniz.
        </p>
      </section>

      <section>
        <p className="text-sm italic">
          Bu metin son olarak 17 Mayıs 2026 tarihinde güncellenmiştir.
        </p>
      </section>
    </SimpleArticle>
  );
}
