import { useRef, useState } from "react";
import { DeviceInfo, isMode } from "../lib/device";
import ButtonGrid from "../components/ButtonGrid";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirmDialog } from "../lib/useConfirmDialog";
import { useConsole } from "../lib/console";
import {
  adbCommand,
  adbPull,
  adbPush,
  adbInstall,
  adbSideload,
  adbShell,
  launchScrcpy,
  openFileDialog,
} from "../lib/commands";

interface AdbPanelProps {
  device: DeviceInfo | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function AdbPanel({ device, loading, onRefresh }: AdbPanelProps) {
  const enabled = isMode(device, "adb", "recovery", "sideload");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  const { confirm, requestConfirm, dismissConfirm, executeConfirm } =
    useConfirmDialog();
  const { write: consoleWrite } = useConsole();

  const write = (text: string) => {
    setOutput((prev) => [...prev.slice(-50), text]);
    setTimeout(() => outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" }), 0);
  };

  const runWithLog = (label: string, action: () => Promise<string>) => {
    setBusy(true);
    write(`> ${label}`);
    consoleWrite(`Executing: ${label}`, "info");
    action()
      .then((out) => {
        write(out);
        consoleWrite(out, "stdout");
      })
      .catch((e) => {
        write(`Failed: ${e}`);
        consoleWrite(`Failed: ${e}`, "stderr");
      })
      .finally(() => setBusy(false));
  };

  const pullDownloadImages = async () => {
    const out = await adbShell("ls /sdcard/Download/*.img 2>/dev/null");
    const files = out.split("\n").filter((f) => f.trim().endsWith(".img"));
    if (files.length === 0) {
      write("No .img files found in /sdcard/Download");
      consoleWrite("No .img files found in /sdcard/Download", "info");
      return;
    }
    requestConfirm(
      "Pull images",
      `adb pull ${files.length} .img files from /sdcard/Download`,
      `Found ${files.length} image(s). Pull them all to the current directory?`,
      undefined,
      async () => {
        for (const f of files) {
          try {
            const res = await adbPull(f.trim(), ".");
            write(`Pulled: ${f.trim()}`);
            consoleWrite(`Pulled: ${f.trim()}`, "stdout");
          } catch (e) {
            write(`Failed to pull ${f.trim()}: ${e}`);
            consoleWrite(`Failed to pull ${f.trim()}: ${e}`, "stderr");
          }
        }
      }
    );
  };

  const takeScreenshot = async () => {
    write("Capturing screenshot...");
    consoleWrite("Capturing screenshot...", "info");
    try {
      await adbShell("screencap -p /sdcard/screenshot.png");
      const path = await openFileDialog();
      if (typeof path === "string") {
        const savePath = path.endsWith("/") || path.endsWith("\\") ? path + "screenshot.png" : path;
        const out = await adbPull("/sdcard/screenshot.png", savePath);
        write(out);
        consoleWrite(out, "stdout");
        await adbShell("rm /sdcard/screenshot.png");
      }
    } catch (e) {
      write(`Screenshot failed: ${e}`);
      consoleWrite(`Screenshot failed: ${e}`, "stderr");
    }
  };

  const dumpBattery = () =>
    runWithLog("dumpsys battery", () => adbShell("dumpsys battery"));

  const dumpProperties = () =>
    runWithLog("getprop (key props)", () =>
      adbShell(
        "echo '--- BUILD ---' && getprop ro.build.version.release && getprop ro.build.version.sdk && echo '--- DEVICE ---' && getprop ro.product.model && getprop ro.product.manufacturer && getprop ro.product.name && echo '--- NETWORK ---' && getprop gsm.network.type && getprop wifi.interface && echo '--- STORAGE ---' && df -h /data | tail -1"
      )
    );

  const dumpPackages = () =>
    runWithLog("pm list packages -3", () => adbShell("pm list packages -3"));

  const dumpDmesg = () =>
    runWithLog("dmesg (last 50 lines)", () => adbShell("dmesg | tail -50"));

  const uninstallApp = async () => {
    const out = await adbShell("pm list packages -3 | sed 's/package://'");
    const packages = out.split("\n").filter(Boolean);
    if (packages.length === 0) {
      write("No third-party packages found.");
      consoleWrite("No third-party packages found.", "info");
      return;
    }
    const list = packages.slice(0, 30).join("\n");
    requestConfirm(
      "Uninstall App",
      "adb uninstall <package>",
      `Enter a package name from the list below to uninstall:\n\n${list}`,
      "This will remove the app and all its data.",
      () => {
        const pkg = prompt("Package name to uninstall:");
        if (pkg) runWithLog(`uninstall ${pkg}`, () => adbShell(`pm uninstall -k --user 0 ${pkg}`));
      }
    );
  };

  const wirelessAdb = async () => {
    write("Restarting ADB in TCP/IP mode on port 5555...");
    consoleWrite("Restarting ADB in TCP/IP mode on port 5555...", "info");
    try {
      const out = await adbCommand(["tcpip", "5555"]);
      write(out);
      consoleWrite(out, "stdout");
      write("Now find your device IP and click Wireless Connect.");
      consoleWrite("Now find your device IP and click Wireless Connect.", "info");
    } catch (e) {
      write(`Wireless ADB failed: ${e}`);
      consoleWrite(`Wireless ADB failed: ${e}`, "stderr");
    }
  };

  const wirelessConnect = async () => {
    const ip = prompt("Enter device IP address (e.g. 192.168.1.100):");
    if (!ip) return;
    runWithLog(`adb connect ${ip}:5555`, () => adbCommand(["connect", `${ip}:5555`]));
  };

  const d = busy || !enabled;

  const fileButtons = [
    { label: "Push File", onClick: async () => {
      const file = await openFileDialog();
      if (typeof file === "string") runWithLog(`adb push "${file}" /sdcard/`, () => adbPush(file, "/sdcard/"));
    }, disabled: d, title: "Copy a file from your PC to the device's /sdcard/" },
    { label: "Pull File", onClick: async () => {
      const file = await openFileDialog();
      if (typeof file === "string") runWithLog(`adb pull "${file}" .`, () => adbPull(file, "."));
    }, disabled: d, title: "Copy a file from the device to your PC" },
    { label: "Install APK", onClick: async () => {
      const file = await openFileDialog({ filters: [{ name: "APK", extensions: ["apk"] }] });
      if (typeof file === "string") requestConfirm("Install APK", `adb install "${file}"`, "Install this APK on the connected device?", undefined, () => runWithLog(`adb install "${file}"`, () => adbInstall(file)));
    }, disabled: d, title: "Install an APK on the device" },
    { label: "Screenshot", onClick: takeScreenshot, disabled: d, title: "Capture the device screen and save to your PC" },
    { label: "Pull Download imgs", onClick: pullDownloadImages, disabled: d, title: "Pull all .img files from /sdcard/Download to your PC" },
  ];

  const controlButtons = [
    { label: "Open SCRCPY", onClick: () => {
      write("Launching SCRCPY...");
      consoleWrite("Launching SCRCPY...", "info");
      launchScrcpy();
    }, disabled: d, title: "Mirror and control the device screen via scrcpy" },
    { label: "Wireless TCP/IP", onClick: wirelessAdb, disabled: d, title: "Switch ADB to TCP/IP mode (port 5555) for wireless debugging" },
    { label: "Wireless Connect", onClick: wirelessConnect, disabled: d, title: "Connect to a device wirelessly by IP address" },
    { label: "Sideload ZIP", onClick: async () => {
      const file = await openFileDialog({ filters: [{ name: "ZIP", extensions: ["zip"] }] });
      if (typeof file === "string") requestConfirm("Sideload ZIP", `adb sideload "${file}"`, "Sideload this recovery flashable ZIP?", "Device must be in recovery/sideload mode.", () => runWithLog(`adb sideload "${file}"`, () => adbSideload(file)));
    }, disabled: busy || !isMode(device, "sideload"), title: "Sideload an OTA/recovery ZIP via adb sideload" },
  ];

  const rebootButtons = [
    { label: "Reboot Bootloader", onClick: () => requestConfirm("Reboot Bootloader", "adb reboot bootloader", "Reboot the device to bootloader mode?", undefined, () => runWithLog("adb reboot bootloader", () => adbCommand(["reboot", "bootloader"]))), disabled: d, title: "Reboot device to bootloader/fastboot mode" },
    { label: "Reboot Recovery", onClick: () => runWithLog("adb reboot recovery", () => adbCommand(["reboot", "recovery"])), disabled: d, title: "Reboot device to recovery mode" },
    { label: "Reboot Fastbootd", onClick: () => runWithLog("adb reboot fastboot", () => adbCommand(["reboot", "fastboot"])), disabled: d, title: "Reboot device to fastbootd (userspace fastboot)" },
    { label: "Reboot System", onClick: () => requestConfirm("Reboot System", "adb reboot", "Reboot the device normally?", undefined, () => runWithLog("adb reboot", () => adbCommand(["reboot"]))), disabled: d, title: "Reboot device normally" },
  ];

  const debugButtons = [
    { label: "All packages", onClick: () => runWithLog("pm list packages", () => adbShell("pm list packages")), disabled: d, title: "List all installed packages" },
    { label: "3rd-party pkgs", onClick: dumpPackages, disabled: d, title: "List only user-installed (third-party) packages" },
    { label: "Uninstall app", onClick: uninstallApp, disabled: d, title: "Uninstall a package by name" },
    { label: "Battery info", onClick: dumpBattery, disabled: d, title: "Show battery statistics via dumpsys" },
    { label: "Device props", onClick: dumpProperties, disabled: d, title: "Show key device build and hardware properties" },
    { label: "Dmesg log", onClick: dumpDmesg, disabled: d, title: "Show kernel log (last 50 lines)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-2 border-b border-outline">
        <h2 className="text-2xl font-bold text-on-surface">ADB</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto w-7 h-7 rounded bg-surface border border-outline text-on-surface hover:bg-primary/20 hover:border-primary flex items-center justify-center transition-all disabled:opacity-40"
        >
          <span className={`material-symbols-outlined text-xs ${loading ? "animate-spin" : ""}`}>sync</span>
        </button>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">folder_open</span>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">FILE OPERATIONS</h3>
          <span className="text-[9px] text-on-surface-variant/40 font-mono">Push, pull, install & capture</span>
        </div>
        <ButtonGrid buttons={fileButtons} />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">settings_remote</span>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">DEVICE CONTROL</h3>
          <span className="text-[9px] text-on-surface-variant/40 font-mono">Screen mirror, wireless, sideload</span>
        </div>
        <ButtonGrid buttons={controlButtons} />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">restart_alt</span>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">REBOOT</h3>
          <span className="text-[9px] text-on-surface-variant/40 font-mono">Bootloader, recovery, system</span>
        </div>
        <ButtonGrid buttons={rebootButtons} />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">bug_report</span>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">DEBUG & INFO</h3>
          <span className="text-[9px] text-on-surface-variant/40 font-mono">Packages, battery, props, logs</span>
        </div>
        <ButtonGrid buttons={debugButtons} />
      </section>

      {output.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">terminal</span>
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">OUTPUT</h3>
            <button onClick={() => setOutput([])} className="ml-auto text-[9px] text-on-surface-variant/40 hover:text-[#ffb4ab] font-mono uppercase tracking-wider">Clear</button>
          </div>
          <div ref={outputRef} className="bg-surface border border-outline rounded p-3 font-mono text-[11px] leading-relaxed max-h-32 overflow-y-auto">
            {output.map((line, i) => (
              <div key={i} className={`${line.startsWith(">") ? "text-green-500" : line.startsWith("Failed") ? "text-red-400" : "text-on-surface"}`}>
                {line}
              </div>
            ))}
          </div>
        </section>
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
