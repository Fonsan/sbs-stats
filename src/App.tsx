import { useState, useEffect, useRef } from "react";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { DatabaseProvider } from "@/context/DatabaseContext";
import { useDatabaseContext } from "@/context/useDatabaseContext";
import { DailyPage } from "@/pages/DailyPage";
import { HourlyPage } from "@/pages/HourlyPage";
import { MonthlyPage } from "@/pages/MonthlyPage";
import { SubdivisionsPage } from "@/pages/SubdivisionsPage";
import { Top10Page } from "@/pages/Top10Page";
import { REFRESH_INTERVAL_MS } from "@/hooks/useDatabase";
import type { Page } from "@/types";
import { FONTS, GLOBAL_CSS } from "@/theme";
import { formatDataTime } from "@/utils/format";

// Countdown ring that ticks down to the next auto-refresh
function RefreshIndicator({
  lastRefreshed,
  refreshCount,
  onRefresh,
  isLoading,
}: {
  lastRefreshed: Date | null;
  refreshCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const { theme: t } = useTheme();
  const [progress, setProgress] = useState(1); // 1 = full, 0 = empty
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_INTERVAL_MS / 1000);
  const startRef = useRef<number>(Date.now());

  // Reset countdown whenever lastRefreshed changes
  useEffect(() => {
    startRef.current = Date.now();
    setProgress(1);
    setSecondsLeft(REFRESH_INTERVAL_MS / 1000);
  }, [lastRefreshed, refreshCount]);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, REFRESH_INTERVAL_MS - elapsed);
      setProgress(remaining / REFRESH_INTERVAL_MS);
      setSecondsLeft(Math.ceil(remaining / 1000));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const lastUpdatedStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  // SVG ring params
  const size = 16;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;

  return (
    <div
      className="app-refresh"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginLeft: 8,
        padding: "5px 10px 5px 8px",
        border: `1px solid ${t.border}`,
        borderRadius: 4,
        background: t.bgAlt,
        cursor: "pointer",
        userSelect: "none",
        transition: "all 0.15s",
      }}
      onClick={!isLoading ? onRefresh : undefined}
      title={`Last checked: ${lastUpdatedStr} · Click to refresh now`}
    >
      {/* Countdown ring */}
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.border}
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={isLoading ? t.accent : t.primary}
          strokeWidth={stroke}
          strokeDasharray={`${isLoading ? circ * 0.25 : dash} ${circ}`}
          strokeLinecap="round"
          style={isLoading ? { animation: "spin 1s linear infinite" } : { transition: "stroke-dasharray 0.8s linear" }}
        />
      </svg>

      {/* Countdown text */}
      <span className="app-refresh-text" style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.textMuted, lineHeight: 1, minWidth: 82 }}>
        {isLoading ? "refreshing…" : `refresh in ${formatTime(secondsLeft)}`}
      </span>
    </div>
  );
}

// Floating button that appears after scrolling down and jumps back to the top
function ScrollTopButton() {
  const { theme: t } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      aria-label="Back to top"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 1000,
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: `1px solid ${t.primary}`,
        background: t.primary,
        color: "#ffffff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.2s, transform 0.2s",
      }}
    >
      <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor"
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" />
      </svg>
    </button>
  );
}

