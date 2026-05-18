import { SiteAssistant } from "@/components/site/site-assistant";
import { SiteFooter } from "@/components/site/site-footer";
import { KeyboardShortcutsProvider } from "@/components/site/keyboard-shortcuts-provider";
import { PwaRegister } from "@/components/site/pwa-register";
import { SiteNavbar } from "@/components/site/site-navbar";
import { I18nProvider } from "@/lib/i18n";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <KeyboardShortcutsProvider>
        <PwaRegister />
        <div className="flex min-h-full flex-col">
          <SiteNavbar />
          <main className="site-main-gradient flex-1 pt-[5.75rem] md:pt-[6.25rem]">{children}</main>
          <SiteFooter />
          <SiteAssistant />
        </div>
      </KeyboardShortcutsProvider>
    </I18nProvider>
  );
}
