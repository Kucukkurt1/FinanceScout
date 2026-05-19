"use client";

import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { postFeedback } from "@/lib/api";
import { readJson, removeKey, STORAGE_KEYS, writeJson } from "@/lib/storage";
import { cn } from "@/lib/utils";

const STAR_HINTS: Record<number, string> = {
  1: "Yetersiz — beklentileri karşılamadı",
  2: "Zayıf — temel ihtiyaçlar eksik",
  3: "Orta — iş görüyor, geliştirilebilir",
  4: "İyi — genel deneyimden memnunum",
  5: "Mükemmel — platformu öneririm",
};

type RatingCounts = Record<string, number>;

function emptyCounts(): RatingCounts {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
}

function computeAverage(counts: RatingCounts): { average: number | null; total: number } {
  let sum = 0;
  let total = 0;
  for (let n = 1; n <= 5; n++) {
    const c = counts[String(n)] ?? 0;
    sum += n * c;
    total += c;
  }
  if (total === 0) return { average: null, total: 0 };
  return { average: sum / total, total };
}

export function ServicesRating() {
  const [counts, setCounts] = useState<RatingCounts>(emptyCounts);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load from storage after mount
  useEffect(() => {
    setCounts(readJson(STORAGE_KEYS.servicesRatingCounts, emptyCounts()));
    setMyRating(readJson<number | null>(STORAGE_KEYS.servicesUserRating, null));
  }, []);

  const { average, total } = useMemo(() => computeAverage(counts), [counts]);
  const displayStars = hovered ?? myRating ?? 0;

  function persist(nextCounts: RatingCounts, nextMine: number | null) {
    writeJson(STORAGE_KEYS.servicesRatingCounts, nextCounts);
    if (nextMine != null) writeJson(STORAGE_KEYS.servicesUserRating, nextMine);
    else removeKey(STORAGE_KEYS.servicesUserRating);
  }

  async function submitRating(stars: number | null) {
    setSubmitting(true);
    setStatus(null);
    try {
      if (stars != null) {
        await postFeedback({
          message: "Hizmetler sayfası kullanıcı puanı",
          rating: stars,
          endpoint: "services",
        });
        setStatus("Teşekkürler — puanınız kaydedildi.");
      } else {
        setStatus("Puanınız geri alındı.");
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Sunucuya gönderilemedi; puan yine de yerelde saklandı.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleStar(stars: number) {
    const next = { ...emptyCounts(), ...counts };
    let nextMine: number | null = myRating;

    if (myRating === stars) {
      next[String(stars)] = Math.max(0, (next[String(stars)] ?? 1) - 1);
      nextMine = null;
      setCounts(next);
      setMyRating(null);
      persist(next, null);
      void submitRating(null);
      return;
    }

    if (myRating != null) {
      next[String(myRating)] = Math.max(0, (next[String(myRating)] ?? 1) - 1);
    }
    next[String(stars)] = (next[String(stars)] ?? 0) + 1;
    nextMine = stars;

    setCounts(next);
    setMyRating(nextMine);
    persist(next, nextMine);
    void submitRating(stars);
  }

  return (
    <div
      id="puanlama"
      className="mx-auto mt-14 max-w-xl scroll-mt-28 border-t border-white/10 pt-10"
      aria-labelledby="services-rating-title"
    >
      <h3 id="services-rating-title" className="text-lg font-semibold text-white md:text-xl">
        Hizmetlerimizi değerlendirin
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">
        Deneyiminizi 1–5 yıldız ile paylaşın. Aynı yıldıza tekrar tıklayarak puanınızı geri alabilirsiniz.
      </p>

      <div className="mt-6 flex flex-col items-center gap-4">
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHovered(null)}
          role="group"
          aria-label="Yıldız puanı"
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= displayStars;
            return (
              <button
                key={n}
                type="button"
                disabled={submitting}
                aria-label={`${n} yıldız`}
                aria-pressed={myRating === n}
                onMouseEnter={() => setHovered(n)}
                onFocus={() => setHovered(n)}
                onBlur={() => setHovered((h) => (h === n ? null : h))}
                onClick={() => toggleStar(n)}
                className={cn(
                  "rounded-lg p-1.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:opacity-50",
                  filled ? "text-amber-400" : "text-white/25 hover:text-white/45",
                )}
              >
                <Star className={cn("size-8 md:size-9", filled && "fill-current")} aria-hidden />
              </button>
            );
          })}
        </div>

        <p className="min-h-[20px] text-center text-sm text-sky-200/90" aria-live="polite">
          {hovered != null
            ? STAR_HINTS[hovered]
            : myRating != null
              ? `${myRating} yıldız verdiniz · tekrar tıklayın = geri al`
              : average != null
                ? `Ortalama ${average.toFixed(1)} · ${total} değerlendirme (bu tarayıcıda)`
                : "Henüz puan yok — ilk siz değerlendirin"}
        </p>

        {status ? <p className="text-center text-xs text-white/50">{status}</p> : null}
      </div>
    </div>
  );
}
