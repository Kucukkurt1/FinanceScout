import { Suspense } from "react";
import type { Metadata } from "next";

import { Dashboard } from "@/components/dashboard";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Analiz merkezi",
};

export default function AnalizPage() {
  return (
    <>
      <PageHeader
        title="Analiz merkezi"
        description="Varlık seçin veya sembol girin; geçmiş kapanışlara dayalı özet tahmin ve geçmişe dönük test grafiklerini tek ekranda görün. Tüm çıktılar bilgilendirme amaçlıdır."
      />
      <Suspense fallback={<p className="px-6 text-white/50">Yükleniyor…</p>}>
        <Dashboard />
      </Suspense>
    </>
  );
}
