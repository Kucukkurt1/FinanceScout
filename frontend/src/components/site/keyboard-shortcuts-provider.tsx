"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: "?", desc: "Kısayol listesini aç" },
  { keys: "Esc", desc: "Modal / menüyü kapat" },
  { href: "/analiz", desc: "Analiz merkezi" },
  { href: "/home", desc: "Uygulama ana sayfası" },
  { href: "/hizmetler", desc: "Hizmetler" },
];

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-white/10 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle>Klavye kısayolları</DialogTitle>
          </DialogHeader>
          <ul className="space-y-3 text-sm">
            {SHORTCUTS.map((s) => (
              <li key={s.keys ?? s.href} className="flex items-center justify-between gap-4">
                {s.href ? (
                  <Link href={s.href} className="text-sky-300 hover:underline" onClick={() => setOpen(false)}>
                    {s.desc}
                  </Link>
                ) : (
                  <span>{s.desc}</span>
                )}
                {s.keys ? (
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs">{s.keys}</kbd>
                ) : null}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
