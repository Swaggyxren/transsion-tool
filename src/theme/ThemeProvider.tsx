import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { applyM3Theme } from "./monet";
import { m3Presets } from "./presets";
import { getWallpaperColor } from "../lib/commands";

type ThemeMode = "light" | "dark" | "system";
type ColorScheme = "monet" | "preset" | "custom";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  schemeSource: ColorScheme;
  setSchemeSource: (s: ColorScheme) => void;
  presetIndex: number;
  setPresetIndex: (i: number) => void;
  customColor: string;
  setCustomColor: (c: string) => void;
  isDark: boolean;
  seedColor: string;
  refreshMonet: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [schemeSource, setSchemeSource] = useState<ColorScheme>("preset");
  const [presetIndex, setPresetIndex] = useState(0);
  const [customColor, setCustomColor] = useState("#4A5268");
  const [monetColor, setMonetColor] = useState("#4A5268");

  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const seedColor =
    schemeSource === "monet"
      ? monetColor
      : schemeSource === "custom"
      ? customColor
      : m3Presets[presetIndex]?.seed ?? "#4A5268";

  const refreshMonet = useCallback(async () => {
    try {
      const color = await getWallpaperColor();
      setMonetColor(color);
    } catch (e) {
      console.error("Monet fetch failed:", e);
    }
  }, []);

  useEffect(() => {
    applyM3Theme(seedColor, isDark);
    document.documentElement.classList.toggle("dark", isDark);
    if (schemeSource === "monet") {
      refreshMonet();
    }
  }, [seedColor, isDark, schemeSource, refreshMonet]);

  useEffect(() => {
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyM3Theme(seedColor, mq.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [mode, seedColor]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        schemeSource,
        setSchemeSource,
        presetIndex,
        setPresetIndex,
        customColor,
        setCustomColor,
        isDark,
        seedColor,
        refreshMonet,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
