"use client";

import { Loader2, MessageCircle, Send, Sparkles, X, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { ForecastApiResponse, SeriesPoint } from "@/lib/api";
import { PriceChart, type ChartRow } from "@/components/price-chart";

type Role = "user" | "assistant";

type Msg = { 
  role: Role; 
  content: string; 
  forecastData?: ForecastApiResponse | null;
};

function mapToChartRows(resp: ForecastApiResponse): ChartRow[] {
  const rows: ChartRow[] = [];
  // Geçmiş veriler (son 30 gün kafi chat içinde kalabalık yapmasın)
  const historyLimit = resp.history.slice(-30);
  historyLimit.forEach((p) => {
    rows.push({
      ds: p.ds,
      actual: p.y,
      fit: p.yhat,
    });
  });
  // Gelecek tahminleri
  resp.forecast.forEach((p) => {
    rows.push({
      ds: p.ds,
      future: p.yhat,
      lower: p.yhat_lower,
      upper: p.yhat_upper,
    });
  });
  return rows;
}

function formatChatMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  
  return (
    <div className="space-y-2">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) return <div key={lineIdx} className="h-2" />;

        let rest = line.trim();
        
        // Liste tespiti ve temizliği (Örn: "1. ", "* ", "- ")
        const isList = /^(\d+\.|\*|-)\s+/.test(rest);
        if (isList) {
          rest = rest.replace(/^(\d+\.|\*|-)\s+/, "");
        }

        // Kökten çözüm: Sondaki ":*" veya "*" gibi hatalı karakterleri temizle
        rest = rest.replace(/:\*$/, ":").replace(/\*$/, "");

        const content: ReactNode[] = [];
        let k = 0;
        
        // Gelişmiş Bold/Vurgu Yakalama
        while (rest.length > 0) {
          const match = rest.match(/(\*\*\*|\*\*|\*)([\s\S]+?)\1/);
          if (match) {
            const before = rest.slice(0, match.index);
            if (before) content.push(before);
            
            content.push(
              <strong key={`v-${k++}`} className="font-bold text-cyan-400">
                {match[2]}
              </strong>
            );
            rest = rest.slice((match.index || 0) + match[0].length);
          } else {
            content.push(rest);
            rest = "";
          }
        }

        return (
          <div key={lineIdx} className={cn("flex gap-2 text-[13px]", isList && "pl-3")}>
            {isList && <span className="text-cyan-400 mt-1.5 size-1 rounded-full bg-cyan-400 shrink-0" />}
            <span className="flex-1 leading-relaxed">{content}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SiteAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Merhaba, FinanceScout asistanıyım. Site, analiz veya genel sorularınızda yardımcı olabilirim. Yatırım tavsiyesi vermem.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    // Panel her güncellendiğinde veya açıldığında focus'u koru
    inputRef.current?.focus();
  }, [msgs, open, loading]);

  const send = useCallback(async (textOverride?: string) => {
    const t = (textOverride ?? input).trim();
    if (!t || loading) return;
    setInput("");
    setErr(null);
    
    // msgs state'ine erişmek için functional update kullanıyoruz, 
    // böylece 'send' her mesaj geldiğinde yeniden oluşturulmak zorunda kalmaz (isteğe bağlı optimizasyon).
    // Ancak mevcut yapıda 'msgs' bağımlılığı olduğu için onu koruyarak en basit şekilde ilerleyelim.
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next);
    setLoading(true);

    // Mesaj gönderilirken focus'u hemen tazele
    setTimeout(() => inputRef.current?.focus(), 0);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string; forecastData?: ForecastApiResponse | null; error?: string };
      if (!res.ok) {
        setErr(data.error || "Bir hata oluştu.");
        setMsgs((m) => m.slice(0, -1));
        return;
      }
      if (!data.reply) {
        setErr("Boş yanıt.");
        setMsgs((m) => m.slice(0, -1));
        return;
      }
      setMsgs([...next, { role: "assistant", content: data.reply, forecastData: data.forecastData }]);
    } catch {
      setErr("Bağlantı hatası.");
      setMsgs((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
      // Yanıt geldikten sonra focus'u tekrar tazele
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [input, loading, msgs]);

  // Harici tetikleme için event listener
  useEffect(() => {
    function handleExternalAsk(e: Event) {
      const customEv = e as CustomEvent<{ question: string }>;
      if (customEv.detail?.question) {
        setOpen(true);
        // Doğrudan gönderim tetikle
        void send(customEv.detail.question);
      }
    }
    window.addEventListener("fs-ask-assistant" as any, handleExternalAsk);
    return () => window.removeEventListener("fs-ask-assistant" as any, handleExternalAsk);
  }, [send]);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[150] flex flex-col items-end gap-3 md:bottom-8 md:right-8">
      <div
        className={cn(
          "pointer-events-auto flex max-h-[min(42rem,calc(100dvh-8rem))] w-[min(34rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-y-0 opacity-100 scale-100" : "pointer-events-none translate-y-4 opacity-0 scale-95",
        )}
        aria-hidden={!open}
      >
        {/* Chat Header */}
        <div className="relative flex items-center justify-between gap-3 border-b border-white/10 bg-primary/20 px-5 py-4 text-white shadow-sm backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sky-300 ring-1 ring-white/20">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold tracking-tight text-white">
                FinanceScout Asistan
              </p>
              <div className="flex items-center gap-1.5">
                 <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                 <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Çevrimiçi</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/15"
            aria-label="Paneli kapat"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div
          ref={listRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-transparent to-white/[0.02] px-5 py-5 custom-scrollbar"
        >
          {msgs.map((m, i) => (
            <div key={`${i}-${m.role}`} className="flex flex-col gap-2">
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl border px-4 py-3 text-[13px] leading-relaxed shadow-lg",
                  m.role === "user"
                    ? "ml-auto border-primary/40 bg-primary text-white shadow-primary/20"
                    : "mr-auto border-white/10 bg-white/5 text-white/90 backdrop-blur-md",
                )}
              >
                {formatChatMarkdown(m.content)}
              </div>
              
              {m.forecastData && (
                <div className="mr-auto w-full max-w-[95%] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-1 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {m.forecastData.symbol} AI Tahmini
                      </span>
                    </div>
                  </div>
                  <div className="w-full p-2">
                    <PriceChart data={mapToChartRows(m.forecastData)} className="min-h-[280px]" compact />
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading ? (
            <div className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-sky-300 italic animate-pulse">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Analiz ediliyor…
            </div>
          ) : null}
          {err ? (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-300">
              {err}
            </p>
          ) : null}
        </div>

        {/* Chat Input */}
        <form
          id="assistant-form"
          className="border-t border-white/10 bg-black/40 p-4 backdrop-blur-md"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Asistana sorun…"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none ring-offset-background placeholder:text-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={loading}
              maxLength={2000}
              aria-label="Mesaj"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-xl transition-all hover:bg-sky-50 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Gönder"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* Floating Toggle Button - Beyaz Arka Plan, Lacivert İkon */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "pointer-events-auto group inline-flex size-16 items-center justify-center rounded-2xl border border-white bg-white text-primary shadow-2xl ring-1 ring-black/5 transition-all duration-300 hover:scale-105 active:scale-95",
          open ? "bg-primary text-white border-primary shadow-primary/20" : "hover:bg-slate-50"
        )}
        aria-expanded={open}
        aria-label={open ? "Asistanı kapat" : "Asistanı aç"}
      >
        {open ? <X className="size-7 shrink-0" aria-hidden /> : <MessageCircle className="size-7 shrink-0" aria-hidden />}
      </button>
    </div>
  );
}
