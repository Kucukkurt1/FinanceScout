import { cn } from "@/lib/utils";

/** Sabit sol menü (logo + FinanceScout) ile başlık çakışmasını önler — kaydırmada da geçerli */
export const SITE_NAV_CLEARANCE =
  "pl-[5.25rem] pr-6 sm:pl-[13rem] sm:pr-8 md:pl-56 md:pr-10 lg:pl-60 lg:pr-14";

export function PageHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("mx-auto w-full max-w-7xl pt-10 pb-8 md:pt-14 md:pb-10", SITE_NAV_CLEARANCE, className)}>
      <h1 className="font-heading text-white text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
      {description ? (
        <p className="text-sky-100/70 mt-5 max-w-4xl text-lg font-medium leading-relaxed">{description}</p>
      ) : null}
    </header>
  );
}
