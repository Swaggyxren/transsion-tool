import { useState } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import ButtonGrid from "../components/ButtonGrid";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirmDialog } from "../lib/useConfirmDialog";
import {
  adbInstall,
  adbPush,
  openFileDialog,
} from "../lib/commands";

interface ReleaseInfo {
  name: string;
  tag: string;
  version: string;
  assets: { name: string; url: string; size: string }[];
  repoUrl: string;
}

const MANAGERS: { id: string; label: string; repo: string; icon: string }[] = [
  { id: "magisk", label: "Magisk", repo: "topjohnwu/Magisk", icon: "security" },
  { id: "kernelsu", label: "KernelSU", repo: "tiann/KernelSU", icon: "developer_board" },
  { id: "kernelsu-next", label: "KernelSU-Next", repo: "KernelSU-Next/KernelSU-Next", icon: "bolt" },
];

export default function RootPanel() {
  const [log, setLog] = useState("");
  const [releases, setReleases] = useState<Record<string, ReleaseInfo>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { confirm, requestConfirm, dismissConfirm, executeConfirm } =
    useConfirmDialog();

  const addLog = (msg: string) => setLog((prev) => prev + msg + "\n");

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fetchRelease = async (id: string, repo: string) => {
    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "TranssionTool" },
      });
      if (!res.ok) { addLog(`Failed to fetch ${repo}: ${res.status}`); return; }
      const data = await res.json();
      const release: ReleaseInfo = {
        name: data.name ?? data.tag_name ?? id,
        tag: data.tag_name ?? "",
        version: (data.tag_name ?? "").replace(/^v/, ""),
        repoUrl: `https://github.com/${repo}/releases`,
        assets: (data.assets ?? [])
          .filter((a: { name: string }) => a.name.endsWith(".apk"))
          .map((a: { name: string; browser_download_url: string; size: number }) => ({
            name: a.name,
            url: a.browser_download_url,
            size: formatSize(a.size),
          })),
      };
      setReleases((prev) => ({ ...prev, [id]: release }));
      addLog(`Found ${id} ${release.tag} — ${release.assets.length} APK(s)`);
    } catch (e) {
      addLog(`Failed to fetch ${id}: ${e}`);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleInstall = async () => {
    const file = await openFileDialog({
      filters: [{ name: "APK", extensions: ["apk"] }],
    });
    if (typeof file !== "string") return;
    requestConfirm(
      "Install Root Manager",
      `adb install "${file}"`,
      "Install the selected root manager APK?",
      undefined,
      async () => {
        try {
          const out = await adbInstall(file);
          addLog(out);
        } catch (e) {
          addLog(`Failed: ${e}`);
        }
      }
    );
  };

  const handlePush = async () => {
    const file = await openFileDialog({
      filters: [{ name: "APK", extensions: ["apk"] }],
    });
    if (typeof file !== "string") return;
    requestConfirm(
      "Push Root Manager",
      `adb push "${file}" /sdcard/`,
      "Push the selected APK to /sdcard?",
      undefined,
      async () => {
        try {
          const out = await adbPush(file, "/sdcard/");
          addLog(out);
        } catch (e) {
          addLog(`Failed: ${e}`);
        }
      }
    );
  };

  const buttons = [
    { label: "Install APK", onClick: handleInstall },
    { label: "Push to /sdcard", onClick: handlePush },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-on-surface">Root Tools</h2>
      <ButtonGrid buttons={buttons} />

      {/* Release fetcher cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MANAGERS.map((mgr) => {
          const rel = releases[mgr.id];
          const busy = loading[mgr.id];

          return (
            <div key={mgr.id} className="bg-surface border border-outline rounded p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">{mgr.icon}</span>
                <span className="text-sm font-bold text-on-surface font-mono">{mgr.label}</span>
              </div>

              {!rel && !busy && (
                <button
                  onClick={() => fetchRelease(mgr.id, mgr.repo)}
                  className="px-3 py-2 rounded bg-transparent border border-outline text-on-surface-variant hover:border-primary hover:text-primary text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 duration-100"
                >
                  Fetch latest release
                </button>
              )}

              {busy && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant/60">
                  <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
                  Fetching...
                </div>
              )}

              {rel && (
                <>
                  <div className="text-[10px] font-mono text-primary font-bold">
                    {rel.tag}
                  </div>

                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {rel.assets.length === 0 && (
                      <span className="text-[10px] font-mono text-on-surface-variant/40">No APK files</span>
                    )}
                    {rel.assets.map((asset, i) => (
                      <button
                        key={i}
                        onClick={() => window.open(asset.url, "_blank")}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-primary/[0.15] text-left transition-colors active:scale-95 duration-100"
                      >
                        <span className="text-[10px] font-mono text-on-surface truncate flex-1">{asset.name}</span>
                        <span className="text-[9px] font-mono text-on-surface-variant/40 ml-2 shrink-0">{asset.size}</span>
                      </button>
                    ))}
                  </div>

                  <a
                    href={rel.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] font-mono text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 px-1 -mx-1 rounded transition-all"
                  >
                    View all releases →
                  </a>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Rooting Steps */}
      <div className="bg-surface border border-outline rounded p-4">
        <h3 className="text-sm font-bold uppercase mb-2 text-on-surface-variant">
          Rooting Steps
        </h3>
        <ol className="list-decimal list-inside text-sm space-y-1 text-on-surface-variant/80">
          <li>Unlock bootloader (Fastboot tab)</li>
          <li>Get your stock boot.img/init_boot.img (dump via AMT, Phoenix, or find on needrom.com)</li>
          <li>Patch it with Magisk/APatch/KernelSU on the phone</li>
          <li>Pull the patched image back (adb pull)</li>
          <li>Flash patched image in Fastboot tab</li>
        </ol>
      </div>

      {log && (
        <pre className="bg-surface border border-outline rounded p-3 text-xs font-mono overflow-auto max-h-48 text-on-surface">
          {log}
        </pre>
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          command={confirm.command}
          description={confirm.description}
          onConfirm={executeConfirm}
          onCancel={dismissConfirm}
        />
      )}
    </div>
  );
}
