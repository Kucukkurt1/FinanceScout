"use client";

import { MousePointer2, Sparkles } from "lucide-react";

const QUICK_QUESTIONS = [
  "Piyasa bugün nasıl?",
  "Bitcoin tahmini nedir?",
  "En çok yükselen hisse hangisi?",
  "Dolar ne olur?",
] as const;

function askAssistant(question: string) {
  window.dispatchEvent(new CustomEvent("fs-ask-assistant", { detail: { question } }));
}

export function HomeAssistantQuickActions() {
  return (
    <div className="hidden lg:block p-6 rounded-[32px] border border-sky-500/20 bg-sky-500/5 backdrop-blur-sm relative group">
      <div className="absolute -top-3 -right-3 size-12 bg-sky-500/20 blur-xl rounded-full group-hover:size-16 transition-all" />
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-4 text-sky-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-sky-300">AI Asistan</span>
      </div>
      <h4 className="text-sm font-bold text-white mb-4">Hızlı Sorular</h4>
      <div className="space-y-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => askAssistant(q)}
            className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] font-medium text-white/70 hover:bg-sky-500/10 hover:border-sky-500/20 hover:text-white transition-all flex items-center justify-between group/btn"
          >
            {q}
            <MousePointer2 className="size-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
      <p className="mt-4 text-[10px] text-white/30 italic">Asistan hemen yanıtlasın.</p>
    </div>
  );
}
