import { useEffect, useRef, useState } from "react";
import { ThemeProvider, useTheme } from "./theme/ThemeProvider";
import { m3Presets } from "./theme/presets";
import NavRail from "./components/NavRail";
import Console from "./components/Console";
import { ConsoleProvider, useConsole } from "./lib/console";
import Dashboard from "./pages/Dashboard";
import AdbPanel from "./pages/AdbPanel";
import FastbootPanel from "./pages/FastbootPanel";
import FlashPanel from "./pages/FlashPanel";
import RootPanel from "./pages/RootPanel";
import ToolsPanel from "./pages/ToolsPanel";
import AppsPanel from "./pages/AppsPanel";
import DocsPanel from "./pages/DocsPanel";
import { detectDevice, DeviceInfo } from "./lib/device";

type Page = "dashboard" | "adb" | "fastboot" | "flash" | "root" | "apps" | "tools" | "docs";

function AppInner() {
  const [page, setPage] = useState<Page>("dashboard");
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => localStorage.getItem("disclaimer_accepted") === "true");
  const [disclaimerDontShow, setDisclaimerDontShow] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const { write } = useConsole();
  const {
    mode, setMode,
    schemeSource, setSchemeSource,
    presetIndex, setPresetIndex,
    customColor, setCustomColor,
    seedColor,
  } = useTheme();

  const refresh = async () => {
    setLoading(true);
    try {
      const info = await detectDevice();
      setDevice(info);
    } catch (e) {
      write(`Device detection failed: ${e}`, "stderr");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "adb":
        return <AdbPanel device={device} loading={loading} onRefresh={refresh} />;
      case "fastboot":
        return <FastbootPanel device={device} loading={loading} onRefresh={refresh} />;
      case "flash":
        return <FlashPanel device={device} loading={loading} onRefresh={refresh} />;
      case "root":
        return <RootPanel />;
      case "apps":
        return <AppsPanel device={device} />;
      case "tools":
        return <ToolsPanel device={device} />;
      case "docs":
        return <DocsPanel />;
      case "dashboard":
      default:
        return <Dashboard device={device} loading={loading} onRefresh={refresh} />;
    }
  };

  return (
      <div className="flex h-screen w-screen bg-background text-on-surface">
      <NavRail active={page} onChange={setPage} />
      <div className="flex flex-col flex-1 min-w-0 ml-64 relative h-screen">
        {/* Header Bar */}
        <header className="flex justify-between items-center w-full px-8 h-16 bg-background border-b border-outline z-40">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-xl">analytics</span>
            <span className="text-xs font-bold tracking-widest text-on-surface uppercase font-mono">OPERATIONAL_STATUS</span>
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded border ${
              device?.state.mode === "adb"
                ? "bg-green-500/10 border-green-500/20 text-green-500"
                : device?.state.mode && ["bootloader", "fastbootd"].includes(device.state.mode)
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : device?.state.mode && ["recovery", "sideload"].includes(device.state.mode)
                ? "bg-primary/10 border-primary/20 text-primary"
                : "dark:bg-white/5 dark:border-white/10 dark:text-white/40 bg-black/5 border-black/10 text-black/40"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                device?.state.mode === "adb"
                  ? "bg-green-500 animate-pulse"
                  : device?.state.mode && ["bootloader", "fastbootd"].includes(device.state.mode)
                  ? "bg-amber-500 animate-pulse"
                  : device?.state.mode && ["recovery", "sideload"].includes(device.state.mode)
                  ? "bg-primary animate-pulse"
                  : "dark:bg-white/30 bg-black/30"
              }`}></div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                {device?.state.mode ? `${device.state.mode} mode` : "No Device"}
              </span>
            </div>
          </div>
          {/* Trailing Controls */}
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-on-surface-variant opacity-60">
              {device?.state.model ? `Target: ${device.state.model}` : "No device connected"}
            </div>

            {/* Theme Picker */}
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeOpen(!themeOpen)}
                className="w-8 h-8 rounded bg-surface border border-outline text-on-surface hover:bg-primary/20 hover:border-primary transition-all flex items-center justify-center active:scale-95 duration-100"
                title="Theme"
              >
                <span className="material-symbols-outlined text-sm">palette</span>
              </button>

              {themeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                  <div className="absolute right-0 top-10 z-50 w-64 bg-surface border border-outline rounded shadow-2xl p-4 space-y-3">
                    {/* Mode */}
                    <div className="flex gap-1">
                      {(["dark", "light", "system"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={`flex-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                            mode === m ? "bg-primary text-on-primary" : "bg-background text-on-surface-variant hover:bg-primary/20"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {m3Presets.map((p, i) => (
                        <button
                          key={p.name}
                          onClick={() => { setSchemeSource("preset"); setPresetIndex(i); }}
                          className={`w-full aspect-square rounded border-2 transition-all ${
                            schemeSource === "preset" && presetIndex === i
                              ? "border-primary scale-110"
                              : "border-outline hover:border-primary"
                          }`}
                          style={{ backgroundColor: p.seed }}
                          title={p.name}
                        />
                      ))}
                    </div>

                    {/* Custom color */}
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => { setSchemeSource("custom"); setCustomColor(e.target.value); }}
                        className="w-8 h-8 rounded cursor-pointer border border-outline bg-transparent"
                      />
                      <span className="text-[10px] font-mono text-on-surface-variant">Custom</span>
                      {schemeSource === "monet" && (
                        <button
                          onClick={() => setSchemeSource("preset")}
                          className="ml-auto text-[10px] font-mono text-primary hover:underline"
                        >
                          Clear monet
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={refresh}
              disabled={loading}
              className="w-8 h-8 rounded bg-surface border border-outline text-on-surface hover:bg-primary/20 hover:border-primary transition-all flex items-center justify-center disabled:opacity-40 active:scale-95 duration-100"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}>sync</span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8 flex flex-col gap-6 bg-background custom-scrollbar">
          {renderPage()}
        </main>
        <Console />
      </div>

      {/* Disclaimer overlay */}
      {!disclaimerAccepted && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface border border-outline rounded p-6 shadow-2xl mx-4">
            <h2 className="text-lg font-bold text-on-surface font-mono mb-1">Disclaimer</h2>
            <p className="text-[10px] font-mono text-on-surface-variant/60 mb-4">Transsion Tool v1.2.0-dev</p>

            <div className="bg-background border border-outline rounded p-4 mb-4 text-xs font-mono text-on-surface leading-relaxed space-y-2 max-h-48 overflow-y-auto">
              <p>This software is provided &quot;as is&quot;, without warranty of any kind, express or implied.</p>
              <p>By using this tool, you acknowledge that:</p>
              <ul className="list-disc list-inside space-y-1 text-on-surface-variant">
                <li>Modifying device firmware carries inherent risks, including permanent damage (bricking).</li>
                <li>The developers assume no liability for any damage, data loss, or voided warranties.</li>
                <li>You are solely responsible for understanding the actions you perform.</li>
                <li>Always ensure you have proper backups before proceeding.</li>
              </ul>
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={disclaimerDontShow}
                onChange={(e) => setDisclaimerDontShow(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-[11px] font-mono text-on-surface-variant">Don&apos;t show this again</span>
            </label>

            <button
              onClick={() => {
                if (disclaimerDontShow) localStorage.setItem("disclaimer_accepted", "true");
                setDisclaimerAccepted(true);
              }}
              className="w-full py-2.5 rounded bg-primary text-on-primary text-sm font-bold font-mono hover:brightness-110 transition-all active:scale-[0.98]"
            >
              I Understand — Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ConsoleProvider>
        <AppInner />
      </ConsoleProvider>
    </ThemeProvider>
  );
}

export default App;
