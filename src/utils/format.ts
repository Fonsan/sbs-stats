export const KYIV_TZ = "Europe/Kyiv";

// Data timestamp as "DD.MM.YYYY HH:MM Kyiv time (HH:MM UTC)"; Kyiv matches the app's notion of "today".
// compact: "DD.MM.YYYY HH:MM Kyiv (HH:MM UTC)" for tight spaces like the PNG caption
export function formatDataTime(d: Date, compact = false): string {
  const kyiv = d.toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: KYIV_TZ,
  }).replace(",", "");
  const utc = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${kyiv} Kyiv${compact ? "" : " time"} (${utc} UTC)`;
}

// "Personnel Casualties — Hit" → "personnel-casualties-hit"
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
