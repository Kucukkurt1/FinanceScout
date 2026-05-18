"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EventsCalendar } from "@/components/tools/events-calendar";
import { SymbolPicker } from "@/components/tools/symbol-picker";
import { DisclaimerBanner } from "@/components/site/disclaimer-banner";
import { fetchQuality, postCompare, postForecast } from "@/lib/api";
import type { InstrumentOption } from "@/lib/instruments";

export type HubMode = "compare" | "portfolio" | "quality" | "calendar";

type PortfolioLine = {
  symbol: string;
  label: string;
  weight: number;
  investment: number;
};

export function AnalysisHubPanels({ mode }: { mode: HubMode }) {
  if (mode === "compare") return <ComparePanel />;
  if (mode === "portfolio") return <PortfolioPanel />;
  if (mode === "quality") return <QualityPanel />;
  if (mode === "calendar") return <EventsCalendar />;
  return null;
}

function ComparePanel() {
  const [a, setA] = useState<string | null>("BTC-USD");
  const [b, setB] = useState<string | null>("ETH-USD");
  const [c, setC] = useState<string | null>("USDTRY=X");
  const [result, setResult] = useState<Awaited<ReturnType<typeof postCompare>> | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    const symbols = [a, b, c].filter(Boolean) as string[];
    if (symbols.length < 2) return;
    setLoading(true);
    try {
      setResult(await postCompare(symbols, 365));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <SymbolPicker label="Varlık 1" value={a} onSelect={(r) => setA(r.symbol)} />
        <SymbolPicker label="Varlık 2" value={b} onSelect={(r) => setB(r.symbol)} />
        <SymbolPicker label="Varlık 3 (opsiyonel)" value={c} onSelect={(r) => setC(r.symbol)} />
      </div>
      <Button variant="brand" onClick={run} disabled={loading}>
        {loading ? "Hesaplanıyor…" : "Karşılaştır"}
      </Button>
      {result ? (
        <table className="w-full text-sm text-white/80">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="py-2">Sembol</th>
              <th>30g getiri</th>
              <th>Yıllık vol</th>
            </tr>
          </thead>
          <tbody>
            {result.symbols.map((s) => (
              <tr key={s.symbol} className="border-b border-white/5">
                <td className="py-2 font-mono">{s.symbol}</td>
                <td>{s.return_30d != null ? `${(s.return_30d * 100).toFixed(2)}%` : "—"}</td>
                <td>{s.vol_annual != null ? `${(s.vol_annual * 100).toFixed(1)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

function PortfolioPanel() {
  const [lines, setLines] = useState<PortfolioLine[]>([
    { symbol: "THYAO.IS", label: "Türk Hava Yolları", weight: 0.5, investment: 10000 },
    { symbol: "BTC-USD", label: "Bitcoin", weight: 0.5, investment: 10000 },
  ]);
  const [pick, setPick] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [rows, setRows] = useState<
    { symbol: string; label: string; current: number; target: number; investment: number; gain: number; gainPct: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  function addLine(row: InstrumentOption) {
    setLines((prev) => [...prev, { symbol: row.symbol, label: row.label, weight: 0.25, investment: 5000 }]);
    setPick(null);
  }

  async function simulate() {
    setLoading(true);
    setSummary(null);
    const out: typeof rows = [];
    let totalInv = 0;
    let totalGain = 0;
    const errors: string[] = [];
    try {
      for (const line of lines) {
        try {
          const fc = await postForecast({
            symbol: line.symbol,
            history_days: 365,
            forecast_days: 14,
            asset_class: "auto",
          });
          const hist = fc.history.filter((h) => h.y != null);
          const current = hist[hist.length - 1]?.y ?? 0;
          const target = fc.forecast[fc.forecast.length - 1]?.yhat ?? current;
          if (current <= 0) continue;
          const gainPct = (target - current) / current;
          const gain = line.investment * gainPct;
          totalInv += line.investment;
          totalGain += gain;
          out.push({
            symbol: line.symbol,
            label: line.label,
            current,
            target,
            investment: line.investment,
            gain,
            gainPct,
          });
        } catch (e) {
          errors.push(`${line.symbol}: ${e instanceof Error ? e.message : "hata"}`);
        }
      }
      setRows(out);
      if (out.length === 0 && errors.length) {
        setSummary(errors.join(" · "));
      } else {
        const errNote = errors.length ? ` (${errors.length} sembol atlandı)` : "";
        setSummary(
          `Toplam yatırım: ${totalInv.toLocaleString("tr-TR")} ₺ · Tahmini getiri (model son ufuk): ${totalGain >= 0 ? "+" : ""}${totalGain.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺ (${totalInv > 0 ? ((totalGain / totalInv) * 100).toFixed(1) : 0}%)${errNote}`,
        );
      }
    } catch (e) {
      setSummary(e instanceof Error ? e.message : "Hesaplanamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <DisclaimerBanner />
      <p className="text-sm text-white/50">
        Hedef fiyat, 365 günlük geçmiş ve 14 günlük tahmin ufkunun son gününden alınır. Örnek: 100 ₺ → 200 ₺ ve 10.000 ₺
        yatırım kabaca +10.000 ₺ getiri gösterir.
      </p>
      <SymbolPicker label="Satır ekle" value={pick} onSelect={addLine} />
      {lines.map((line, i) => (
        <div key={`${line.symbol}-${i}`} className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
          <div>
            <p className="font-bold text-white">{line.label}</p>
            <p className="font-mono text-xs text-white/40">{line.symbol}</p>
          </div>
          <div>
            <Label className="text-white/50 text-xs">Yatırım tutarı (₺)</Label>
            <Input
              type="number"
              value={line.investment}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...line, investment: Number(e.target.value) };
                setLines(next);
              }}
              className="mt-1 border-white/10 bg-black/20 text-white"
            />
          </div>
          <Button variant="ghost" className="text-rose-300 self-end" onClick={() => setLines(lines.filter((_, j) => j !== i))}>
            Kaldır
          </Button>
        </div>
      ))}
      <Button variant="brand" onClick={simulate} disabled={loading}>
        {loading ? "Hesaplanıyor…" : "Getiri simülasyonu"}
      </Button>
      {rows.length > 0 ? (
        <table className="w-full text-sm text-white/80">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="py-2">Varlık</th>
              <th>Güncel</th>
              <th>Hedef (tahmin)</th>
              <th>Yatırım</th>
              <th>Getiri</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-white/5">
                <td className="py-2">{r.label}</td>
                <td>{r.current.toFixed(2)}</td>
                <td>{r.target.toFixed(2)}</td>
                <td>{r.investment.toLocaleString("tr-TR")} ₺</td>
                <td className={r.gain >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {r.gain >= 0 ? "+" : ""}
                  {r.gain.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺ ({(r.gainPct * 100).toFixed(1)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {summary ? <p className="font-semibold text-white">{summary}</p> : null}
    </div>
  );
}

function QualityPanel() {
  const [symbol, setSymbol] = useState<string | null>("THYAO.IS");
  const [report, setReport] = useState<Awaited<ReturnType<typeof fetchQuality>> | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!symbol) return;
    setLoading(true);
    try {
      setReport(await fetchQuality(symbol, 365));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SymbolPicker label="Sembol seç" value={symbol} onSelect={(r) => setSymbol(r.symbol)} />
      <Button variant="brand" onClick={run} disabled={loading || !symbol}>
        Rapor al
      </Button>
      {report ? (
        <div className="space-y-3 text-sm text-white/80">
          <p>
            Eksik iş günü (tahmini): <strong className="text-white">{report.missing_days}</strong>
          </p>
          <p>Outlier günleri: {report.outliers.length ? report.outliers.join(", ") : "Yok"}</p>
          <p>Sıçrama günleri: {report.jump_days.length ? report.jump_days.join(", ") : "Yok"}</p>
        </div>
      ) : null}
    </div>
  );
}
