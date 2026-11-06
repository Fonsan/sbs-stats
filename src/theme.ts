// ─── Theme tokens ─────────────────────────────────────────────────────────────
// PT Sans is widely used in Ukrainian government / military digital platforms.
// PT Mono provides clean monospaced data display.

export const FONTS = {
  display: "'PT Sans', 'Helvetica Neue', Arial, sans-serif",
  mono: "'PT Mono', 'Courier New', monospace",
} as const;

export interface Theme {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceBorder: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  accent: string;
  muted: string;
  headerBg: string;
  chartGrid: string;
  bgImportant: string;
  textImportant: string;
}

export const LIGHT: Theme = {
  bg:           "#eef0f3",
  bgAlt:        "#e3e6eb",
  surface:      "#ffffff",
  surfaceBorder:"#d3d8df",
  border:       "#b9c0ca",
  text:         "#0b1220",
  textMuted:    "#2a313b",
  textFaint:    "#7a8391",
  primary:      "#175f8f",   // steel blue — readable on white
  accent:       "#e3170a",   // strong red — today / current highlight
  muted:        "#4a8236",
  headerBg:     "rgba(238,240,243,0.92)",
  chartGrid:    "#dde1e7",
  bgImportant:  "#e3170a",
  textImportant:  "#ffffff",
};

export const DARK: Theme = {
  bg:           "#060910",
  bgAlt:        "#0f1726",
  surface:      "#0f1726",
  surfaceBorder:"#25334f",
  border:       "#2c3b5a",
  text:         "#eef2f7",
  textMuted:    "#cbd3df",
  textFaint:    "#5b6779",
  primary:      "#00d4ff",
  accent:       "#ff5f1f",
  muted:        "#7096d1",
  headerBg:     "rgba(6,9,16,0.85)",
  chartGrid:    "#202c45",
  bgImportant:  "#ff5f1f",
  textImportant:  "#ffffff",  
};

export const GLOBAL_CSS = (t: Theme) => `
  @import url('https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=PT+Mono&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: ${t.bg};
    color: ${t.text};
    font-family: ${FONTS.display};
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${t.bgAlt}; }
  ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
  /* Hover feedback for all buttons; uses properties the inline button styles don't set.
     The inset shadow tints the background (inline background can't be overridden by CSS). */
  button:not(:disabled):hover, .app-refresh:hover {
    box-shadow: 0 0 0 1px ${t.primary}, inset 0 0 0 100px ${t.primary}2e;
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
  button:not(:disabled):active, .app-refresh:active { transform: translateY(0); filter: brightness(0.95); }
  button:focus-visible { outline: 2px solid ${t.primary}; outline-offset: 2px; }
  /* Chart PNG export: caption/context only visible while a card is being captured;
     the fade-in animation is switched off so the capture isn't taken mid-fade */
  .chart-export-only { display: none; }
  .exporting span.chart-export-only { display: inline; }
  .exporting div.chart-export-only { display: block; }
  .exporting { animation: none !important; }  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
`;
