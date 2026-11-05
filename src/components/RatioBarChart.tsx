import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { useTheme } from "@/hooks/useTheme";
import { weightedKilledShare } from "@/utils/ratio";
import { FONTS } from "@/theme";

export interface RatioDataPoint {
  date: string;
  ratio: number | null; // killed share in %, null when no casualties
  killed: number;
  wounded: number;
  highlight: boolean;   // today / current month
}

interface Props {
  title: string;
  data: RatioDataPoint[];
  tickFormatter: (v: string) => string;
  labelFormatter: (v: string) => string;
  wfull: boolean;
}

// Stacked shares: killed at the bottom, wounded on top, always summing to 100
type StackedPoint = RatioDataPoint & { killedPct: number | null; woundedPct: number | null };

// Show % labels inside the bars only when they are wide enough to fit
const MAX_LABELLED_BARS = 16;

const RatioTooltip = ({
  active, payload, t, labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{ payload?: StackedPoint }>;
  t: ReturnType<typeof useTheme>["theme"];
  labelFormatter: (v: string) => string;
}) => {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 6, padding: "10px 14px",
      fontFamily: FONTS.mono, fontSize: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    }}>
      <div style={{ color: t.textMuted, marginBottom: 6 }}>{labelFormatter(d.date)}</div>
      {d.killedPct == null ? (
        <div style={{ color: t.textMuted }}>No casualties</div>
      ) : (
        <>
          <div style={{ color: t.accent }}>
            Killed: <span style={{ color: t.text, fontWeight: 700 }}>{d.killedPct}%</span> ({d.killed.toLocaleString()})
          </div>
          <div style={{ color: t.primary }}>
            Wounded: <span style={{ color: t.text, fontWeight: 700 }}>{d.woundedPct}%</span> ({d.wounded.toLocaleString()})
          </div>
        </>
      )}
    </div>
  );
};

export function RatioBarChart({ title, data, tickFormatter, labelFormatter, wfull }: Props) {
  const { theme: t } = useTheme();
  const avg = weightedKilledShare(data);
  const stacked: StackedPoint[] = data.map((d) => ({
    ...d,
    killedPct: d.ratio,
    woundedPct: d.ratio != null ? Math.round((100 - d.ratio) * 10) / 10 : null,
  }));
  const showLabels = data.length <= MAX_LABELLED_BARS;
  const labelStyle = { fontSize: 10, fill: "#ffffff", fontFamily: FONTS.mono };
  const pctLabel = (v: unknown) => (typeof v === "number" && v >= 8 ? `${Math.round(v)}%` : "");

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 8,
      padding: "18px 16px 12px",
      gridColumn: wfull ? "1 / -1" : undefined,
      animation: "fadeIn 0.3s ease both",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, color: t.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontFamily: FONTS.mono, fontSize: 11, flexWrap: "wrap" }}>
        <span style={{ color: t.accent }}>■ Killed</span>
        <span style={{ color: t.primary }}>■ Wounded</span>
        <span style={{ color: t.text }}>- - AVG killed {avg != null ? `${avg}%` : "–"}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={stacked} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={t.chartGrid} vertical={false} />
          <XAxis dataKey="date"
            tick={{ fontSize: 10, fill: t.textMuted, fontFamily: FONTS.mono }}
            tickLine={false} axisLine={false}
            tickFormatter={tickFormatter}
          />
          <YAxis tick={{ fontSize: 10, fill: t.textMuted, fontFamily: FONTS.mono }} tickLine={false} axisLine={false}
            domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip cursor={{ fill: t.surfaceBorder, opacity: 0.2 }}
            content={(props) => <RatioTooltip {...props} t={t} labelFormatter={labelFormatter} />} />
          <Bar dataKey="killedPct" stackId="share" name="Killed" fill={t.accent}>
            {stacked.map((entry, i) => (
              <Cell key={`k-${i}`} fill={t.accent} fillOpacity={entry.highlight ? 1 : 0.8} />
            ))}
            {showLabels && <LabelList dataKey="killedPct" position="center" formatter={pctLabel} style={labelStyle} />}
          </Bar>
          <Bar dataKey="woundedPct" stackId="share" name="Wounded" fill={t.primary}>
            {stacked.map((entry, i) => (
              <Cell key={`w-${i}`} fill={t.primary} fillOpacity={entry.highlight ? 1 : 0.8} />
            ))}
            {showLabels && <LabelList dataKey="woundedPct" position="center" formatter={pctLabel} style={labelStyle} />}
          </Bar>
          {avg != null && (
            <ReferenceLine y={avg} stroke={t.text} strokeDasharray="4 4" strokeOpacity={0.7}
              label={{ value: "AVG", position: "insideTopRight", fontSize: 9, fill: t.text, fontFamily: FONTS.mono }} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
