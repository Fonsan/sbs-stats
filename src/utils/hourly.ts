import type { DailyDaySeries, DailyRow, StatKey } from "@/types";

// Groups hourly DB rows into one series per day for one metric; past days oldest first, today last
export function toDaySeries(rows: DailyRow[], key: StatKey): DailyDaySeries[] {
  const map = new Map<string, DailyDaySeries>();
  for (const row of rows) {
    if (!map.has(row.date)) map.set(row.date, { date: row.date, is_today: row.is_today, points: [] });
    map.get(row.date)!.points.push({ hour: row.hour, value: (row[key] as number) ?? 0 });
  }
  for (const s of map.values()) s.points.sort((a, b) => a.hour - b.hour);
  return Array.from(map.values()).sort((a, b) => {
    if (a.is_today) return 1;
    if (b.is_today) return -1;
    return a.date.localeCompare(b.date);
  });
}

// Same x mapping as HourlyLineChart: position 0 is the day-start anchor (always 0),
// DB hour N is drawn at position N+1 (the running total at the end of that hour)
export const POSITIONS = Array.from({ length: 25 }, (_, i) => i);

// Running total per position; hours missing from the DB are null
export function zRow(series: DailyDaySeries): (number | null)[] {
  const byHour = new Map(series.points.map((p) => [p.hour, p.value]));
  return POSITIONS.map((pos) => (pos === 0 ? 0 : byHour.get(pos - 1) ?? null));
}

// Carry the running total over missing hours (like connectNulls in the 2D chart)
export function filledRow(series: DailyDaySeries): number[] {
  let last = 0;
  return zRow(series).map((v) => (last = v ?? last));
}

// Value added in each DB hour 0–23. Downward corrections count as 0; today's hours that
// haven't happened yet are null rather than 0.
export function hourlyIncrements(series: DailyDaySeries): (number | null)[] {
  const cum = zRow(series);
  const lastKnown = cum.reduce<number>((acc, v, pos) => (v != null ? pos : acc), 0);
  let prev = 0;
  return cum.slice(1).map((v, h) => {
    if (series.is_today && h + 1 > lastKnown) return null;
    const cur = v ?? prev;
    const inc = Math.max(0, cur - prev);
    prev = cur;
    return inc;
  });
}

export interface ConePoint { pos: number; p10: number; p25: number; p50: number; p75: number; p90: number }

// Linear-interpolated quantile of an ascending array
function quantile(sorted: number[], q: number): number {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  return sorted[lo] + (sorted[Math.ceil(i)] - sorted[lo]) * (i - lo);
}

const MIN_CONE_DAYS = 3;

// Where today is likely to end up: each past day's growth after today's last known hour,
// added to today's current total (additive, since ratios explode early in the day when
// values are near 0). Positions follow POSITIONS; null when there is nothing to project.
export function todayCone(series: DailyDaySeries[]): { from: number; points: ConePoint[] } | null {
  const today = series.find((s) => s.is_today);
  const past = series.filter((s) => !s.is_today);
  if (!today || past.length < MIN_CONE_DAYS) return null;
  const row = zRow(today);
  const from = row.reduce<number>((acc, v, pos) => (v != null ? pos : acc), 0);
  if (from >= POSITIONS.length - 1) return null;
  const now = row[from] ?? 0;
  const pastRows = past.map(filledRow);
  const points = POSITIONS.slice(from).map((pos) => {
    const outcomes = pastRows.map((r) => now + Math.max(0, r[pos] - r[from])).sort((a, b) => a - b);
    return {
      pos,
      p10: quantile(outcomes, 0.1), p25: quantile(outcomes, 0.25), p50: quantile(outcomes, 0.5),
      p75: quantile(outcomes, 0.75), p90: quantile(outcomes, 0.9),
    };
  });
  return { from, points };
}
