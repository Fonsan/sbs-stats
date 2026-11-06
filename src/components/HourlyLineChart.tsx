import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { DailyDaySeries } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { ChartCard } from "@/components/ChartCard";
import type { Theme } from "@/theme";
import { FONTS } from "@/theme";
// Hour ticks at an even step that fits the chart width. Letting recharts drop overlapping
// ticks itself leaves uneven gaps on narrow screens (e.g. "7 8 9 10 12 14").
const TICK_STEPS = [1, 2, 3, 4, 6, 12];
const MIN_TICK_SPACING = 22; // px per tick label ("24" in 10px mono plus breathing room)
const Y_AXIS_SPACE = 58;     // y-axis labels + chart margins, not available to the x-axis
function hourTicks(chartWidth: number): number[] {
  const plot = chartWidth - Y_AXIS_SPACE;
  const step = TICK_STEPS.find((s) => plot / (24 / s) >= MIN_TICK_SPACING) ?? 12;
  return Array.from({ length: 24 / step + 1 }, (_, i) => i * step);
}

interface Props {
  title: string;
  data: DailyDaySeries[];
  globalMax: number;
  globalMedian: number;
  wfull: boolean;
  exportContext?: string; // shown in the PNG export only
}
function pivotData(series: DailyDaySeries[]): Record<string, number | null>[] {
  // X-axis runs 0–24. Hour 0 is always 0 (day start anchor).
  // DB hours 0–23 are mapped to display positions 1–24.
  const rows: Record<string, number | null>[] = [];
  // Anchor at x=0, all series = 0
  const anchor: Record<string, number | null> = { hour: 0 };
  for (const s of series) anchor[s.date] = 0;
  rows.push(anchor);
  // DB hour N → display position N+1
  for (let h = 0; h < 24; h++) {
    const row: Record<string, number | null> = { hour: h + 1 };
    for (const s of series) {
      const pt = s.points.find((p) => p.hour === h);
      row[s.date] = pt != null ? pt.value : null;
    }
    rows.push(row);
  }
  return rows;
}
type TooltipEntry = { dataKey: string; value: number };

