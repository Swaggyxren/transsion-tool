import { useState, useEffect } from "react";
import { DeviceInfo, isMode } from "../lib/device";
import { adbShell } from "../lib/commands";

interface DeviceCardProps {
  device: DeviceInfo | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function DeviceCard({
  device,
  loading,
  onRefresh,
}: DeviceCardProps) {
  const state = device?.state;
  const profile = device?.profile;
  const connected = state != null && state.mode !== "none";
  const adbMode = isMode(device, "adb", "recovery", "sideload");
  const [serialBlurred, setSerialBlurred] = useState(true);
  const [adbSlot, setAdbSlot] = useState("");

  useEffect(() => {
    if (adbMode && !adbSlot) {
      adbShell("getprop ro.boot.slot_suffix").then((out) => {
        const s = out.trim().replace("_", "");
        if (s) setAdbSlot(s);
      }).catch(() => {});
    }
  }, [adbMode]);

  const slot = adbMode ? adbSlot : (state?.current_slot ?? "");
  const osLabel = state?.os_version
  ? state.os_version
  : state?.android_version
  ? `Android ${state.android_version}`
  : null;

  return (
    <div className="bg-surface border border-outline grid grid-cols-1 md:grid-cols-10 min-h-[320px] p-0 overflow-hidden relative group">
      {/* Left: Device Mockup */}
      <div className="col-span-1 md:col-span-4 bg-background flex items-center justify-center p-8 relative overflow-hidden border-b md:border-b-0 md:border-r border-outline min-h-[250px] md:min-h-0">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: "radial-gradient(#27272a 1px, transparent 1px)", 
            backgroundSize: "16px 16px" 
          }}
        ></div>
        <div className={`relative w-32 h-64 border-4 rounded-[24px] bg-surface flex flex-col p-2 shadow-2xl transition-colors duration-300 ${
          connected ? "border-green-500/70 shadow-green-500/10" : "border-red-500/50 shadow-red-500/10"
        }`}>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#1a1a1e] z-10 ring-1 ring-outline" />
          <div className="flex-1 bg-background rounded-[12px] flex items-center justify-center flex-col gap-2 p-2 overflow-hidden">
            <span className={`material-symbols-outlined text-4xl ${connected ? "text-primary" : "text-primary opacity-20"}`}>smartphone</span>
            {connected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="text-[10px] text-green-500 font-mono font-bold">ONLINE</div>
                {osLabel && <div className="text-[8px] text-primary font-mono select-none opacity-80">{osLabel}</div>}
              </>
            ) : (
              <div className="text-[10px] dark:text-white/40 text-black/40 font-mono">DISCONNECTED</div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Device Info */}
      <div className="col-span-1 md:col-span-6 p-8 flex flex-col justify-between w-full">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-mono">TARGET_DEVICE_IDENTITY</h2>
              <p className="text-[10px] font-mono text-on-surface-variant/60 mt-1">Detected hardware specifications</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase font-bold ${
                connected
                  ? "bg-green-500/10 border-green-500/20 text-green-500" 
                  : "dark:bg-white/5 dark:border-white/10 dark:text-white/40 bg-black/5 border-black/10 text-black/40"
              }`}>
                {connected ? "CONNECTED" : "DISCONNECTED"}
              </span>
              <button
                onClick={onRefresh}
                disabled={loading}
                className="w-8 h-8 rounded border border-outline bg-background hover:bg-primary/20 text-on-surface flex items-center justify-center transition-all disabled:opacity-40 active:scale-95 duration-100"
              >
                <span className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}>sync</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 border-b border-outline pb-1">
              <span className="text-on-surface-variant">OEM</span>
              <span className="text-on-surface text-right font-medium">{profile?.oem || state?.manufacturer || "Generic"}</span>
            </div>
            <div className="grid grid-cols-2 border-b border-outline pb-1">
              <span className="text-on-surface-variant">MODEL</span>
              <span className="text-on-surface text-right font-medium">{state?.model || state?.product || "Unknown"}</span>
            </div>
            <div className="grid grid-cols-2 border-b border-outline pb-1">
              <span className="text-on-surface-variant">ANDROID_VER</span>
              <span className="text-primary text-right font-bold">
                {state?.android_version ? `${state.android_version} (API ${state.api_level})` : "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-2 border-b border-outline pb-1">
              <span className="text-on-surface-variant">SERIAL_NUM</span>
              <button
                onClick={() => setSerialBlurred(!serialBlurred)}
                className="text-on-surface text-right font-medium truncate max-w-[150px] inline-block ml-auto hover:text-primary transition-all"
              >
                <span className={serialBlurred ? "blur-sm select-none" : ""}>
                  {state?.serial || "N/A"}
                </span>
              </button>
            </div>
            <div className="grid grid-cols-2 border-b border-outline pb-1">
              <span className="text-on-surface-variant">ACTIVE_SLOT</span>
              <span className="text-on-surface text-right font-medium">{slot ? `_${slot}` : "N/A"}</span>
            </div>
          </div>
        </div>

        {state?.battery_level != null && (
          <div className="mt-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">BATTERY_CAPACITY</span>
              <span className="text-xs font-mono text-on-surface font-bold">{state.battery_level}%</span>
            </div>
            <div className="w-full h-2 bg-surface border border-outline">
              <div className="h-full bg-green-500" style={{ width: `${state.battery_level}%` }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
