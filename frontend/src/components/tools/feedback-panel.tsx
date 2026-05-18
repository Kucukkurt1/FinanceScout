"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postFeedback } from "@/lib/api";
import { readJson, removeKey, STORAGE_KEYS, writeJson } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const FEATURE_OPTIONS = [
  {
    label: "Sosyal sinyal",
    blurb: "Haber ve sosyal medya duyarlılığının tahmin pipeline’ına hafif ağırlıkla eklenmesi.",
  },
  {
    label: "PDF rapor",
    blurb: "Tahmin grafiği, metrikler ve olay notlarını tek PDF olarak indirme.",
  },
  {
    label: "Mobil uygulama",
    blurb: "PWA’nın ötesinde bildirim ve hızlı analiz için native veya mağaza uygulaması.",
  },
  {
    label: "Daha fazla sembol",
    blurb: "BIST, FX, kripto ve emtia listesinin genişletilmesi; özel sembol aramasının iyileştirilmesi.",
  },
] as const;

const FEATURES = FEATURE_OPTIONS.map((f) => f.label);

export function FeedbackPanel({ variant = "default" }: { variant?: "default" | "about" }) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [email, setEmail] = useState("");
  const [votes, setVotes] = useState<Record<string, number>>(() => readJson(STORAGE_KEYS.feedbackVotes, {}));
  const [myVote, setMyVote] = useState<string | null>(() => readJson(STORAGE_KEYS.userFeatureVote, null));
  const [status, setStatus] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  function persistVotes(next: Record<string, number>, voted: string | null) {
    writeJson(STORAGE_KEYS.feedbackVotes, next);
    if (voted) writeJson(STORAGE_KEYS.userFeatureVote, voted);
    else removeKey(STORAGE_KEYS.userFeatureVote);
  }

  function toggleVote(feature: string) {
    const next = { ...votes };
    let nextMy: string | null = myVote;

    if (myVote === feature) {
      next[feature] = Math.max(0, (next[feature] ?? 1) - 1);
      if (next[feature] === 0) delete next[feature];
      nextMy = null;
    } else {
      if (myVote) {
        next[myVote] = Math.max(0, (next[myVote] ?? 1) - 1);
        if (next[myVote] === 0) delete next[myVote];
      }
      next[feature] = (next[feature] ?? 0) + 1;
      nextMy = feature;
    }

    setVotes(next);
    setMyVote(nextMy);
    persistVotes(next, nextMy);
  }

  function vote(feature: string) {
    toggleVote(feature);
  }

  async function submit() {
    setStatus(null);
    try {
      await postFeedback({ message, rating, email: email || undefined });
      setStatus("Teşekkürler — geri bildiriminiz kaydedildi.");
      setMessage("");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Gönderilemedi");
    }
  }

  if (variant === "about") {
    const previewLabel = hovered ?? myVote;
    const previewOption = FEATURE_OPTIONS.find((f) => f.label === previewLabel);

    return (
      <div className="space-y-8">
        <p className="max-w-4xl text-[15px] leading-relaxed text-white/65">
          Özelliğin üzerine gelerek planı okuyun; tıklayarak oy verin. Aynı seçeneğe tekrar tıklayınca oyunuz geri alınır.
          Oylar tarayıcınızda saklanır.
        </p>

        <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
          {FEATURE_OPTIONS.map((f) => {
            const isMine = myVote === f.label;
            const isHover = hovered === f.label;
            return (
              <li key={f.label} className="min-w-0 flex-1 sm:min-w-[140px] sm:max-w-[200px]">
                <button
                  type="button"
                  onClick={() => toggleVote(f.label)}
                  onMouseEnter={() => setHovered(f.label)}
                  onMouseLeave={() => setHovered((h) => (h === f.label ? null : h))}
                  onFocus={() => setHovered(f.label)}
                  onBlur={() => setHovered((h) => (h === f.label ? null : h))}
                  className={cn(
                    "flex h-full w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition-all",
                    isMine
                      ? "border-primary/50 bg-primary/15 shadow-lg shadow-primary/10"
                      : isHover
                        ? "border-sky-400/40 bg-sky-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                  )}
                >
                  <span className="text-sm font-semibold text-white">{f.label}</span>
                  <span className="mt-2 text-[11px] text-white/40">
                    {isMine ? "Oy verildi · tekrar tıkla = geri al" : `Toplam oy: ${votes[f.label] ?? 0}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div
          className={cn(
            "min-h-[88px] max-w-4xl rounded-xl border px-5 py-4 transition-colors",
            previewOption
              ? "border-sky-500/25 bg-sky-500/10"
              : "border-dashed border-white/10 bg-white/[0.03]",
          )}
          aria-live="polite"
        >
          {previewOption ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-widest text-sky-200/80">
                {hovered && hovered !== myVote
                  ? "Önizleme"
                  : myVote === previewOption.label
                    ? "Oyunuz"
                    : "Planlanan kapsam"}
                {": "}
                {previewOption.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{previewOption.blurb}</p>
              {myVote === previewOption.label && !hovered ? (
                <p className="mt-2 text-[11px] text-white/45">
                  Bu özelliğe oy verdiniz. Geri almak için kartına tekrar tıklayın.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-white/40">
              Bir özelliğin üzerine gelin; açıklama burada görünür. Oy vermek zorunlu değil.
            </p>
          )}
        </div>

        <div className="max-w-2xl space-y-3 border-t border-white/10 pt-8">
          <p className="text-sm font-medium text-white/70">Serbest metin veya hata raporu</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Öneriniz veya hata raporu"
            className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta (opsiyonel)"
            className="border-white/10 bg-white/5 text-white"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/60">Puan:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={rating >= n ? "text-amber-400" : "text-white/20"}
              >
                ★
              </button>
            ))}
          </div>
          <Button variant="brand" onClick={submit}>
            Gönder
          </Button>
          {status ? <p className="text-sm text-sky-200">{status}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-bold text-white">Özellik oylaması (yerel)</p>
        <ul className="space-y-2">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2"
            >
              <span className="text-white">{f}</span>
              <Button size="sm" variant="ghost" onClick={() => vote(f)}>
                Oy ver ({votes[f] ?? 0})
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Öneriniz veya hata raporu"
          className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white"
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta (opsiyonel)"
          className="border-white/10 bg-white/5 text-white"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">Puan:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={rating >= n ? "text-amber-400" : "text-white/20"}
            >
              ★
            </button>
          ))}
        </div>
        <Button variant="brand" onClick={submit}>
          Gönder
        </Button>
        {status ? <p className="text-sm text-sky-200">{status}</p> : null}
      </div>
    </div>
  );
}
