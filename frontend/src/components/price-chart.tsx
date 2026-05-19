"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

export type ChartRow = {
  ds: string;
  actual?: number | null;
  fit?: number | null;
  future?: number | null;
  lower?: number | null;
  upper?: number | null;
};

export type ChartGranularity = "day" | "week" | "month";

type ChartViewId = "1m" | "3m" | "6m" | "1y" | "all" | "week" | "month";

const CHART_VIEWS: {
  id: ChartViewId;
  label: string;
  granularity: ChartGranularity;
  days: number | null;
}[] = [
  { id: "1m", label: "1 Ay", granularity: "day", days: 30 },
  { id: "3m", label: "3 Ay", granularity: "day", days: 90 },
  { id: "6m", label: "6 Ay", granularity: "day", days: 180 },
  { id: "1y", label: "1 Yıl", granularity: "day", days: 365 },
  { id: "all", label: "Tümü", granularity: "day", days: null },
  { id: "week", label: "Haftalık", granularity: "week", days: null },
  { id: "month", label: "Aylık", granularity: "month", days: null },
];

function viewFromId(id: ChartViewId) {
  return CHART_VIEWS.find((v) => v.id === id) ?? CHART_VIEWS[4];
}

function formatTick(ts: string, granularity: ChartGranularity) {
  const d = new Date(`${ts}T00:00:00`);
  if (granularity === "month") {
    return d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
  }
  if (granularity === "week") {
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function tooltipFmt(value: number | undefined) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function bucketKey(ds: string, granularity: ChartGranularity): string {
  if (granularity === "month") return ds.slice(0, 7);
  if (granularity === "week") {
    const d = new Date(`${ds}T00:00:00`);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }
  return ds;
}

type NumericField = Exclude<keyof ChartRow, "ds">;

function pickLast(rows: ChartRow[]): ChartRow {
  const last = rows[rows.length - 1];
  const mergeField = (key: NumericField): number | null => {
    for (let i = rows.length - 1; i >= 0; i--) {
      const v = rows[i][key];
      if (v !== null && v !== undefined) return v;
    }
    return null;
  };
  return {
    ds: last.ds,
    actual: mergeField("actual"),
    fit: mergeField("fit"),
    future: mergeField("future"),
    lower: mergeField("lower"),
    upper: mergeField("upper"),
  };
}

function resampleRows(data: ChartRow[], granularity: ChartGranularity): ChartRow[] {
  if (granularity === "day" || data.length === 0) return data;

  const buckets = new Map<string, ChartRow[]>();
  for (const row of data) {
    const key = bucketKey(row.ds, granularity);
    const list = buckets.get(key) ?? [];
    list.push(row);
    buckets.set(key, list);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, rows]) => pickLast(rows));
}

function filterByRange(data: ChartRow[], days: number | null): ChartRow[] {
  if (!days || data.length === 0) return data;
  const lastTs = new Date(`${data[data.length - 1].ds}T00:00:00`).getTime();
  const cutoff = lastTs - days * 24 * 60 * 60 * 1000;
  return data.filter((r) => new Date(`${r.ds}T00:00:00`).getTime() >= cutoff);
}

