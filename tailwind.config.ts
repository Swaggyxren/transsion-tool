import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "background": "var(--md-sys-color-background, #19191c)",
        "on-background": "var(--md-sys-color-on-background, #cdcdd0)",
        "surface": "var(--md-sys-color-surface, #222225)",
        "on-surface": "var(--md-sys-color-on-surface, #cdcdd0)",
        "surface-dim": "var(--md-sys-color-surface-dim, #161619)",
        "surface-bright": "var(--md-sys-color-surface-bright, #3a3a3d)",
        "surface-container-lowest": "var(--md-sys-color-surface-container-lowest, #101013)",
        "surface-container-low": "var(--md-sys-color-surface-container-low, #1e1e21)",
        "surface-container": "var(--md-sys-color-surface-container, #222225)",
        "surface-container-high": "var(--md-sys-color-surface-container-high, #2c2c30)",
        "surface-container-highest": "var(--md-sys-color-surface-container-highest, #37373a)",
        "on-surface-variant": "var(--md-sys-color-on-surface-variant, #bebec2)",
        "outline": "var(--md-sys-color-outline, #3d3d40)",
        "outline-variant": "var(--md-sys-color-outline-variant, #414145)",
        "primary": "var(--md-sys-color-primary, #b0a7ff)",
        "on-primary": "var(--md-sys-color-on-primary, #2b1f6e)",
        "primary-container": "var(--md-sys-color-primary-container, #9289eb)",
        "on-primary-container": "var(--md-sys-color-on-primary-container, #1a0e5c)",
        "secondary": "var(--md-sys-color-secondary, #ffb95f)",
        "on-secondary": "var(--md-sys-color-on-secondary, #1e1b16)",
        "tertiary": "var(--md-sys-color-tertiary, #5fa3ff)",
        "on-tertiary": "var(--md-sys-color-on-tertiary, #003258)",
        "error": "var(--md-sys-color-error, #ffb4ab)",
        "on-error": "var(--md-sys-color-on-error, #690005)",
        "error-container": "var(--md-sys-color-error-container, #93000a)",
        "on-error-container": "var(--md-sys-color-on-error-container, #ffdad6)",
        "shadow": "var(--md-sys-color-shadow, #000000)",
      },
      borderRadius: {
        m3: "8px",
        "m3-sm": "4px",
        "m3-full": "9999px",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
