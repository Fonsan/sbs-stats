import { useEffect, useMemo, useRef } from "react";
import Plotly from "plotly.js-gl3d-dist-min";
import type { DailyDaySeries, Metric, StatKey } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { ChartCard } from "@/components/ChartCard";
import { FONTS } from "@/theme";

interface Props {
  data: DailyDaySeries[];
  metrics: Metric[];
  metricKey: StatKey;
  onMetricChange: (key: StatKey) => void;
}

// Same x mapping as HourlyLineChart: position 0 is the day-start anchor (always 0),
// DB hour N is drawn at position N+1 (the running total at the end of that hour)
const POSITIONS = Array.from({ length: 25 }, (_, i) => i);

function zRow(series: DailyDaySeries): (number | null)[] {
  const byHour = new Map(series.points.map((p) => [p.hour, p.value]));
  return POSITIONS.map((pos) => (pos === 0 ? 0 : byHour.get(pos - 1) ?? null));
}

// Past days: carry the running total over missing hours (like connectNulls in the 2D chart);
// null cells would punch holes in the surface
function filledRow(series: DailyDaySeries): number[] {
  let last = 0;
  return zRow(series).map((v) => (last = v ?? last));
}

// One WebGL surface: x = hour, y = date, z = cumulative value through the day.
// Loaded lazily by HourlyPage so the plotly bundle doesn't delay the 2D charts.
export default function HourlySurfaceChart({ data, metrics, metricKey, onMetricChange }: Props) {
  const { theme: t } = useTheme();
  const plotRef = useRef<HTMLDivElement>(null);
  const today = data.find((s) => s.is_today);
  const past = useMemo(() => data.filter((s) => !s.is_today), [data]);
  const label = metrics.find((m) => m.key === metricKey)?.label ?? metricKey;

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    // The scene is fitted to the plot height, so narrow (phone) plots need the camera further back
    const narrow = el.clientWidth < 600;
    const zoomOut = narrow ? 1.35 : 1;
    const axis = {
      gridcolor: t.chartGrid,
      zerolinecolor: t.border,
      linecolor: t.border,
      showbackground: false,
      tickfont: { size: 10 },
    };
    const traces: Plotly.Data[] = [
      {
        type: "surface",
        x: POSITIONS,
        // Today is drawn only as the red line: its future hours are unknown, not zero
        y: past.map((s) => s.date),
        z: past.map(filledRow),
        colorscale: [[0, t.chartGrid], [1, t.primary]],
        showscale: false,
        hovertemplate: "%{y|%d.%m.%Y} · until %{x}:00<br><b>%{z:,}</b><extra></extra>",
      },
    ];
    if (today) {
      const row = zRow(today);
      const pts = POSITIONS.filter((pos) => row[pos] != null);
      traces.push({
        type: "scatter3d",
        mode: "lines",
        x: pts,
        y: pts.map(() => today.date),
        z: pts.map((pos) => row[pos]),
        line: { color: t.accent, width: 6 },
        hovertemplate: "TODAY · until %{x}:00<br><b>%{z:,}</b><extra></extra>",
      });
    }
    const layout: Partial<Plotly.Layout> = {
      // Constant revision keeps the user's camera across auto-refreshes and range changes
      uirevision: "hourly-surface",
      height: narrow ? 300 : 480,
      margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: t.surface,
      font: { family: FONTS.mono, size: 10, color: t.textMuted },
      showlegend: false,
      hoverlabel: { bgcolor: t.surface, bordercolor: t.border, font: { family: FONTS.mono, color: t.text } },
      scene: {
        xaxis: { ...axis, title: { text: "hour (Kyiv)" }, range: [0, 24], dtick: 3 },
        // Reversed so the newest day (today) sits on the near edge with hours running left → right
        yaxis: { ...axis, title: { text: "" }, autorange: "reversed", tickformat: "%d.%m." },
        zaxis: { ...axis, title: { text: "" }, rangemode: "tozero" },
        aspectmode: "manual",
        aspectratio: { x: 1.5, y: 1.5, z: 0.8 },
        // Near-frontal: hours left → right, dates receding, slight angle so the depth reads
        camera: { eye: { x: 0.35 * zoomOut, y: -1.9 * zoomOut, z: 0.75 * zoomOut }, center: { x: 0, y: 0, z: -0.3 } },
      },
    };
    Plotly.react(el, traces, layout, { responsive: true, displaylogo: false });
  }, [past, today, t]);

  // html-to-image reads the WebGL canvas back blank, so export a plotly snapshot in its place
  const swapInSnapshot = async () => {
    const el = plotRef.current;
    if (!el) return () => {};
    const img = document.createElement("img");
    img.src = await Plotly.toImage(el, { format: "png", width: el.clientWidth, height: el.clientHeight, scale: 2 });
    img.style.width = "100%";
    img.style.display = "block";
    await img.decode();
    el.style.display = "none";
    el.after(img);
    return () => { img.remove(); el.style.display = ""; };
  };

  // Release the WebGL context when the chart goes away
  useEffect(() => {
    const el = plotRef.current;
    return () => { if (el) Plotly.purge(el); };
  }, []);

  return (
    <ChartCard title={`${label} — 3D`} wfull beforeExport={swapInSnapshot}>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontFamily: FONTS.mono, fontSize: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={metricKey}
          onChange={(e) => onMetricChange(e.target.value as StatKey)}
          aria-label="Metric for the 3D chart"
          style={{
            background: t.bgAlt, color: t.text,
            border: `1px solid ${t.border}`, borderRadius: 4,
            padding: "4px 8px", fontFamily: FONTS.mono, fontSize: 11,
            maxWidth: "100%",
          }}
        >
          {metrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <span style={{ color: t.accent, fontWeight: 700 }}>— TODAY</span>
        <span style={{ color: t.textMuted }}>{past.length} previous day{past.length !== 1 ? "s" : ""}</span>
        <span style={{ color: t.textFaint }}>drag to rotate · scroll to zoom</span>
      </div>
      <div ref={plotRef} />
    </ChartCard>
  );
}
