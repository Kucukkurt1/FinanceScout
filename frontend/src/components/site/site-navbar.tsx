"use client";

import { Compass, Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/site/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    title: "Analiz",
    icon: Compass,
    links: [
      { href: "/home", label: "Ana sayfa" },
      { href: "/analiz", label: "Analiz merkezi" },
    ],
  },
  {
    title: "Kurumsal",
    icon: Layers,
    links: [
      { href: "/hizmetler", label: "Hizmetler" },
      { href: "/hakkimizda", label: "Hakkımızda" },
      { href: "/yasal", label: "Yasal Bilgiler" },
      { href: "/bize-ulasin", label: "Bize Ulaşın" },
    ],
  },
] as const;

export function SiteNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    startTransition(() => {
      setMenuOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = shellRef.current;
      const btn = buttonRef.current;
      if (el && !el.contains(e.target as Node) && btn && !btn.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[130] flex items-center justify-between px-6 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <button
            ref={buttonRef}
            type="button"
            className="group flex items-center gap-3 outline-none"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <LogoMark className="size-11 rounded-xl shadow-lg transition-transform group-hover:scale-105 sm:size-12" />
            <div className="flex flex-col items-start leading-tight">
              <span
                className={cn(
                  "font-sans text-lg font-bold tracking-tight transition-colors duration-300",
                  menuOpen ? "text-primary" : "text-white",
                )}
              >
                FinanceScout
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors duration-300",
                  menuOpen ? "text-muted-foreground" : "text-white/70",
                )}
              >
                Menüyü {menuOpen ? "Kapat" : "Aç"}
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/analiz" className={cn(buttonVariants({ variant: "brand", size: "sm" }), "hidden px-6 sm:flex")}>
            Hızlı Analiz
          </Link>
        </div>
      </header>

      <div
        ref={shellRef}
        className={cn(
          "bg-background/95 border-border fixed inset-y-0 left-0 z-[120] w-72 border-r shadow-2xl backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:w-80",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col pt-24">
          <nav className="flex-1 overflow-y-auto px-4 pb-10">
            {NAV_GROUPS.map((group, groupIdx) => (
              <div key={group.title} className={cn(groupIdx > 0 ? "mt-8" : "")}>
                <div className="mb-4 px-3">
                  <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">
                    {group.title}
                  </span>
                </div>
                <ul className="space-y-1">
                  {group.links.map((link) => {
                    const active =
                      pathname === link.href ||
                      (link.href !== "/home" && pathname.startsWith(`${link.href}/`));
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-all",
                            active
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "text-foreground hover:bg-muted hover:pl-5",
                          )}
                          onClick={() => setMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-border/50 bg-muted/30 border-t p-6">
            <p className="text-muted-foreground text-xs leading-relaxed">
              © 2026 FinanceScout <br />
              Dijital Finans Analiz Platformu
            </p>
          </div>
        </div>
      </div>

      {menuOpen && <div className="fixed inset-0 z-[110] bg-transparent transition-opacity duration-500" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
