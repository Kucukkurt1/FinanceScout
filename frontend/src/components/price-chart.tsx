"use client";

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

export type ChartRow = {
  ds: string;
  actual?: number | null;
  fit?: number | null;
  future?: number | null;
  lower?: number | null;
  upper?: number | null;
};

function formatTick(ts: string) {
  const d = new Date(`${ts}T00:00:00`);
  return d.toLocaleDateString("tr-TR");
}

function tooltipFmt(value: number | undefined) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      accuracy = Math.max(0, 100 - (error * 100)).toFixed(2);
    }

    const formattedDate = label 
      ? new Date(`${label}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
      : "";

    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl min-w-[220px]">
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
            <div className="mt-2 border-t border-white/5 pt-2 flex items-center justify-between gap-6">
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

export function PriceChart({
  data,
  height = 450,
}: {
  data: ChartRow[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }} className="min-h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFuture" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          
          <XAxis
            dataKey="ds"
            tickFormatter={formatTick}
            minTickGap={30}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 500 }}
            dy={10}
          />
          
          <YAxis
            domain={["auto", "auto"]}
            axisLine={false}
            tickLine={false}
            width={80}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 500 }}
            tickFormatter={(v) =>
              typeof v === "number" ? v.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : String(v)
            }
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }} />
          
          <Legend 
            verticalAlign="top" 
            align="right" 
            height={40}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.05em", color: "rgba(255,255,255,0.6)" }}
          />

          <Line
            type="monotone"
            dataKey="actual"
            name="GERÇEK DEĞER"
            stroke="#ffffff"
            dot={false}
            strokeWidth={2.5}
            connectNulls
            animationDuration={1000}
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
            className="drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
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
  );
}
