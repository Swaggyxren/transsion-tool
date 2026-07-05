import { useRef, useState } from "react";
import { DeviceInfo, isMode } from "../lib/device";
import ButtonGrid from "../components/ButtonGrid";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirmDialog } from "../lib/useConfirmDialog";
import { useConsole } from "../lib/console";
import {
  fastbootCommand,
  fastbootFlash,
  fastbootErase,
  fastbootSwitchSlot,
  openFileDialog,
} from "../lib/commands";

interface FastbootPanelProps {
  device: DeviceInfo | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function FastbootPanel({ device, loading, onRefresh }: FastbootPanelProps) {
  const enabled = isMode(device, "bootloader", "fastbootd");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  const [partition, setPartition] = useState("boot");
  const [slot, setSlot] = useState("");
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

  const profile = device?.profile;
  const knownPartitions = profile?.known_partitions ?? [
    "boot", "init_boot", "vendor_boot", "vbmeta", "system", "product",
    "system_ext", "vendor", "super",
  ];

  const isForbidden = (cmd: string): boolean => {
    return profile?.forbidden_commands.some((fc) => cmd.includes(fc)) ?? false;
  };

  const buildTarget = (): { target: string; slotFlag?: string } => {
    if (!slot) return { target: partition };
    if (slot === "all") return { target: partition, slotFlag: "--slot=all" };
    return { target: `${partition}_${slot}` };
  };

  const flashImage = async () => {
    const file = await openFileDialog({ filters: [{ name: "Image", extensions: ["img"] }] });
    if (typeof file !== "string") return;
    const { target, slotFlag } = buildTarget();
    const cmd = slotFlag
      ? `fastboot flash ${slotFlag} ${target} "${file}"`
      : `fastboot flash ${target} "${file}"`;
    if (isForbidden(cmd)) { write("Command forbidden for this device profile."); return; }
    requestConfirm("Flash Image", cmd, `Flash ${file} to partition ${target}.`, "This overwrites the existing partition image.", () => {
      if (slotFlag) {
        runWithLog(cmd, () => fastbootCommand(["flash", slotFlag, target, file]));
      } else {
        fastbootFlash(partition, file, slot || undefined);
      }
    });
  };

  const bootImage = async () => {
    const file = await openFileDialog({ filters: [{ name: "Image", extensions: ["img"] }] });
    if (typeof file !== "string") return;
    requestConfirm("Boot Image", `fastboot boot "${file}"`, `Boot ${file} temporarily without flashing?`, "This does NOT write to flash — changes are lost on reboot.", () => runWithLog(`fastboot boot "${file}"`, () => fastbootCommand(["boot", file])));
  };

  const wipeDevice = () => {
    requestConfirm("Format/Wipe", "fastboot -w", "Wipe userdata and cache partitions.", "This will WIPE ALL USER DATA and cache. Cannot be undone.", () => runWithLog("fastboot -w", () => fastbootCommand(["-w"])));
  };

  const eraseFrp = () => {
    requestConfirm("Erase FRP", "fastboot erase frp", "Remove Factory Reset Protection.", "This removes the FRP lock. Use only if you know what you're doing.", () => runWithLog("fastboot erase frp", () => fastbootErase("frp")));
  };

  const eraseMetadata = () => {
    requestConfirm("Erase Metadata", "fastboot erase metadata", "Wipe the metadata partition.", "This can affect OTA updates and system behavior. Proceed with caution.", () => runWithLog("fastboot erase metadata", () => fastbootErase("metadata")));
  };

  const unlockBootloader = () => {
    const cmd = "fastboot flashing unlock";
    if (isForbidden(cmd)) { write("Command forbidden for this device profile."); return; }
    requestConfirm("Unlock Bootloader", cmd, "Unlock the bootloader.", "This will WIPE ALL DATA. On Transsion devices, do NOT lock the bootloader afterward via fastboot — it will brick the device.", () => fastbootCommand(["flashing", "unlock"]));
  };

  const lockBootloader = () => {
    const cmd = "fastboot flashing lock";
    if (isForbidden(cmd)) { write("Command forbidden for this device profile."); return; }
    requestConfirm("Lock Bootloader", cmd, "Lock the bootloader?", "CRITICAL WARNING: Locking the bootloader via fastboot with modified imgs (root, custom ROMs, GSIs) WILL BRICK Transsion devices. Only lock if the device is running 100% untouched, official stock firmware.", () => {
      requestConfirm(
        "FINAL CONFIRMATION",
        cmd,
        "Are you absolutely sure? Locking the bootloader with modified firmware will permanently brick your device.",
        "⚠️  DISCLAIMER: The developers of this software assume no liability for any damage, including but not limited to bricked devices, data loss, or voided warranties. Proceed entirely at your own risk.",
        () => runWithLog("fastboot flashing lock", () => fastbootCommand(["flashing", "lock"]))
      );
    });
  };

  const setActiveSlot = (s: string) => {
    requestConfirm(`Set Active Slot ${s.toUpperCase()}`, `fastboot --set-active=${s}`, `Set active slot to ${s.toUpperCase()}.`, undefined, () => fastbootSwitchSlot(s));
  };

  const disableVbmeta = async () => {
    const file = await openFileDialog({ filters: [{ name: "vbmeta", extensions: ["img"] }] });
    if (typeof file !== "string") return;
    requestConfirm("Disable vbmeta", `fastboot --disable-verity --disable-verification flash vbmeta "${file}"`, "Flash vbmeta with verity and verification disabled.", "Required for GSI flashing. Make sure the vbmeta image is valid.", () => fastbootFlash("vbmeta", file, undefined, true, true));
  };

  const oemInfo = () =>
    runWithLog("fastboot oem device-info", () => fastbootCommand(["oem", "device-info"]));

  const rebootEdl = () =>
    requestConfirm("Reboot EDL", "fastboot oem reboot-edl", "Reboot device to Emergency Download Mode (Qualcomm).", "Only works on Qualcomm devices. Used for unbricking and deep-level flashing.", () => runWithLog("fastboot oem reboot-edl", () => fastbootCommand(["oem", "reboot-edl"])));

  const d = busy || !enabled;

  const flashButtons = [
    { label: "Flash Image", onClick: flashImage, disabled: d, title: "Flash an .img file to the selected partition" },
    { label: "Boot Image", onClick: bootImage, disabled: d, title: "Temporarily boot an image from RAM (no flash write)" },
    { label: "Disable vbmeta", onClick: disableVbmeta, disabled: d, title: "Flash vbmeta with verity & verification disabled (required for GSI)" },
    { label: "Format/Wipe", onClick: wipeDevice, disabled: d, title: "Wipe userdata and cache partitions (fastboot -w)" },
    { label: "Erase FRP", onClick: eraseFrp, disabled: d, title: "Remove Factory Reset Protection" },
    { label: "Erase Metadata", onClick: eraseMetadata, disabled: d, title: "Wipe the metadata partition" },
  ];

  const bootloaderButtons = [
    { label: "Unlock BL", onClick: unlockBootloader, disabled: d, title: "Unlock bootloader (fastboot flashing unlock)" },
    { label: "Lock BL", onClick: lockBootloader, disabled: d, title: "Lock bootloader (fastboot flashing lock)" },
    { label: "Set Slot A", onClick: () => setActiveSlot("a"), disabled: d, title: "Switch active boot slot to A" },
    { label: "Set Slot B", onClick: () => setActiveSlot("b"), disabled: d, title: "Switch active boot slot to B" },
    { label: "OEM Info", onClick: oemInfo, disabled: d, title: "Display device info (fastboot oem device-info)" },
  ];

  const rebootButtons = [
    { label: "Reboot System", onClick: () => runWithLog("fastboot reboot", () => fastbootCommand(["reboot"])), disabled: d, title: "Reboot device normally" },
    { label: "Reboot Bootloader", onClick: () => runWithLog("fastboot reboot bootloader", () => fastbootCommand(["reboot", "bootloader"])), disabled: d, title: "Reboot to bootloader mode" },
    { label: "Reboot Fastbootd", onClick: () => runWithLog("fastboot reboot fastboot", () => fastbootCommand(["reboot", "fastboot"])), disabled: d, title: "Reboot to fastbootd (userspace fastboot)" },
    { label: "Reboot EDL", onClick: rebootEdl, disabled: d, title: "Reboot to Emergency Download Mode (Qualcomm only)" },
    { label: "Getvar All", onClick: () => runWithLog("fastboot getvar all", () => fastbootCommand(["getvar", "all"])), disabled: d, title: "Show all fastboot variables" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-2 border-b border-outline">
        <h2 className="text-2xl font-bold text-on-surface">Fastboot</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto w-7 h-7 rounded bg-surface border border-outline text-on-surface hover:bg-primary/20 hover:border-primary flex items-center justify-center transition-all disabled:opacity-40"
        >
          <span className={`material-symbols-outlined text-xs ${loading ? "animate-spin" : ""}`}>sync</span>
        </button>
      </div>

      <div className="p-4 bg-surface border border-outline rounded space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">info</span>
          <span className="text-[10px] font-mono text-on-surface-variant/60">Select partition, slot (A/B/both), then use Flash / Erase / Format below.</span>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={partition}
            onChange={(e) => setPartition(e.target.value)}
            disabled={busy}
            className="px-3 py-2 rounded bg-surface border border-outline text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 relative disabled:opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e1e2ec'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3csvg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {knownPartitions.map((p) => (
              <option key={p} value={p} className="bg-surface text-on-surface">{p}</option>
            ))}
          </select>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={busy}
            className="px-3 py-2 rounded bg-surface border border-outline text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none pr-8 relative disabled:opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e1e2ec'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3csvg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <option value="" className="bg-surface text-on-surface">No slot</option>
            <option value="a" className="bg-surface text-on-surface">Slot A</option>
            <option value="b" className="bg-surface text-on-surface">Slot B</option>
            <option value="all" className="bg-surface text-on-surface">Both slots (--slot=all)</option>
          </select>
          <div className="text-[10px] font-mono text-primary bg-background px-3 py-2 rounded border border-outline">
            Target: <span className="font-bold">
              {slot === "all" ? `--slot=all ${partition}` : slot ? `${partition}_${slot}` : partition}
            </span>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">sd_storage</span>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">FLASH & PARTITION</h3>
          <span className="text-[9px] text-on-surface-variant/40 font-mono">Flash, boot, erase, format</span>
        </div>
        <ButtonGrid buttons={flashButtons} />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">BOOTLOADER</h3>
          <span className="text-[9px] text-on-surface-variant/40 font-mono">Unlock, lock, set slot A/B, status</span>
        </div>
        <ButtonGrid buttons={bootloaderButtons} />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">restart_alt</span>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">REBOOT & INFO</h3>
          <span className="text-[9px] text-on-surface-variant/40 font-mono">System, bootloader, EDL, getvar</span>
        </div>
        <ButtonGrid buttons={rebootButtons} />
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
