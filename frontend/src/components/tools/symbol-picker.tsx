"use client";

import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { fetchSymbols } from "@/lib/api";
import { getAllInstruments, inferInstrumentFromSymbol, type InstrumentOption } from "@/lib/instruments";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  value: string | null;
  onSelect: (row: InstrumentOption) => void;
  placeholder?: string;
  /** Seçili varlığın görünen adı (arama kutusunda gösterilir) */
  selectedLabel?: string | null;
  /** Seçili varlığın sembol satırını (örn. EURTRY=X) arama kutusunun üstünde gösterme */
  hideSelectedPreview?: boolean;
};

export function SymbolPicker({
  label,
  value,
  onSelect,
  placeholder = "Ara: B → BIST, BTC…",
  selectedLabel,
  hideSelectedPreview = false,
}: Props) {
  const [q, setQ] = useState("");
  const [remoteSymbols, setRemoteSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const all = useMemo(() => getAllInstruments(), []);

  useEffect(() => {
    if (selectedLabel) {
      setQ(selectedLabel);
      return;
    }
    if (value) {
      const hit = all.find((r) => r.symbol === value);
      if (hit) setQ(hit.label);
      return;
    }
    setQ("");
  }, [value, selectedLabel, all]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetchSymbols(q)
        .then((symbols) => {
          if (!cancelled) setRemoteSymbols(symbols);
        })
        .catch(() => {
          if (!cancelled) setRemoteSymbols([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, q.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const rows = new Map<string, InstrumentOption>();
    const add = (row: InstrumentOption) => rows.set(row.symbol, row);

    const localMatches = !qq ? all.slice(0, 40) : all.filter(
      (row) =>
        row.symbol.toLowerCase().includes(qq) ||
        row.label.toLowerCase().includes(qq),
    );

    if (qq && /^[A-Z0-9.^=\-]{2,12}(?:\.IS)?$/i.test(q.trim())) {
      const typed = q.trim().toUpperCase();
      add({ symbol: typed, label: "Yazdığınız sembolü kullan", profile: inferInstrumentFromSymbol(typed).profile });
    }

    if (qq) {
      for (const sym of remoteSymbols) {
        const upper = sym.trim().toUpperCase();
        const local = all.find((row) => row.symbol === upper);
        if (local) add(local);
        else add({ symbol: upper, label: "Yahoo Finance sonucu", profile: inferInstrumentFromSymbol(upper).profile });
      }
    }

    for (const row of localMatches) add(row);

    return Array.from(rows.values())
      .sort((a, b) => {
        const aStart =
          a.symbol.toLowerCase().startsWith(qq) || a.label.toLowerCase().startsWith(qq);
        const bStart =
          b.symbol.toLowerCase().startsWith(qq) || b.label.toLowerCase().startsWith(qq);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return a.label.localeCompare(b.label, "tr");
      })
      .slice(0, 50);
  }, [q, all, remoteSymbols]);

  const selected = value ? all.find((r) => r.symbol === value) : null;

  return (
    <div className="space-y-2">
      {label ? <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p> : null}
      {loading ? <p className="text-[10px] font-medium text-sky-300">Aranıyor…</p> : null}
      {!hideSelectedPreview && selected ? (
        <p className="text-sm text-white">
          <span className="font-bold">{selected.label}</span>
          <span className="ml-2 font-mono text-xs text-white/40">{selected.symbol}</span>
        </p>
      ) : null}
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-10 border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30"
      />
      <ul className="max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black/20">
        {filtered.map((row) => {
          const active = value === row.symbol;
          return (
            <li key={row.symbol}>
              <button
                type="button"
                onClick={() => {
                  onSelect(row);
                  setQ(row.label);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors",
                  active ? "bg-primary/20 text-white" : "text-white/80 hover:bg-white/5",
                )}
              >
                <span className="font-medium">{row.label}</span>
                <span className="font-mono text-[10px] text-white/40">{row.symbol}</span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-center text-xs text-white/40">Eşleşme yok</li>
        ) : null}
      </ul>
    </div>
  );
}
