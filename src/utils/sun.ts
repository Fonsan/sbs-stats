import SunCalc from "suncalc";
import { KYIV_TZ } from "@/utils/format";

const KYIV_LAT = 50.4501;
const KYIV_LON = 30.5234;

// Kyiv local time of a Date as decimal hours (07:30 → 7.5), matching the hourly charts' x-axis
function kyivHour(d: Date): number {
  const [h, m] = d
    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: KYIV_TZ })
    .split(":")
    .map(Number);
  return h + m / 60;
}

// Today's sunrise/sunset in Kyiv as decimal Kyiv hours; null if the sun doesn't rise/set
export function kyivSunTimes(now: Date = new Date()): { sunrise: number; sunset: number } | null {
  // Noon UTC of today's Kyiv date, so the calculation never picks the neighbouring day near midnight
  const kyivDate = now.toLocaleDateString("sv-SE", { timeZone: KYIV_TZ });
  const { sunrise, sunset } = SunCalc.getTimes(new Date(`${kyivDate}T12:00:00Z`), KYIV_LAT, KYIV_LON);
  if (isNaN(sunrise.getTime()) || isNaN(sunset.getTime())) return null;
  return { sunrise: kyivHour(sunrise), sunset: kyivHour(sunset) };
}

// 7.5 → "07:30"
export function formatHour(h: number): string {
  const total = Math.round(h * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
