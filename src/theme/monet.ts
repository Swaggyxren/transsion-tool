import {
  argbFromHex,
  themeFromSourceColor,
  applyTheme,
  type Theme,
} from "@material/material-color-utilities";

export function generateM3Theme(seedColor: string, isDark: boolean) {
  const argb = argbFromHex(seedColor);
  const theme = themeFromSourceColor(argb);
  return { argb, theme, isDark };
}

function hexFromArgb(argb: number): string {
  const r = (argb >> 16) & 0xff;
  const g = (argb >> 8) & 0xff;
  const b = argb & 0xff;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// Map M3 color roles to their palette keys
const COLOR_MAP: Record<string, string> = {
  primary: "primary",
  "on-primary": "onPrimary",
  "primary-container": "primaryContainer",
  "on-primary-container": "onPrimaryContainer",
  secondary: "secondary",
  "on-secondary": "onSecondary",
  "secondary-container": "secondaryContainer",
  "on-secondary-container": "onSecondaryContainer",
  tertiary: "tertiary",
  "on-tertiary": "onTertiary",
  "tertiary-container": "tertiaryContainer",
  "on-tertiary-container": "onTertiaryContainer",
  error: "error",
  "on-error": "onError",
  "error-container": "errorContainer",
  "on-error-container": "onErrorContainer",
  background: "background",
  "on-background": "onBackground",
  surface: "surface",
  "on-surface": "onSurface",
  "surface-variant": "surfaceVariant",
  "on-surface-variant": "onSurfaceVariant",
  outline: "outline",
  "outline-variant": "outlineVariant",
  shadow: "shadow",
  "surface-tint": "surfaceTint",
  "surface-dim": "surfaceDim",
  "surface-bright": "surfaceBright",
  "surface-container-lowest": "surfaceContainerLowest",
  "surface-container-low": "surfaceContainerLow",
  "surface-container": "surfaceContainer",
  "surface-container-high": "surfaceContainerHigh",
  "surface-container-highest": "surfaceContainerHighest",
};

export function applyM3Theme(seedColor: string, isDark: boolean) {
  const argb = argbFromHex(seedColor);
  const theme = themeFromSourceColor(argb);

  // Let the library set core colors
  applyTheme(theme, { target: document.documentElement, dark: isDark });

  // Also set the extended palette manually for full coverage
  const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
  const root = document.documentElement;
  for (const [cssName, paletteKey] of Object.entries(COLOR_MAP)) {
    const value = (scheme as unknown as Record<string, number>)[paletteKey];
    if (value !== undefined) {
      root.style.setProperty(`--md-sys-color-${cssName}`, hexFromArgb(value));
    }
  }
}
