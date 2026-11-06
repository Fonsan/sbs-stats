import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";
import type { DailyDataPoint } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { ChartCard } from "@/components/ChartCard";
import { FONTS } from "@/theme";

interface Props {
  title: string;
  data: DailyDataPoint[];
  globalMax: number;
  globalMedian: number;
  wfull: boolean;
  exportContext?: string; // shown in the PNG export only
}

export function DailyBarChart({ title, data, globalMax, globalMedian, wfull, exportContext }: Props) {
  const { theme: t } = useTheme();
  const max = globalMax;
  const median = globalMedian;

  return (
    <ChartCard title={title} wfull={wfull} exportContext={exportContext}>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontFamily: FONTS.mono, fontSize: 11 }}>
        <span style={{ color: t.accent }}>▲ MAX {max.toLocaleString()}</span>
        <span style={{ color: t.text }}>~ MEDIAN {median.toLocaleString()}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={t.chartGrid} vertical={false} />
          <XAxis dataKey="date"
            tick={{ fontSize: 10, fill: t.textMuted, fontFamily: FONTS.mono }}
            tickLine={false} axisLine={false}
            tickFormatter={(v: string) => { const p = v.slice(5).split('-'); return `${p[1]}/${p[0]}`; }}
          />
          <YAxis tick={{ fontSize: 10, fill: t.textMuted, fontFamily: FONTS.mono }} tickLine={false} axisLine={false} domain={[0, (dataMax: number) => Math.max(dataMax, globalMax)]} />
          <Tooltip
            cursor={{ fill: t.surfaceBorder, opacity: 0.2 }}
            contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, fontFamily: FONTS.mono, fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
            labelStyle={{ color: t.textMuted, marginBottom: 4 }}
            itemStyle={{ color: t.primary }}
            labelFormatter={(v: string) => { const [y, m, d] = v.split('-'); return `${d}.${m}.${y}`; }}
          />
          <Bar dataKey="value" name={title}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.is_today ? t.accent : t.primary} />
            ))}
          </Bar>
          {/* Reference lines after the bars so they're drawn on top */}
          <ReferenceLine y={max} stroke={t.accent} strokeDasharray="4 4" strokeOpacity={0.6} />
          <ReferenceLine y={median} stroke={t.text} strokeDasharray="4 4" strokeOpacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}