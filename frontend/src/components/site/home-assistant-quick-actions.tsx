"use client";

import { ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";

const QUICK_QUESTIONS = [
  "Dolar 1 hafta sonra kaç TL olur?",
  "Bitcoin'in genel durumu nedir?",
  "THY hisseleri artışta mı?",
  "Altının güncel fiyatı nedir?",
] as const;

function askAssistant(question: string) {
  window.dispatchEvent(new CustomEvent("fs-ask-assistant", { detail: { question } }));
}

export function HomeAssistantQuickActions() {
  return (
    <div className="relative z-10 h-full">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-500/15 shadow-[0_0_24px_-6px_rgba(56,189,248,0.5)]">
            <Sparkles className="size-4 text-sky-300" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">AI Asistan</h3>
            <p className="text-[11px] font-medium text-white/40">Tek tıkla soru sorun</p>
          </div>
        </div>
        <MessageCircle className="size-4 shrink-0 text-white/20" aria-hidden />
      </div>

      <div className="space-y-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => askAssistant(q)}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 text-left transition-all hover:border-sky-500/30 hover:bg-sky-500/[0.08]"
          >
            <span className="text-[13px] font-medium leading-snug text-white/65 group-hover:text-white">
              {q}
            </span>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/30 transition-colors group-hover:bg-sky-500/20 group-hover:text-sky-300">
              <ArrowUpRight className="size-3.5" aria-hidden />
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => askAssistant("Genel piyasa analizi yap.")}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500/20 to-sky-600/10 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200 ring-1 ring-sky-400/20 transition-all hover:from-sky-500/30 hover:ring-sky-400/40"
      >
        Sohbeti aç
        <ArrowUpRight className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
