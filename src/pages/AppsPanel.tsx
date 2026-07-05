import { useState } from "react";
import { DeviceInfo, isMode } from "../lib/device";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirmDialog } from "../lib/useConfirmDialog";
import { useConsole } from "../lib/console";
import { adbShell } from "../lib/commands";

interface AppsPanelProps {
  device: DeviceInfo | null;
}

interface Pkg {
  name: string;
  disabled: boolean;
  isSystem: boolean;
}

export default function AppsPanel({ device }: AppsPanelProps) {
  const { confirm, requestConfirm, dismissConfirm, executeConfirm } =
    useConfirmDialog();
  const { write } = useConsole();
  const adbReady = isMode(device, "adb", "recovery", "sideload");

  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [showSystem, setShowSystem] = useState(false);
  const [confirmPkg, setConfirmPkg] = useState<Pkg | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const all = await adbShell("pm list packages 2>/dev/null | sed 's/package://'");
      const disabled = await adbShell("pm list packages -d 2>/dev/null | sed 's/package://'");
      const system = await adbShell("pm list packages -s 2>/dev/null | sed 's/package://'");

      const allSet = new Set(all.split("\n").filter(Boolean));
      const disabledSet = new Set(disabled.split("\n").filter(Boolean));
      const systemSet = new Set(system.split("\n").filter(Boolean));

      const pkgs: Pkg[] = Array.from(allSet).map((name) => ({
        name,
        disabled: disabledSet.has(name),
        isSystem: systemSet.has(name),
      }));
      pkgs.sort((a, b) => a.name.localeCompare(b.name));
      setPackages(pkgs);
      write(`Loaded ${pkgs.length} packages`, "info");
    } catch (e) {
      write(`Failed to list packages: ${e}`, "stderr");
    } finally {
      setLoading(false);
    }
  };

  const togglePackage = async (pkg: Pkg) => {
    if (!pkg.disabled && pkg.isSystem) {
      setConfirmPkg(pkg);
      requestConfirm(
        "Disable System App",
        `pm disable-user --user 0 ${pkg.name}`,
        `Disable system app "${pkg.name}"?`,
        "This is a SYSTEM application. Disabling it can cause instability, break features, or prevent the device from booting properly. Only proceed if you are certain.",
        async () => {
          try {
            await adbShell(`pm disable-user --user 0 ${pkg.name}`);
            write(`Disabled ${pkg.name}`, "stdout");
            setPackages((prev) => prev.map((p) => (p.name === pkg.name ? { ...p, disabled: true } : p)));
          } catch (e) {
            write(`Failed to disable ${pkg.name}: ${e}`, "stderr");
          }
        }
      );
      return;
    }

    try {
      if (pkg.disabled) {
        await adbShell(`pm enable --user 0 ${pkg.name}`);
        write(`Enabled ${pkg.name}`, "stdout");
      } else {
        await adbShell(`pm disable-user --user 0 ${pkg.name}`);
        write(`Disabled ${pkg.name}`, "stdout");
      }
      setPackages((prev) =>
        prev.map((p) => (p.name === pkg.name ? { ...p, disabled: !p.disabled } : p))
      );
    } catch (e) {
      write(`Failed to toggle ${pkg.name}: ${e}`, "stderr");
    }
  };

  const uninstallPackage = (pkg: Pkg) => {
    requestConfirm(
      "Uninstall Package",
      `pm uninstall -k --user 0 ${pkg.name}`,
      `Uninstall "${pkg.name}" for current user?`,
      pkg.isSystem
        ? "⚠️  SYSTEM APP — Uninstalling can cause instability, boot loops, or soft-brick the device. Make absolutely sure you know what you're doing."
        : "The app will be uninstalled for the current user. It can be reinstalled later if needed.",
      async () => {
        try {
          await adbShell(`pm uninstall -k --user 0 ${pkg.name}`);
          write(`Uninstalled ${pkg.name}`, "stdout");
          setPackages((prev) => prev.filter((p) => p.name !== pkg.name));
        } catch (e) {
          write(`Failed to uninstall ${pkg.name}: ${e}`, "stderr");
        }
      }
    );
  };

  // Transsion debloat list from auto-transsion-debloater-v3.sh
  const debloatList = [
    "com.google.android.apps.nbu.files", "com.transsnet.store", "com.facemoji.lite.transsion",
    "com.transsion.carlcare", "com.transsion.aivoiceassistant", "com.transsion.mol",
    "com.talpa.hibrowser", "com.transsion.plat.appupdate", "com.transsion.mobilecloner",
    "com.transsion.magazineservice.xos", "com.transsion.statisticalsales", "com.transsion.letswitch",
    "com.transsion.cloudserver", "com.idea.questionnaire", "com.transsion.personalizedService.xos",
    "com.facebook.services", "com.facebook.appmanager", "com.facebook.system",
    "com.google.android.feedback", "com.transsion.tranengine", "com.transsion.chromecustomization",
    "com.transsion.phonemanager", "com.transsion.phonemaster", "com.transsion.tranvoicecommand",
    "com.transsion.smartrecognition", "com.transsion.folax", "com.transsion.livewallpaper.mecha",
    "com.transsion.livewallpaper.saibo", "com.transsion.childmode", "com.transsion.livewallpaper.airship",
    "com.transsion.livewallpaper.spacecraft", "com.transsion.audiosmartconnect",
    "com.transsion.childmode.resoverlay", "com.transsion.manualguide", "com.talpa.hiservice",
    "com.transsion.repaircard", "com.google.android.projection.gearhead", "com.transsion.pcconnect",
    "tech.palm.find", "com.mediatek.mdmconfig", "com.transsion.succ", "net.bat.store",
    "com.zaz.translate", "com.rlk.weathers", "com.transsion.wezone", "com.trassion.infinix.xclub",
    "com.talpa.share", "com.transsion.wifiplaytogether", "com.transsion.scanningrecharger",
    "com.transsion.magicshow", "com.transsion.health", "com.transsion.agingfunction",
    "com.transsion.globalsearch", "com.transsion.kolun.assistant",
  ];

  const runDebloat = () => {
    requestConfirm(
      "Transsion Debloater",
      "pm uninstall --user 0 <packages>",
      `This will uninstall ${debloatList.length} known Transsion bloatware packages.`,
      "⚠️  Transsion default keyboard will be removed. Install Gboard and set it as default FIRST.\n\nThis only uninstalls for the current user (--user 0) — a factory reset restores everything.\n\nIf you're unsure, close this and disable packages individually instead.",
      async () => {
        let ok = 0, skip = 0, fail = 0;
        for (const pkg of debloatList) {
          try {
            const exists = await adbShell(`pm path ${pkg} 2>/dev/null`);
            if (!exists.trim()) { skip++; continue; }
            await adbShell(`pm uninstall --user 0 ${pkg}`);
            write(`OK: ${pkg}`, "stdout");
            ok++;
          } catch {
            write(`FAIL: ${pkg}`, "stderr");
            fail++;
          }
        }
        write(`Debloat done — ${ok} removed, ${skip} skipped, ${fail} failed`, "info");
        // Refresh package list
        fetchPackages();
      }
    );
  };

  const filtered = packages.filter(
    (p) =>
      (showSystem || !p.isSystem) &&
      p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const thirdPartyCount = packages.filter((p) => !p.isSystem).length;
  const disabledCount = packages.filter((p) => p.disabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-2 border-b border-outline">
        <h2 className="text-2xl font-bold text-on-surface">App Manager</h2>
        <span className="text-[9px] font-mono text-on-surface-variant/40">
          {packages.length > 0
            ? `${thirdPartyCount} user · ${disabledCount} disabled`
            : ""}
        </span>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="Search packages..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 rounded bg-surface border border-outline text-on-surface text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={fetchPackages}
          disabled={loading || !adbReady}
          className="px-4 py-2 rounded bg-surface border border-outline text-on-surface hover:bg-primary/20 hover:border-primary text-xs font-mono font-bold transition-all disabled:opacity-30 active:scale-95 duration-100"
        >
          {loading ? "Loading..." : "List packages"}
        </button>
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant/60 cursor-pointer select-none px-2">
          <input type="checkbox" checked={showSystem} onChange={(e) => setShowSystem(e.target.checked)} className="accent-primary" />
          Show system
        </label>
      </div>

      {adbReady && (
        <div className="bg-surface border border-outline rounded p-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-sm text-[#f59e0b]">cleaning_services</span>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">Transsion Debloater</span>
            <p className="text-[9px] font-mono text-on-surface-variant/40 mt-0.5">Uninstall {debloatList.length} known bloatware packages for TOS7–TOS16 — script by Laynsb</p>
          </div>
          <button
            onClick={runDebloat}
            className="px-3 py-1.5 rounded border border-[#f59e0b]/30 bg-[#f59e0b]/5 hover:bg-[#f59e0b]/20 text-[10px] font-mono font-bold text-[#f59e0b] transition-all active:scale-95"
          >
            Run Debloater
          </button>
        </div>
      )}

      {!adbReady && (
        <div className="bg-surface border border-red-500/20 rounded p-4 text-center">
          <p className="text-sm text-red-400 font-mono">No ADB device connected. Connect a device in ADB mode to manage packages.</p>
        </div>
      )}

      {adbReady && packages.length === 0 && !loading && (
        <div className="bg-surface border border-outline rounded p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-2">grid_view</span>
          <p className="text-sm text-on-surface-variant/60 font-mono">Click "List packages" to load installed apps.</p>
        </div>
      )}

      {loading && (
        <div className="bg-surface border border-outline rounded p-6 text-center">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <span className="text-sm text-on-surface-variant font-mono">Loading packages...</span>
        </div>
      )}

      {packages.length > 0 && (
        <div className="border border-outline bg-surface rounded-sm overflow-hidden">
          <div className="max-h-[65vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm font-mono text-on-surface-variant/40">
                No packages match your search.
              </div>
            ) : (
              filtered.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`flex items-center gap-2 px-4 py-2 border-b border-outline/60 last:border-b-0 hover:bg-primary/5 transition-colors ${
                    pkg.disabled ? "opacity-50" : ""
                  }`}
                >
                  <span className="flex-1 text-xs font-mono text-on-surface truncate" title={pkg.name}>
                    {pkg.isSystem ? (
                      <span className="text-[9px] text-[#f59e0b] mr-1.5 font-bold">SYS</span>
                    ) : (
                      <span className="text-[9px] text-primary mr-1.5 font-bold">USR</span>
                    )}
                    {pkg.name}
                  </span>
                  {pkg.disabled && (
                    <span className="text-[9px] font-mono text-red-400 font-bold">DISABLED</span>
                  )}
                  <button
                    onClick={() => togglePackage(pkg)}
                    className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold transition-all active:scale-95 ${
                      pkg.disabled
                        ? "border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        : "border-outline bg-background text-on-surface-variant hover:bg-primary/20"
                    }`}
                  >
                    {pkg.disabled ? "Enable" : "Disable"}
                  </button>
                  <button
                    onClick={() => uninstallPackage(pkg)}
                    className="px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-[10px] font-mono text-red-400 transition-all active:scale-95"
                  >
                    Uninstall
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          command={confirm.command}
          description={confirm.description}
          warning={confirm.warning}
          onConfirm={executeConfirm}
          onCancel={dismissConfirm}
        />
      )}
    </div>
  );
}
