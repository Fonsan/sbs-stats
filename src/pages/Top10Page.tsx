import { useMemo, useEffect, useState } from "react";
import { useDatabaseContext } from "@/context/useDatabaseContext";
import { useTheme } from "@/hooks/useTheme";
import { Top10 } from "@/components/Top10";
import { ChartGrid, LoadingScreen, ErrorScreen } from "@/components/Layout";
import { buildMetrics } from "@/utils/metrics";
import type { DailyDataPoint, StatKey, Metric } from "@/types";
import { FONTS } from "@/theme";

const LIMIT_OPTIONS = [10, 25, 50] as const;
type LimitOption = (typeof LIMIT_OPTIONS)[number];

interface Top10PageProps {
  refreshKey?: number;
}

export function Top10Page({ refreshKey }: Top10PageProps) {
  const { theme: t } = useTheme();
  const { loadState, error, queryTop10 } = useDatabaseContext();
  const [limit, setLimit] = useState<LimitOption>(10);
  const [top10, setTop10] = useState<Record<StatKey, DailyDataPoint[]>>({} as Record<StatKey, DailyDataPoint[]>);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (loadState === "ready") { setTop10(queryTop10(limit)); setHasData(true); }
  }, [loadState, limit, queryTop10, refreshKey]);

  const metrics = useMemo<Metric[]>(() => buildMetrics(), []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 24, color: t.text }}>
            Top {limit} Days
          </h1>
          <p style={{ fontFamily: FONTS.mono, fontSize: 11, color: t.textMuted, marginTop: 3 }}>
            Highest daily values per category · all available data
          </p>
          <p style={{ fontFamily: FONTS.mono, fontSize: 11, color: t.bgImportant, marginTop: 3 }}>Today's figures are preliminary and will be updated over the course of the next day.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {LIMIT_OPTIONS.map((n) => (
            <button key={n} onClick={() => setLimit(n)} style={{
              background: limit === n ? t.primary : t.bgAlt,
              color: limit === n ? "#fff" : t.textMuted,
              border: `1px solid ${limit === n ? t.primary : t.border}`,
              borderRadius: 4, padding: "5px 12px",
              fontFamily: FONTS.mono, fontSize: 11,
              fontWeight: limit === n ? 700 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}>Top {n}</button>
          ))}
        </div>
      </div>

      {loadState === "loading" && !hasData && <LoadingScreen />}
      {loadState === "error" && <ErrorScreen message={error ?? "Unknown error"} />}
      {(loadState === "ready" || hasData) && (
        <ChartGrid>
          {metrics.map((m: Metric) => (
            <Top10
              key={m.key}
              title={m.label}
              data={top10[m.key] ?? []}
              wfull={m.wfull ?? false}
            />
          ))}
        </ChartGrid>
      )}
    </div>
  );
}