function AppInner() {
  const { mode, theme: t, toggle } = useTheme();
  const [page, setPage] = useState<Page>("hourly");

  // On narrow screens the nav row scrolls sideways; keep the active page button visible
  useEffect(() => {
    document.querySelector(".app-nav [data-active='true']")
      ?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [page]);
  const { loadState, refresh, lastRefreshed, refreshCount, dataCollectedAt } = useDatabaseContext();

  const navBtn = (target: Page, label: string) => (
    <button
      key={target}
      data-active={page === target}
      onClick={() => setPage(target)}
      style={{
        background: page === target ? t.primary : "transparent",
        color: page === target ? "#ffffff" : t.textMuted,
        border: `1px solid ${page === target ? t.primary : t.border}`,
        borderRadius: 4,
        padding: "5px 14px",
        fontFamily: FONTS.display,
        fontSize: 12,
        fontWeight: page === target ? 700 : 400,
        cursor: "pointer",
        letterSpacing: "0.04em",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <style>{GLOBAL_CSS(t)}
        {`@keyframes spin { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -${2 * Math.PI * 11}px; } }`}
        {/* Header layout: one row on desktop; on narrow screens the nav moves to its own scrollable row */}
        {`
          .app-header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; padding: 8px 24px; min-height: 52px; }
          .app-brand { order: 1; margin-right: auto; min-width: 0; }
          .app-nav { order: 2; display: flex; gap: 8px; align-items: center; }
          .app-controls { order: 3; display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
          @media (max-width: 1200px) {
            .app-header { padding: 8px 12px; }
            .app-brand { flex: 1 1 0; }
            .app-controls { order: 2; }
            /* min-width: 0 lets the nav shrink to the screen width and scroll instead of widening the page */
            .app-nav { order: 3; flex-basis: 100%; min-width: 0; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
            .app-nav::-webkit-scrollbar { display: none; }
            .app-nav button { flex-shrink: 0; }
          }
          @media (max-width: 600px) {
            /* Phones: the data time gets its own line, the refresh button shows only its ring */
            .app-datatime { display: block; }
            .app-datatime-sep { display: none; }
            .app-refresh-text { display: none; }
            .app-refresh { margin-left: 0 !important; }
          }
        `}
      </style>
      <div style={{ minHeight: "100vh", background: t.bg }}>

        {/* Header */}
        <header className="app-header" style={{
          borderBottom: `1px solid ${t.border}`,
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          // Must stay above hovered chart cards (.hourly-card:hover uses z-index 100)
          zIndex: 1000,
          background: t.headerBg,
        }}>
          {/* Brand */}
          <div className="app-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: t.accent, animation: "blink 2s infinite",
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{
                fontFamily: FONTS.display,
                fontSize: 13,
                fontWeight: 700,
                color: t.text,
                letterSpacing: "0.06em",
                lineHeight: 1.1,
              }}>
                SBS STATISTICS
              </span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.textMuted, lineHeight: 1.1 }}>
                Data source:{" "}
                <a href="https://sbs-group.army" target="_blank" rel="noopener noreferrer"
                  style={{ color: t.primary, textDecoration: "none" }}>
                  sbs-group.army
                </a>
                {dataCollectedAt && (
                  <span className="app-datatime" title={`Your local time: ${dataCollectedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`}>
                    <span className="app-datatime-sep">{" · "}</span>
                    {"data from "}
                    <span style={{ color: t.text }}>{formatDataTime(dataCollectedAt)}</span>
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="app-nav">
            {navBtn("hourly", "HOURLY")}
            {navBtn("daily", "DAILY")}
            {navBtn("monthly", "MONTHLY")}
            {navBtn("subdivisions", "SUBDIVISIONS")}
            {navBtn("top10", "RECORDS")}
          </nav>

          {/* Refresh indicator + theme toggle */}
          <div className="app-controls">
            {/* Refresh indicator */}
            <RefreshIndicator
              lastRefreshed={lastRefreshed}
              refreshCount={refreshCount}
              onRefresh={refresh}
              isLoading={loadState === "loading"}
            />

            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
              style={{
                background: t.bgAlt,
                border: `1px solid ${t.border}`,
                borderRadius: 4,
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                color: t.text,
                transition: "all 0.15s",
              }}
            >
              {mode === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </header>

        {/* Main */}
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 20px 64px" }}>
          {page === "daily"   && <DailyPage refreshKey={refreshCount} />}
          {page === "hourly"  && <HourlyPage refreshKey={refreshCount} />}
          {page === "monthly" && <MonthlyPage refreshKey={refreshCount} />}
          {page === "subdivisions" && <SubdivisionsPage refreshKey={refreshCount} />}
          {page === "top10"   && <Top10Page refreshKey={refreshCount} />}
        </main>
        <ScrollTopButton />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <AppInner />
      </DatabaseProvider>
    </ThemeProvider>
  );
}
