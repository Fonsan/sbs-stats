import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useDatabaseContext } from "@/context/useDatabaseContext";
import { useTheme } from "@/hooks/useTheme";
import { HourlyRidgelineChart } from "@/components/HourlyRidgelineChart";
import { ChartGrid, LoadingScreen, ErrorScreen } from "@/components/Layout";
import { buildMetrics } from "@/utils/metrics";
import { toDaySeries } from "@/utils/hourly";
import type { DailyRow, StatKey, Metric } from "@/types";
import { FONTS } from "@/theme";

const DAY_OPTIONS = [7, 14, 30, 60] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

// WebGL/plotly is heavy, so the 3D chart is its own chunk and doesn't hold up the rest of the page
const HourlySurfaceChart = lazy(() => import("@/components/HourlySurfaceChart"));

interface Charts3DPageProps {
  refreshKey?: number;
}

// Hourly data shown in depth: a 3D surface and a ridgeline, each with its own metric picker
export function Charts3DPage({ refreshKey }: Charts3DPageProps) {
  const { theme: t } = useTheme();
  const { loadState, error, queryHourly } = useDatabaseContext();
  const [days, setDays] = useState<DayOption>(60);
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (loadState === "ready") { setRows(queryHourly(days)); setHasData(true); }
  }, [loadState, days, queryHourly, refreshKey]);

  const metrics = useMemo<Metric[]>(() => buildMetrics(), []);
  const [surfaceKey, setSurfaceKey] = useState<StatKey>("total_personnel_casualties");
  // Memoized so the 3D chart only redraws when its data actually changes
  const surfaceData = useMemo(() => toDaySeries(rows, surfaceKey), [rows, surfaceKey]);
  const [ridgeKey, setRidgeKey] = useState<StatKey>("total_personnel_casualties");
  const ridgeData = useMemo(() => toDaySeries(rows, ridgeKey), [rows, ridgeKey]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 24, color: t.text }}>
            3D Charts
          </h1>
          <p style={{ fontFamily: FONTS.mono, fontSize: 11, color: t.textMuted, marginTop: 3 }}>
            Hourly data by day · 3D view stacks the days by date · ridgeline shows the value added per hour · {new Date().toDateString()}
          </p>
          <p style={{ fontFamily: FONTS.mono, fontSize: 11, color: t.bgImportant, marginTop: 3}}>Today's figures are preliminary and will be updated over the course of the next day.</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DAY_OPTIONS.map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{
              background: days === d ? t.accent : t.bgAlt,
              color: days === d ? "#fff" : t.textMuted,
              border: `1px solid ${days === d ? t.accent : t.border}`,
              borderRadius: 4, padding: "5px 12px",
              fontFamily: FONTS.mono, fontSize: 11,
              fontWeight: days === d ? 700 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}>{d}d</button>
          ))}
        </div>
      </div>
      {loadState === "loading" && !hasData && <LoadingScreen />}
      {loadState === "error" && <ErrorScreen message={error ?? "Unknown error"} />}
      {(loadState === "ready" || hasData) && (
        <ChartGrid>
          <Suspense fallback={null}>
            <HourlySurfaceChart
              data={surfaceData}
              metrics={metrics}
              metricKey={surfaceKey}
              onMetricChange={setSurfaceKey}
            />
          </Suspense>
          <HourlyRidgelineChart
            data={ridgeData}
            metrics={metrics}
            metricKey={ridgeKey}
            onMetricChange={setRidgeKey}
          />
        </ChartGrid>
      )}
    </div>
  );
}
