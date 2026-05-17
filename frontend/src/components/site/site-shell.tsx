import { SiteAssistant } from "@/components/site/site-assistant";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNavbar } from "@/components/site/site-navbar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteNavbar />
      <main className="site-main-gradient flex-1 pt-[5.75rem] md:pt-[6.25rem]">{children}</main>
      <SiteFooter />
      <SiteAssistant />
    </div>
  );
}
