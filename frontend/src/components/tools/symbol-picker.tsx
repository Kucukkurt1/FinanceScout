"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { getAllInstruments, type InstrumentOption } from "@/lib/instruments";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  value: string | null;
  onSelect: (row: InstrumentOption) => void;
  placeholder?: string;
};

export function SymbolPicker({ label, value, onSelect, placeholder = "Ara: B → BIST, BTC…" }: Props) {
  const [q, setQ] = useState("");
  const all = useMemo(() => getAllInstruments(), []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return all.slice(0, 40);
    const matches = all.filter(
      (row) =>
        row.symbol.toLowerCase().includes(qq) ||
        row.label.toLowerCase().includes(qq),
    );
    return matches
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
  }, [q, all]);

  const selected = value ? all.find((r) => r.symbol === value) : null;

  return (
    <div className="space-y-2">
      {label ? <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p> : null}
      {selected ? (
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
                  setQ("");
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