type TooltipPayloadEntry = {
  dataKey?: string;
  value?: number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const actual = payload.find((p) => p.dataKey === "actual")?.value;
    const prediction = payload.find((p) => p.dataKey === "future" || p.dataKey === "fit")?.value;
    const lower = payload.find((p) => p.dataKey === "lower")?.value;
    const upper = payload.find((p) => p.dataKey === "upper")?.value;

    let accuracy = null;
    if (actual && prediction) {
      const error = Math.abs(actual - prediction) / actual;
      accuracy = Math.max(0, 100 - error * 100).toFixed(2);
    }

    const formattedDate = label
      ? new Date(`${label}T00:00:00`).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

    return (
      <div className="min-w-[220px] rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">{formattedDate}</p>
        <div className="space-y-2">
          {actual !== undefined && (
            <div className="flex items-center justify-between gap-6">
              <span className="text-[11px] font-medium text-white/60">GERÇEK DEĞER:</span>
              <span className="font-mono text-sm font-bold text-white">{tooltipFmt(actual)}</span>
            </div>
          )}
          {prediction !== undefined && (
            <div className="flex items-center justify-between gap-6">
              <span className="text-[11px] font-medium text-[#fbbf24]/80">AI TAHMİNİ:</span>
              <span className="font-mono text-sm font-bold text-[#fbbf24]">{tooltipFmt(prediction)}</span>
            </div>
          )}
          {lower !== undefined && (
            <div className="flex items-center justify-between gap-6 border-t border-white/5 pt-2">
              <span className="text-[11px] font-medium text-[#818cf8]/80">EN DÜŞÜK (OLASI):</span>
              <span className="font-mono text-sm font-bold text-[#818cf8]">{tooltipFmt(lower)}</span>
            </div>
          )}
          {upper !== undefined && (
            <div className="flex items-center justify-between gap-6">
              <span className="text-[11px] font-medium text-[#818cf8]/80">EN YÜKSEK (OLASI):</span>
              <span className="font-mono text-sm font-bold text-[#818cf8]">{tooltipFmt(upper)}</span>
            </div>
          )}
          {accuracy && (
            <div className="mt-2 flex items-center justify-between gap-6 border-t border-white/5 pt-2">
              <span className="text-[11px] font-bold text-emerald-400/80">DOĞRULUK ORANI:</span>
              <span className="font-mono text-sm font-bold text-emerald-400">%{accuracy}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

function ChartToolbar({
  viewId,
  onView,
}: {
  viewId: ChartViewId;
  onView: (id: ChartViewId) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Görünüm</span>
      {CHART_VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onView(v.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
            viewId === v.id
              ? "bg-primary text-white shadow-md shadow-primary/25"
              : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

export function PriceChart({
  data,
  className,
  compact = false,
}: {
  data: ChartRow[];
  className?: string;
  compact?: boolean;
}) {
  const [viewId, setViewId] = useState<ChartViewId>("all");
  const view = viewFromId(viewId);

  const displayData = useMemo(() => {
    const ranged = view.granularity === "day" ? filterByRange(data, view.days) : data;
    return resampleRows(ranged, view.granularity);
  }, [data, view]);

  const tickGap = view.granularity === "day" ? 28 : view.granularity === "week" ? 40 : 48;

  return (
    <div className={cn("flex w-full min-w-0 flex-col", className)}>
      <ChartToolbar viewId={viewId} onView={setViewId} />
      <div className={cn("relative w-full", compact ? "h-[240px] min-h-[240px]" : "min-h-[420px] h-[min(58vh,620px)]")}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 16, right: 12, bottom: 12, left: 4 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFuture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

            <XAxis
              dataKey="ds"
              tickFormatter={(v) => formatTick(String(v), view.granularity)}
              minTickGap={tickGap}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 500 }}
              dy={10}
            />

            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              width={72}
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 500 }}
              tickFormatter={(v) =>
                typeof v === "number" ? v.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) : String(v)
              }
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }} />

            <Legend
              verticalAlign="top"
              align="right"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "rgba(255,255,255,0.6)",
              }}
            />

            <Line
              type="monotone"
              dataKey="actual"
              name="GERÇEK DEĞER"
              stroke="#ffffff"
              dot={false}
              strokeWidth={2.5}
              connectNulls
              animationDuration={600}
            />

            <Line
              type="monotone"
              dataKey="fit"
              name="MODEL TESTİ"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={2}
              strokeDasharray="5 5"
              opacity={0.6}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="future"
              name="AI TAHMİNİ"
              stroke="#fbbf24"
              dot={false}
              strokeWidth={3}
              connectNulls
              strokeDasharray="8 4"
            />

            <Line
              type="monotone"
              dataKey="lower"
              name="BEKLENEN EN DÜŞÜK"
              stroke="#818cf8"
              dot={false}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.8}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="upper"
              name="BEKLENEN EN YÜKSEK"
              stroke="#818cf8"
              dot={false}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.8}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
