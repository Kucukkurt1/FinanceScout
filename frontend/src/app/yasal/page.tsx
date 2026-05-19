import { SimpleArticle } from "@/components/site/simple-article";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yasal Bilgiler ve Şartlar",
};

export default function YasalPage() {
  return (
    <SimpleArticle
      title="Yasal Bilgiler ve Şartlar"
      description="FinanceScout kullanım koşulları, veri güvenliği standartları ve yasal sorumluluk sınırları."
      wide
    >
      <section id="kullanim-kosullari">
        <h2 className="text-sky-400">1. Kullanım Koşulları</h2>
        <p>
          FinanceScout platformuna erişim sağlayarak ve platformu kullanarak, aşağıda belirtilen tüm şartları ve koşulları kabul etmiş sayılırsınız. 
          Bu platform, finansal piyasa verilerini analiz etmek ve makine öğrenmesi modelleriyle (Prophet, LSTM) tahminler yürütmek amacıyla tasarlanmış bir dijital araçtır.
        </p>
        <p className="mt-4">
          Kullanıcılar, platformu yalnızca yasal amaçlar doğrultusunda kullanmayı taahhüt ederler. Platformun işleyişini bozmaya yönelik herhangi bir girişim, 
          veri madenciliği veya yetkisiz erişim çabaları yasal takibat başlatılmasına neden olabilir.
        </p>
      </section>

      <section id="yatirim-tavsiyesi-degildir" className="mt-12 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
        <h2 className="text-amber-400 !mt-0">2. Önemli Finansal Uyarı (Disclaimer)</h2>
        <p className="font-semibold text-white">
          FinanceScout tarafından sunulan hiçbir analiz, grafik, tahmin veya metrik kesinlikle YATIRIM TAVSİYESİ DEĞİLDİR.
        </p>
        <p className="mt-4 text-white/80">
          Platformda yer alan tahminler, geçmiş veriler üzerinden algoritmik modellerle üretilmektedir. Finansal piyasalar doğası gereği yüksek risk içerir ve 
          geçmiş performans gelecekteki sonuçların garantisi olamaz. Platform tarafından üretilen verilere dayanarak alınan yatırım kararlarından doğabilecek 
          kar veya zararlardan FinanceScout ve geliştirici ekibi hiçbir şekilde sorumlu tutulamaz. Yatırım kararlarınızı almadan önce mutlaka SPK lisanslı 
          yatırım danışmanlarına başvurmalısınız.
        </p>
      </section>

      <section id="veri-guvenligi" className="mt-12">
        <h2 className="text-sky-400">3. Veri Güvenliği ve Altyapı</h2>
        <p>
          FinanceScout, kullanıcı güvenliğini en üst düzeyde tutmayı hedefler. Platformumuz, tarayıcı tabanlı güvenli bağlantılar (HTTPS) üzerinden çalışmaktadır. 
          Kullanıcılardan kredi kartı bilgisi, şifre veya hassas kimlik verileri talep edilmez.
        </p>
        <p className="mt-4">
          Finansal veriler, Yahoo Finance gibi güvenilir üçüncü taraf API servisleri üzerinden anlık olarak çekilmektedir. Bu veri sağlayıcıların servislerindeki 
          kesintilerden veya veri hatalarından platformumuz sorumlu değildir.
        </p>
      </section>

      <section id="gizlilik" className="mt-12">
        <h2 className="text-sky-400">4. Gizlilik Politikası</h2>
        <p>
          Kullanıcı gizliliği FinanceScout için bir önceliktir. Platformumuzu kullanırken toplanan sınırlı veriler (IP adresi, log kayıtları, tarayıcı tipi) 
          yalnızca sistemin performansını optimize etmek ve güvenliği sağlamak amacıyla kullanılır.
        </p>
        <h3>Çerezler (Cookies)</h3>
        <p>
          Kullanıcı tercihlerini hatırlamak ve anonim trafik analizi yapmak amacıyla çerezler kullanılmaktadır. Tarayıcı ayarlarınız üzerinden çerez kullanımını 
          her zaman kontrol edebilir veya engelleyebilirsiniz.
        </p>
      </section>

      <section id="kvkk" className="mt-12">
        <h2 className="text-sky-400">5. KVKK Aydınlatma Metni</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, FinanceScout platformunu kullanımınız sırasında oluşan veriler veri sorumlusu sıfatıyla 
          ekibimiz tarafından işlenebilmektedir.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4 text-white/80">
          <li><strong>Veri Sorumlusu:</strong> FinanceScout Geliştirici Ekibi.</li>
          <li><strong>İşleme Amacı:</strong> Hizmet kalitesinin artırılması, teknik hataların teşhisi ve yasal yükümlülüklerin yerine getirilmesi.</li>
          <li><strong>Veri Aktarımı:</strong> Verileriniz yasal zorunluluklar haricinde üçüncü şahıs veya kurumlarla paylaşılmaz.</li>
          <li><strong>Haklarınız:</strong> KVKK'nın 11. maddesi kapsamında, verilerinizin silinmesini, düzeltilmesini veya işlenip işlenmediğini öğrenme hakkına sahipsiniz.</li>
        </ul>
      </section>

      <section id="fikri-mulkiyet" className="mt-12">
        <h2 className="text-sky-400">6. Fikri Mülkiyet Hakları</h2>
        <p>
          FinanceScout markası, logosu, özgün modelleme tasarımları ve arayüz kodları FinanceScout ekibine aittir. Yazılı izin alınmaksızın bu içeriklerin 
          ticari amaçlarla kopyalanması, dağıtılması veya üzerinde tersine mühendislik yapılması yasaktır.
        </p>
      </section>

      <section className="mt-16 border-t border-white/5 pt-8">
        <p className="text-sm italic text-white/40">
          Bu yasal metinler en son 19 Mayıs 2026 tarihinde güncellenmiştir. Platformu kullanmaya devam ederek bu koşulları kabul etmiş sayılırsınız.
        </p>
      </section>
    </SimpleArticle>
  );
}
