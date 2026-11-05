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
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
`;