const CustomTooltip = ({
  active, payload, label, todayDate, t,
}: TooltipProps<number, string> & {
  todayDate: string | undefined;
  t: Theme;
}) => {
  if (!active || !payload?.length) return null;

  // Normalise Recharts payload to our simple shape, filtering out bad entries
  const entries: TooltipEntry[] = payload
    .filter((p) => typeof p.dataKey === "string" && typeof p.value === "number")
    .map((p) => ({ dataKey: p.dataKey as string, value: p.value as number }));

  // Today goes into the header line, so the past days fill whole columns (e.g. 60 days → 5 × 12)
  const today = entries.find((p) => p.dataKey === todayDate);
  const past = entries
    .filter((p) => p.dataKey !== todayDate)
    .sort((a, b) => b.dataKey.localeCompare(a.dataKey)); // newest → oldest
  const ROWS_PER_COL = 12;
  const columns: typeof past[] = [];
  for (let i = 0; i < past.length; i += ROWS_PER_COL) {
    columns.push(past.slice(i, i + ROWS_PER_COL));
  }
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 6,
      padding: "6px 8px",
      fontFamily: FONTS.mono,
      fontSize: 10,
      boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
      pointerEvents: "none",
    }}>
      {/* Hour header + today's value */}
      <div style={{ display: "flex", gap: 12, marginBottom: 4, fontWeight: 700, letterSpacing: "0.05em" }}>
        <span style={{ color: t.textMuted }}>
          {label == null ? "" : label === 0 ? "00:00" : `${String(label - 1).padStart(2,"0")}:00–${String(label - 1).padStart(2,"0")}:59`}
        </span>
        {today && (
          <span style={{ color: t.accent }}>
            TODAY <span style={{ color: t.text }}>{today.value.toLocaleString()}</span>
          </span>
        )}
      </div>
      {/* Columns */}
      <div style={{ display: "flex", gap: 8 }}>
        {columns.map((col, ci) => (
          <div key={ci} style={ci > 0 ? { borderLeft: `1px solid ${t.surfaceBorder}`, paddingLeft: 8 } : undefined}>
            {col.map((p) => {
              // DD.MM. to save space
              const [, m, d] = p.dataKey.split('-');
              return (
                <div key={p.dataKey} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 6,
                  lineHeight: "14px",
                }}>
                  {/* Dates faint, values bold, so the two read as separate columns */}
                  <span style={{ color: t.textFaint }}>{`${d}.${m}.`}</span>
                  <span style={{ color: t.text, fontWeight: 700 }}>{p.value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
// Inject CSS once to elevate hovered chart card above siblings
const STYLE_ID = "hourly-chart-hover-style";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `.hourly-card { position: relative; z-index: 1; } .hourly-card:hover { z-index: 100; }`;
  document.head.appendChild(s);
}
export function HourlyLineChart({ title, data, globalMax, globalMedian, wfull, exportContext }: Props) {
  const { theme: t } = useTheme();
  const chartData = pivotData(data);
  const todaySeries = data.find((s) => s.is_today);
  const pastSeries = data.filter((s) => !s.is_today);
  const total = pastSeries.length;
  const [chartWidth, setChartWidth] = useState(600);
  const getOpacity = (index: number) =>
    total <= 1 ? 0.18 : 0.07 + (index / (total - 1)) * 0.35;
  return (
    <ChartCard title={title} wfull={wfull} className="hourly-card" exportContext={exportContext}>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontFamily: FONTS.mono, fontSize: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: t.accent, fontWeight: 700 }}>— TODAY</span>
        <span style={{ color: t.textMuted }}>{total} previous day{total !== 1 ? "s" : ""}</span>
        <span style={{ color: t.accent }}>▲ MAX {globalMax.toLocaleString()}</span>
        <span style={{ color: t.text }}>~ MEDIAN {globalMedian.toLocaleString()}</span>
      </div>
      <ResponsiveContainer width="100%" height={220} onResize={(w) => setChartWidth(w)}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={t.chartGrid} />
          <XAxis dataKey="hour"
            tick={{ fontSize: 10, fill: t.textMuted, fontFamily: FONTS.mono }}
            tickLine={false} axisLine={false}
            ticks={hourTicks(chartWidth)}
            interval={0}
            tickFormatter={(h: number) => `${h}`}
            type="number"
            domain={[0, 24]}
          />
          <YAxis tick={{ fontSize: 10, fill: t.textMuted, fontFamily: FONTS.mono }} tickLine={false} axisLine={false} domain={[0, (dataMax: number) => Math.max(dataMax, globalMax)]} />
          <Tooltip
            content={(props) => <CustomTooltip {...props} todayDate={todaySeries?.date} t={t} />}
            // Keep the tooltip inside the chart so it flips sides instead of leaving the screen
            allowEscapeViewBox={{ x: false, y: false }}
            wrapperStyle={{ zIndex: 9999 }}
          />
          {pastSeries.map((s, i) => (
            <Line key={s.date} type="monotone" dataKey={s.date}
              stroke="#9ca3af" strokeWidth={1} strokeOpacity={getOpacity(i)}
              dot={false} activeDot={{ r: 3, fill: "#9ca3af", opacity: 0.6 }}
              connectNulls isAnimationActive={false}
            />
          ))}
          {todaySeries && (
            <Line key={todaySeries.date} type="monotone" dataKey={todaySeries.date}
              stroke={t.accent} strokeWidth={3.5} strokeOpacity={1}
              dot={false} activeDot={{ r: 4, fill: t.accent }}
              connectNulls isAnimationActive={false}
            />
          )}
          {/* Reference lines after the data lines so they're drawn on top */}
          <ReferenceLine y={globalMax} stroke={t.accent} strokeDasharray="4 4" strokeOpacity={0.6} />
          <ReferenceLine y={globalMedian} stroke={t.text} strokeDasharray="4 4" strokeOpacity={0.7} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
