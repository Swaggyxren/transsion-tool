import { useState } from "react";
import { DeviceInfo, isMode } from "../lib/device";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirmDialog } from "../lib/useConfirmDialog";
import { useConsole } from "../lib/console";
import { fastbootCommand, openFileDialog, getPlaceboPath } from "../lib/commands";

interface FlashPanelProps {
  device: DeviceInfo | null;
  loading: boolean;
  onRefresh: () => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function FlashPanel({ device }: FlashPanelProps) {
  const enabled = isMode(device, "bootloader", "fastbootd");
  const [busy, setBusy] = useState(false);
  const [placeboPath, setPlaceboPath] = useState("");
  const { write } = useConsole();
  const { confirm, requestConfirm, dismissConfirm, executeConfirm } =
    useConfirmDialog();

  const runStep = async (label: string, action: () => Promise<string>) => {
    write(`→ ${label}`, "info");
    try {
      const out = await action();
      if (out.trim()) write(out.trim(), "stdout");
      write(`✓ ${label}`, "stdout");
      return true;
    } catch (e) {
      write(`✗ ${label}: ${e}`, "stderr");
      return false;
    }
  };

  const runGsiFlash = async () => {
    const gsi = await openFileDialog({
      filters: [{ name: "GSI Image", extensions: ["img"] }],
    });
    if (typeof gsi !== "string") return;

    let empty = placeboPath;
    if (!empty) {
      try {
        empty = await getPlaceboPath();
        setPlaceboPath(empty);
        write(`Using bundled placebo: ${empty}`, "info");
      } catch {
        write(`No bundled placebo found, please select one manually.`, "info");
        const manual = await openFileDialog({
          filters: [{ name: "Empty Image", extensions: ["img"] }],
        });
        if (typeof manual !== "string") return;
        empty = manual;
      }
    }

    requestConfirm(
      "Flash GSI",
      "fastboot reboot fastboot → flash product/system_ext → flash system → fastboot -w",
      `Flash ${gsi} as the system image?`,
      "Make sure vbmeta is disabled first. This will wipe all user data.",
      async () => {
        setBusy(true);
        let ok = await runStep("Rebooting to fastbootd...", () =>
          fastbootCommand(["reboot", "fastboot"])
        );
        if (!ok) { setBusy(false); return; }

        write("Waiting for device to reconnect...", "info");
        await sleep(10000);

        ok = await runStep("Flashing product with placebo...", () =>
          fastbootCommand(["flash", "product", empty])
        );
        if (!ok) { setBusy(false); return; }

        ok = await runStep("Flashing system_ext with placebo...", () =>
          fastbootCommand(["flash", "system_ext", empty])
        );
        if (!ok) { setBusy(false); return; }

        ok = await runStep("Flashing system with GSI...", () =>
          fastbootCommand(["flash", "system", gsi])
        );
        if (!ok) { setBusy(false); return; }

        ok = await runStep("Wiping userdata...", () =>
          fastbootCommand(["-w"])
        );
        if (!ok) { setBusy(false); return; }

        write("");
        write("═══════════════════════════════════", "info");
        write("  GSI flash complete!", "stdout");
        write("  Reboot the device to boot into the GSI.", "info");
        write("═══════════════════════════════════", "info");
        setBusy(false);
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-2 border-b border-outline">
        <h2 className="text-2xl font-bold text-on-surface">Flash Workflows</h2>
      </div>

      <div className="bg-surface border border-outline rounded p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">system_update_alt</span>
          <h3 className="text-lg font-bold text-on-surface">GSI Flash</h3>
        </div>
        <p className="text-sm text-on-surface-variant/80">
          Reboots to fastbootd, flashes bundled placebo to product &amp; system_ext,
          flashes the GSI to system, then wipes userdata.
        </p>

        {busy && (
          <div className="flex items-center gap-2 text-xs font-mono text-primary">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            Working — check console for progress...
          </div>
        )}

        <button
          onClick={runGsiFlash}
          disabled={!enabled || busy}
          className="px-6 py-2.5 rounded font-mono font-bold tracking-wide text-xs uppercase bg-primary text-on-primary hover:brightness-110 disabled:opacity-30 disabled:hover:brightness-100 transition-all duration-75 block"
        >
          {busy ? "Working..." : "Start GSI Flash"}
        </button>
      </div>

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
