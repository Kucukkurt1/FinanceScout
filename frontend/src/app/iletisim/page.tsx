import { ContactTeamView } from "@/components/site/contact-team-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim · FinanceScout",
  description:
    "FinanceScout ekibiyle iletişime geçin — teknik destek, iş birliği ve platform geri bildirimi.",
};

export default function IletisimPage() {
  return <ContactTeamView />;
}
