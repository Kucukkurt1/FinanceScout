"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  fomc: "FOMC",
  ecb: "ECB",
  opec: "OPEC+",
  earnings: "Bilanço",
};

function DirectionBadge({ impact }: { impact: EventImpactResponse }) {
  const Icon = impact.direction === "up" ? ArrowUp : impact.direction === "down" ? ArrowDown : Minus;
  const cls =
    impact.direction === "up"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : impact.direction === "down"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
        : "border-white/15 bg-white/5 text-white/60";

  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", cls)}>
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

  useEffect(() => {
    fetchEvents("2025-01-01", "2026-12-31")
      .then((rows) => {
        setEvents(rows);
        if (rows[0]) {
          setSelected(rows[0]);
          setSymbol(rows[0].symbols[0] ?? null);
        }
      })
      .catch((e) => setListError(e instanceof Error ? e.message : String(e)));
  }, []);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter((e) => e.date >= today);
  }, [events]);

  const past = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...events.filter((e) => e.date < today)].reverse();
  }, [events]);

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

  if (listError) return <p className="text-rose-300 text-sm">{listError}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
      <div className="space-y-6 min-w-0">
        <DisclaimerBanner />
        <p className="text-sm text-white/55">
          Bir olay seçin ve sembol belirleyin; benzer geçmiş olaylardaki fiyat tepkisi ile kısa ufuk model tahmini
          birleştirilir.
        </p>

        {upcoming.length > 0 ? (
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Yaklaşan</h3>
            <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
              {upcoming.map((ev) => (
                <EventRow key={`${ev.date}-${ev.title}`} ev={ev} active={selected?.date === ev.date && selected?.title === ev.title} onPick={pickEvent} />
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Geçmiş</h3>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {past.map((ev) => (
              <EventRow key={`${ev.date}-${ev.title}`} ev={ev} active={selected?.date === ev.date && selected?.title === ev.title} onPick={pickEvent} />
            ))}
          </ul>
        </section>

        {selected ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <SymbolPicker
              label="İncelenecek sembol"
              value={symbol}
              onSelect={(r) => setSymbol(r.symbol)}
            />
            {selected.symbols.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.symbols.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setSymbol(sym)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-colors",
                      symbol === sym
                        ? "border-primary/50 bg-primary/20 text-white"
                        : "border-white/10 text-white/50 hover:bg-white/5",
                    )}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            ) : null}
            <Button variant="brand" className="mt-4 w-full sm:w-auto" onClick={analyze} disabled={loading || !symbol}>
              {loading ? "Hesaplanıyor…" : "Etkiyi analiz et"}
            </Button>
          </div>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-white/12 bg-slate-950/60 p-5 shadow-xl backdrop-blur-md">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200/80">
            <TrendingUp className="size-3.5" />
            Olay etkisi tahmini
          </p>

          {!selected ? (
            <p className="mt-4 text-sm text-white/45">Soldan bir olay seçin.</p>
          ) : !impact && !impactError ? (
            <div className="mt-4 space-y-2 text-sm text-white/50">
              <p className="font-medium text-white/80">{selected.title}</p>
              <p>{selected.date}</p>
              <p className="text-xs leading-relaxed">
                Sembol seçip «Etkiyi analiz et» ile geçmiş benzer olaylara ve modele dayalı yön tahmini alın.
              </p>
            </div>
          ) : impactError ? (
            <p className="mt-4 text-sm text-rose-300">{impactError}</p>
          ) : impact ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-mono text-xs text-white/40">{impact.symbol}</p>
                <p className="mt-1 text-sm font-semibold text-white">{selected.title}</p>
              </div>
              <DirectionBadge impact={impact} />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="text-white/50">Geçmiş örnek</dt>
                  <dd className="font-medium text-white">{impact.historical_samples}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="text-white/50">Benzer olay ort.</dt>
                  <dd className="font-medium tabular-nums text-white">
                    {impact.avg_event_return_pct != null
                      ? `${impact.avg_event_return_pct >= 0 ? "+" : ""}${impact.avg_event_return_pct.toFixed(1)}%`
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="text-white/50">Model (kısa ufuk)</dt>
                  <dd className="font-medium tabular-nums text-white">
                    {impact.model_forecast_return_pct != null
                      ? `${impact.model_forecast_return_pct >= 0 ? "+" : ""}${impact.model_forecast_return_pct.toFixed(1)}%`
                      : "—"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs leading-relaxed text-white/55">{impact.summary}</p>
              {impact.similar_events.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Kullanılan benzer olaylar</p>
                  <ul className="mt-2 space-y-1 text-[11px] text-white/45">
                    {impact.similar_events.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="text-[10px] leading-relaxed text-white/30">
                Bilgilendirme amaçlıdır; yatırım tavsiyesi değildir. Geçmiş tepki geleceği garanti etmez.
              </p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function EventRow({
  ev,
  active,
  onPick,
}: {
  ev: MarketEvent;
  active: boolean;
  onPick: (ev: MarketEvent) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(ev)}
        className={cn(
          "w-full rounded-xl border px-4 py-3 text-left transition-colors",
          active ? "border-primary/40 bg-primary/15" : "border-white/10 bg-white/5 hover:bg-white/10",
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/90">
          {CATEGORY_TR[ev.category] ?? ev.category}
        </p>
        <p className="mt-1 text-sm font-semibold text-white">{ev.title}</p>
        <p className="text-xs text-white/45">{ev.date}</p>
      </button>
    </li>
  );
}
