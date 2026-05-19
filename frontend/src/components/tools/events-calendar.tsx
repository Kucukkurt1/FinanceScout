"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Bot, CalendarDays, Clock, Minus, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SymbolPicker } from "@/components/tools/symbol-picker";
import { DisclaimerBanner } from "@/components/site/disclaimer-banner";
import {
  fetchEventImpact,
  fetchEvents,
  type EventImpactResponse,
  type MarketEvent,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORY_TR: Record<string, string> = {
  fomc: "FOMC · Fed Faizi",
  ecb: "ECB · Avrupa Merkez Bankası",
  opec: "OPEC+ · Petrol",
  earnings: "Bilanço · Şirket Sonuçları",
  cpi: "CPI · ABD Enflasyon",
  nfp: "NFP · ABD İstihdam",
};

const CATEGORY_COLOR: Record<string, string> = {
  fomc: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  ecb: "text-sky-300 bg-sky-500/10 border-sky-500/30",
  opec: "text-rose-300 bg-rose-500/10 border-rose-500/30",
  earnings: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  cpi: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30",
  nfp: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30",
};

function categoryClasses(category: string) {
  return CATEGORY_COLOR[category] ?? "text-white/70 bg-white/5 border-white/15";
}

function categoryLabel(category: string) {
  return CATEGORY_TR[category] ?? category.toUpperCase();
}

function DirectionBadge({ impact }: { impact: EventImpactResponse }) {
  const Icon = impact.direction === "up" ? ArrowUp : impact.direction === "down" ? ArrowDown : Minus;
  const cls =
    impact.direction === "up"
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
      : impact.direction === "down"
        ? "border-rose-500/30 bg-rose-500/15 text-rose-300"
        : "border-white/15 bg-white/5 text-white/60";

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2", cls)}>
      <Icon className="size-4 shrink-0" />
      <span className="text-sm font-bold">{impact.direction_label}</span>
    </div>
  );
}

