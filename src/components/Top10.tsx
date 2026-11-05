import type { DailyDataPoint } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { FONTS } from "@/theme";

interface Props {
  title: string;
  data: DailyDataPoint[];
  wfull: boolean;
}

const formatDate = (v: string) => { const [y, m, d] = v.split("-"); return `${d}.${m}.${y}`; };

export function Top10({ title, data, wfull }: Props) {
  const { theme: t } = useTheme();

  const cell = {
    padding: "6px 8px",
    borderBottom: `1px solid ${t.surfaceBorder}`,
  };
  const headCell = {
    ...cell,
    fontFamily: FONTS.display,
    fontWeight: 700,
    fontSize: 10,
    color: t.textMuted,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
  };

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
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, color: t.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>
        {title}
      </div>
      {data.length === 0 ? (
        <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: t.textMuted, padding: "12px 8px" }}>
          No data
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.mono, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...headCell, textAlign: "left", width: 40 }}>#</th>
              <th style={{ ...headCell, textAlign: "left" }}>Date</th>
              <th style={{ ...headCell, textAlign: "right" }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              // Today's row is highlighted by background so its rank stands out at a glance
              const rowCell = d.is_today
                ? { ...cell, background: t.accent + "2e", borderBottom: `1px solid ${t.accent}66` }
                : cell;
              return (
                <tr key={d.date}>
                  <td style={{ ...rowCell, color: d.is_today ? t.text : t.textMuted, fontWeight: d.is_today ? 700 : 400, borderLeft: d.is_today ? `3px solid ${t.accent}` : undefined }}>{i + 1}</td>
                  <td style={{ ...rowCell, color: t.text }}>
                    {formatDate(d.date)}
                    {d.is_today && (
                      <span style={{
                        marginLeft: 8, padding: "1px 6px", borderRadius: 3,
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                        background: t.accent, color: "#ffffff",
                      }}>TODAY</span>
                    )}
                  </td>
                  <td style={{ ...rowCell, textAlign: "right", color: i === 0 ? t.primary : t.text, fontWeight: i === 0 || d.is_today ? 700 : 400 }}>
                    {d.value.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
