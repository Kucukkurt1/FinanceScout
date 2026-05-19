import Link from "next/link";

const FOOTER_COL = [
  {
    title: "Kurumsal",
    links: [
      { href: "/hakkimizda", label: "Hakkımızda" },
      { href: "/hizmetler", label: "Hizmetler" },
    ],
  },
  {
    title: "Güvenlik ve yasal",
    links: [
      { href: "/yasal", label: "Yasal Bilgiler" },
      { href: "/yasal#gizlilik", label: "Gizlilik Bildirimi" },
      { href: "/yasal#kvkk", label: "KVKK Aydınlatma" },
    ],
  },
  {
    title: "Araçlar",
    links: [
      { href: "/analiz", label: "Analiz merkezi" },
      { href: "/bize-ulasin", label: "Bize Ulaşın" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4 md:gap-12">
        <div className="md:col-span-1">
          <p className="font-heading text-xl font-bold tracking-tight text-primary">FinanceScout</p>
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted-foreground">
            Veriye dayalı özetler sunan dijital bir analiz deneyimi. Şeffaf süreçler ve güven odaklı iletişim ile yanınızdayız.
          </p>
        </div>
        {FOOTER_COL.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{col.title}</p>
            <ul className="mt-5 flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-[13px] leading-relaxed text-muted-foreground md:text-left">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p>
                FinanceScout bir öğrenme ve demo platformudur; burada sunulan tahmin ve metrikler{" "}
                <strong className="font-semibold text-foreground">yatırım tavsiyesi değildir</strong>. 
                Gerçek yatırım kararlarınız için yetkili kurumlara başvurun.
              </p>
            </div>
            <p className="shrink-0 font-medium">© {new Date().getFullYear()} FinanceScout.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
