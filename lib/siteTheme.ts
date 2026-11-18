export const DEFAULT_SITE_THEME = {
  red: "#5C3317",
  redDk: "#3A1F0A",
  redLt: "#8B5230",
  gold: "#C9952A",
  goldLt: "#E8B84B",
  goldDk: "#A67820",
  cream: "#FDFAF6",
  cream2: "#F2E8D9",
  cream3: "#EAD9C0",
  dark: "#1A1410",
  mid: "#3D3530",
  gray: "#6B5F57",
  white: "#FFFFFF",
} as const;

export type SiteTheme = Record<keyof typeof DEFAULT_SITE_THEME, string>;

export const SITE_THEME_LABELS: Record<keyof typeof DEFAULT_SITE_THEME, string> = {
  red: "Primary brown",
  redDk: "Deep brown",
  redLt: "Light brown",
  gold: "Primary gold",
  goldLt: "Light gold",
  goldDk: "Dark gold",
  cream: "Page background",
  cream2: "Soft surface",
  cream3: "Borders and dividers",
  dark: "Main text",
  mid: "Body text",
  gray: "Muted text",
  white: "White",
};
