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
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function tooltipFmt(value: number | undefined) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function PriceChart({
  data,
  height = 380,
}: {
  data: ChartRow[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }} className="min-h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
          <XAxis
            dataKey="ds"
            tickFormatter={formatTick}
            minTickGap={24}
            className="text-xs text-muted-foreground"
          />
          <YAxis
            domain={["auto", "auto"]}
            width={56}
            className="text-xs text-muted-foreground"
            tickFormatter={(v) =>
              typeof v === "number" ? v.toLocaleString(undefined, { notation: "compact" }) : String(v)
            }
          />
          <Tooltip
            formatter={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              return tooltipFmt(Number(v));
            }}
            labelFormatter={(label) => label}
            contentStyle={{ borderRadius: 8 }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Kapanış (geçmiş)"
            stroke="#2563eb"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="fit"
            name="Model (geçmiş)"
            stroke="#7dd3fc"
            dot={false}
            strokeWidth={1.5}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="future"
            name="Tahmin"
            stroke="#ea580c"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="lower"
            name="Alt güven"
            stroke="#94a3b8"
            dot={false}
            strokeWidth={1}
            strokeDasharray="4 4"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="upper"
            name="Üst güven"
            stroke="#94a3b8"
            dot={false}
            strokeWidth={1}
            strokeDasharray="4 4"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
