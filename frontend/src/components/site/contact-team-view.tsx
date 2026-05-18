import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

import { cn } from "@/lib/utils";

const GITHUB_REPO_URL = "https://github.com/ahmetbtopcu/FinanceScout";

/** İletişim sayfası — menüden biraz daha az sol boşluk */
const CONTACT_INSET =
  "pl-[4.75rem] pr-5 sm:pl-36 sm:pr-7 md:pl-44 md:pr-9 lg:pl-48 lg:pr-11";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  linkedinUrl?: string;
  photoSrc?: string;
  responsibilities: string[];
};

const TEAM: TeamMember[] = [
  {
    id: "mehmet",
    name: "Mehmet Emin Küçükkurt",
    role: "Kurucu Ortak & Yazılım Geliştirici",
    email: "kucukkurtmm@gmail.com",
    responsibilities: [
      "Platform mimarisi ve API altyapısı",
      "Analiz merkezi arayüzü ve dağıtım",
      "Teknik destek ve hata giderme",
    ],
  },
  {
    id: "ahmet",
    name: "Ahmet Topcu",
    role: "Veri Bilimcisi",
    email: "ahmetb.topcu@gmail.com",
    linkedinUrl: "https://www.linkedin.com/in/ahmet-bayram-topcu-4b0501333/",
    photoSrc: "/team/ahmet.png",
    responsibilities: [
      "Prophet / LSTM tahmin pipeline",
      "Geriye dönük test ve metrikler",
      "Veri kalitesi ve model iyileştirme",
    ],
  },
  {
    id: "ataman",
    name: "Ataman Gazozcu",
    role: "Finansal Analist",
    email: "atamangazozcu@gmail.com",
    responsibilities: [
      "Piyasa içeriği ve metodoloji metinleri",
      "Varlık sınıfları ve kullanıcı rehberleri",
      "İş birliği ve analitik geri bildirim",
    ],
  },
];

const FOOTER_INTRO =
  "FinanceScout ile ilgili sorularınız, teknik destek talepleriniz veya iş birliği önerileriniz için bizimle iletişime geçin.";

const FOOTER_NOTE =
  "* Gönderilen tüm e-postalar 24-48 saat içerisinde değerlendirilmeye alınmaktadır.";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MemberPhoto({ member }: { member: TeamMember }) {
  if (member.photoSrc) {
    return (
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
        <Image
          src={member.photoSrc}
          alt={member.name}
          fill
          className="object-cover object-top"
          sizes="200px"
          priority={member.id === "mehmet"}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex aspect-[3/4] w-full max-w-[200px] items-center justify-center rounded-xl ring-1 ring-white/10",
        "bg-gradient-to-br from-sky-500/25 via-white/5 to-violet-600/20",
      )}
      aria-hidden
    >
      <span className="font-heading text-3xl font-semibold tracking-tight text-white/90 md:text-4xl">
        {initials(member.name)}
      </span>
    </div>
  );
}

function MemberLinkedIn({ member }: { member: TeamMember }) {
  if (member.linkedinUrl) {
    return (
      <Link
        href={member.linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm font-medium text-sky-300/90 transition-colors hover:text-sky-200"
      >
        LinkedIn
      </Link>
    );
  }

  return (
    <p className="mt-2 text-[11px] font-normal text-white/35">link ekleyin</p>
  );
}

function TeamColumn({ member }: { member: TeamMember }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/12 bg-white/[0.06] p-5 shadow-lg backdrop-blur-sm md:p-6">
      <MemberPhoto member={member} />

      <div className="mt-5 flex flex-1 flex-col">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-white md:text-[1.35rem]">
          {member.name}
        </h2>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200/90">{member.role}</p>

        <Link
          href={`mailto:${member.email}`}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-sky-300"
        >
          <Mail className="size-3.5 shrink-0 text-sky-400" />
          {member.email}
        </Link>

        <MemberLinkedIn member={member} />

        <div className="mt-6 flex-1">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Yaptığı işler</h3>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/70">
            {member.responsibilities.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-sky-400/80" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function ContactTeamView() {
  return (
    <div className="overflow-hidden pb-24 text-white">
      <header className={cn("mx-auto max-w-6xl pb-8 pt-8 md:pb-12 md:pt-10", CONTACT_INSET)}>
        <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-sky-100/90">Ekibimiz</p>
        <h1 className="font-heading mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-5xl">
          İletişim
        </h1>
      </header>

      <div
        className={cn(
          "mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-7",
          CONTACT_INSET,
        )}
      >
        {TEAM.map((member) => (
          <TeamColumn key={member.id} member={member} />
        ))}
      </div>

      <section className={cn("mx-auto mt-8 max-w-6xl md:mt-10", CONTACT_INSET)}>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 md:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">Kaynak kod</p>
          <Link
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-white/85 transition-colors hover:text-sky-300"
          >
            GitHub — {GITHUB_REPO_URL.replace("https://github.com/", "")}
          </Link>
        </div>
      </section>

      <footer
        className={cn(
          "mx-auto mt-12 flex max-w-6xl flex-col gap-4 border-t border-white/10 pt-8 md:mt-14",
          CONTACT_INSET,
        )}
      >
        <p className="max-w-2xl text-base font-medium leading-relaxed text-white/75 md:text-lg md:leading-8">
          {FOOTER_INTRO}
        </p>
        <p className="max-w-2xl text-base font-medium leading-relaxed text-white/75 md:text-lg md:leading-8">
          {FOOTER_NOTE}
        </p>
      </footer>
    </div>
  );
}
