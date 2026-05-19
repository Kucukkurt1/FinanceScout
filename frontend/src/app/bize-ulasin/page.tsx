import { SimpleArticle } from "@/components/site/simple-article";
import { ServicesRating } from "@/components/site/services-rating";
import { FeedbackPanel } from "@/components/tools/feedback-panel";
import { ContactTeamView } from "@/components/site/contact-team-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bize Ulaşın",
};

export default function BizeUlasinPage() {
  return (
    <div className="pb-20">
      <SimpleArticle
        title="Bize Ulaşın"
        description="Sorularınız, önerileriniz veya teknik destek ihtiyaçlarınız için yanınızdayız."
      >
        <section className="space-y-4">
          <h2 className="font-heading text-heading text-lg font-semibold">Sıkça Sorulan Sorular</h2>
          
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="font-heading text-white font-medium">Analiz neden yüklenmiyor?</h3>
              <p className="text-white/70">
                Yerel geliştirmede arka ucun çalıştığından ve tarayıcının engellemediğinden emin olun. «NetworkError» genelde
                API adresinin yanlış olması veya sunucunun kapalı olmasından kaynaklanır.
              </p>
            </section>
            
            <section className="space-y-2">
              <h3 className="font-heading text-white font-medium">Sembol nereden geliyor?</h3>
              <p className="text-white/70">
                Liste Yahoo Finance kodlarıyla uyumludur; liste dışı için gelişmiş seçenekten kod girebilirsiniz.
              </p>
            </section>
            
            <section className="space-y-2">
              <h3 className="font-heading text-white font-medium">Bu sonuçlar tavsiye mi?</h3>
              <p className="text-white/70">Hayır. Grafik ve metrikler yalnızca bilgilendirme ve öğrenme içindir.</p>
            </section>
          </div>
        </section>

        <section id="geri-bildirim" className="scroll-mt-28 not-prose !mt-14">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-white md:text-3xl">Geri Bildirim</h2>
          <p className="mt-3 max-w-4xl text-[15px] leading-relaxed text-white/65">
            Öneri, hata raporu veya özellik isteğinizi paylaşın; öncelik vermek istediğiniz geliştirmeyi seçin.
          </p>
          <div className="mt-6">
            <FeedbackPanel variant="about" />
          </div>
        </section>
      </SimpleArticle>
      
      <section className="mx-auto max-w-6xl px-6 mt-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h3 className="mb-6 text-xl font-bold text-white">Deneyiminizi Puanlayın</h3>
          <ServicesRating />
        </div>
      </section>

      <div className="mt-20 border-t border-white/5 pt-20">
        <ContactTeamView />
      </div>
    </div>
  );
}
