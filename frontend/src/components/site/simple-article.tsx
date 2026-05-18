import type { ReactNode } from "react";

import { PageHeader, SITE_NAV_CLEARANCE } from "@/components/site/page-header";
import { cn } from "@/lib/utils";

export function SimpleArticle({
  title,
  description,
  children,
  className,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const shell = wide ? "max-w-6xl" : "max-w-3xl";

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        className={cn("text-white [&_h1]:text-white [&_p]:text-slate-300", shell)}
      />
      <div className={cn("mx-auto w-full pb-24", shell, SITE_NAV_CLEARANCE, className)}>
        <article className="text-white space-y-6 pt-2 text-[15px] leading-relaxed [&_h2]:font-heading [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:first:mt-0 [&_ul]:mt-2 [&_ul]:space-y-2 [&_section]:space-y-3">
          {children}
        </article>
      </div>
    </>
  );
}