export function EventsCalendar() {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [selected, setSelected] = useState<MarketEvent | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [impact, setImpact] = useState<EventImpactResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [impactError, setImpactError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear() - 1, today.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(today.getFullYear() + 1, 11, 31).toISOString().slice(0, 10);
    fetchEvents(from, to)
      .then((rows) => {
        setEvents(rows);
        const todayStr = new Date().toISOString().slice(0, 10);
        const nextUpcoming = rows.find((r) => r.date >= todayStr) ?? rows[0];
        if (nextUpcoming) {
          setSelected(nextUpcoming);
          setSymbol(nextUpcoming.symbols[0] ?? null);
        }
      })
      .catch((e) => setListError(e instanceof Error ? e.message : String(e)));
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredEvents = useMemo(() => {
    if (filter === "upcoming") return events.filter((e) => e.date >= todayStr);
    if (filter === "past") return [...events.filter((e) => e.date < todayStr)].reverse();
    return [...events].sort((a, b) => a.date.localeCompare(b.date));
  }, [events, filter, todayStr]);

  const upcomingCount = useMemo(() => events.filter((e) => e.date >= todayStr).length, [events, todayStr]);
  const pastCount = events.length - upcomingCount;

  function pickEvent(ev: MarketEvent) {
    setSelected(ev);
    setSymbol(ev.symbols[0] ?? symbol);
    setImpact(null);
    setImpactError(null);
  }

  async function analyze() {
    if (!selected || !symbol) return;
    setLoading(true);
    setImpactError(null);
    try {
      setImpact(
        await fetchEventImpact({
          symbol,
          event_date: selected.date,
          category: selected.category,
          event_title: selected.title,
        }),
      );
    } catch (e) {
      setImpact(null);
      setImpactError(e instanceof Error ? e.message : "Analiz yapılamadı");
    } finally {
      setLoading(false);
    }
  }

  if (listError)
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
        Olay listesi alınamadı: {listError}
      </div>
    );

  return (
    <div className="space-y-7">
      <DisclaimerBanner />

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="font-heading text-2xl font-bold text-white">Piyasa olayları takvimi</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
              FOMC, ECB, OPEC+ ve bilanço gibi piyasa hareketlerini tetikleyebilen olayları görün. Bir olay seçin ve
              hangi sembolün etkilenmesini düşündüğünüzü belirtin; sistem benzer geçmiş olaylardaki tepkiyi modelin
              kısa ufuk tahminiyle birleştirir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "upcoming", label: `Yaklaşan · ${upcomingCount}` },
              { id: "past", label: `Geçmiş · ${pastCount}` },
              { id: "all", label: "Tümü" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id as typeof filter)}
                className={cn(
                  "rounded-xl border px-4 py-2 text-xs font-bold transition-all",
                  filter === opt.id
                    ? "border-sky-400/40 bg-sky-400/15 text-sky-100"
                    : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/55">
              Bu kategoride olay yok.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {filteredEvents.map((ev) => {
                const active = selected?.date === ev.date && selected?.title === ev.title;
                const isUpcoming = ev.date >= todayStr;
                return (
                  <li key={`${ev.date}-${ev.title}`}>
                    <button
                      type="button"
                      onClick={() => pickEvent(ev)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                        active
                          ? "border-sky-400/40 bg-sky-500/10 shadow-lg shadow-sky-500/10"
                          : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                              categoryClasses(ev.category),
                            )}
                          >
                            {categoryLabel(ev.category)}
                          </span>
                          <p className="mt-2 truncate text-sm font-semibold text-white">{ev.title}</p>
                          <p className="mt-1 flex items-center gap-2 text-xs text-white/45">
                            <CalendarDays className="size-3" />
                            {new Date(`${ev.date}T00:00:00`).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                            {isUpcoming ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                <Clock className="size-3" />
                                Yaklaşan
                              </span>
                            ) : null}
                          </p>
                        </div>
                        {ev.symbols.length > 0 ? (
                          <div className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                            {ev.symbols.slice(0, 3).map((sym) => (
                              <span
                                key={sym}
                                className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[10px] text-white/55"
                              >
                                {sym}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/80">
                <TrendingUp className="size-3.5" />
                Olay etkisi tahmini
              </p>

              {!selected ? (
                <p className="mt-4 text-sm text-white/50">Soldan bir olay seçin.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                        categoryClasses(selected.category),
                      )}
                    >
                      {categoryLabel(selected.category)}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-white">{selected.title}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {new Date(`${selected.date}T00:00:00`).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                      İncelenecek varlık
                    </Label>
                    <SymbolPicker value={symbol} onSelect={(r) => setSymbol(r.symbol)} placeholder="Sembol veya isim ara..." />
                    {selected.symbols.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selected.symbols.map((sym) => (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => setSymbol(sym)}
                            className={cn(
                              "rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-colors",
                              symbol === sym
                                ? "border-sky-400/50 bg-sky-400/15 text-white"
                                : "border-white/10 text-white/55 hover:bg-white/5",
                            )}
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <Button variant="brand" className="w-full" onClick={analyze} disabled={loading || !symbol}>
                    {loading ? "Hesaplanıyor…" : "Etkiyi analiz et"}
                  </Button>
                </div>
              )}
            </div>

            {impactError ? (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-200">
                {impactError}
              </div>
            ) : null}

            {impact ? (
              <div className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-indigo-500/5 p-5 shadow-xl shadow-sky-950/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-white/50">{impact.symbol}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{selected?.title ?? "—"}</p>
                  </div>
                  <DirectionBadge impact={impact} />
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
                    <dt className="text-white/55">Geçmiş benzer olay</dt>
                    <dd className="font-mono font-bold text-white">{impact.historical_samples}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
                    <dt className="text-white/55">Benzer olay ortalama getirisi</dt>
                    <dd className="font-mono font-bold tabular-nums text-white">
                      {impact.avg_event_return_pct != null
                        ? `${impact.avg_event_return_pct >= 0 ? "+" : ""}${impact.avg_event_return_pct.toFixed(2)}%`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
                    <dt className="text-white/55">Model · {impact.window_days}g ufku</dt>
                    <dd className="font-mono font-bold tabular-nums text-white">
                      {impact.model_forecast_return_pct != null
                        ? `${impact.model_forecast_return_pct >= 0 ? "+" : ""}${impact.model_forecast_return_pct.toFixed(2)}%`
                        : "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <Bot className="mt-0.5 size-4 shrink-0 text-sky-300" />
                  <p className="text-xs leading-relaxed text-white/80">{impact.summary}</p>
                </div>

                {impact.similar_events.length > 0 ? (
                  <details className="mt-4 text-xs text-white/50">
                    <summary className="cursor-pointer font-bold uppercase tracking-widest text-white/40">
                      Kullanılan benzer olaylar ({impact.similar_events.length})
                    </summary>
                    <ul className="mt-2 space-y-1 pl-3">
                      {impact.similar_events.map((t) => (
                        <li key={t} className="text-white/55">
                          · {t}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                <p className="mt-4 text-[10px] leading-relaxed text-white/35">
                  Bilgilendirme amaçlıdır; yatırım tavsiyesi değildir. Geçmiş tepki geleceği garanti etmez.
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
