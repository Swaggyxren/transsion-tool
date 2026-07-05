import { useState } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import { DeviceInfo } from "../lib/device";
import ButtonGrid from "../components/ButtonGrid";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirmDialog } from "../lib/useConfirmDialog";
import {
  installUdevRules,
  launchScrcpy,
} from "../lib/commands";

const GSI_URL = "https://github.com/TrebleDroid/treble_experimentations/wiki/Generic-System-Image-(GSI)-list";

interface GsiEntry {
  android: string;
  variant: string;
  arch: string;
  link: string;
  notes: string;
}

interface ToolsPanelProps {
  device: DeviceInfo | null;
}

export default function ToolsPanel({ device }: ToolsPanelProps) {
  const { confirm, requestConfirm, dismissConfirm, executeConfirm } =
    useConfirmDialog();
  const [gsiEntries, setGsiEntries] = useState<GsiEntry[] | null>(null);
  const [gsiLoading, setGsiLoading] = useState(false);
  const [gsiError, setGsiError] = useState("");

  const fetchGsiList = async () => {
    if (gsiEntries) return;
    setGsiLoading(true);
    setGsiError("");
    try {
      const res = await fetch(GSI_URL);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const content =
        doc.querySelector("#wiki-body .markdown-body") ??
        doc.querySelector(".gollum-markdown-content") ??
        doc.querySelector(".markdown-body");

      if (!content) { setGsiError("Could not find wiki content on the page."); return; }

      // Page structure: <h2>Official/Unofficial Android {version}</h2> immediately followed by <table>
      // Each table has 7 columns: Updated | Image | Maintainer | Links | Sources | Architecture | Security
      const extractVersion = (heading: string): string => {
        const m = heading.match(/Android\s+(\d[\d.]*)/i);
        return m ? m[1] : heading;
      };

      const entries: GsiEntry[] = [];
      const headingElements = Array.from(content.querySelectorAll("h2"));

      for (const heading of headingElements) {
        const headingText = heading.textContent?.trim() ?? "";
        if (!headingText.toLowerCase().includes("android")) continue;

        const version = extractVersion(headingText);
        // The table is the next sibling element
        let table = heading.closest(".markdown-heading")?.nextElementSibling;
        // Skip non-table siblings (there shouldn't be any, but just in case)
        while (table && table.tagName !== "TABLE") { table = table.nextElementSibling; }
        if (!table) continue;

        const rows = Array.from(table.querySelectorAll("tbody tr"));
        for (const row of rows) {
          const cells = row.querySelectorAll("td");
          if (cells.length < 4) continue;

          // Columns: 0=Updated, 1=Image, 2=Maintainer, 3=Links, 4=Sources, 5=Architecture, 6=Security
          const image = cells[1]?.textContent?.trim() ?? "";
          if (!image) continue;

          // Find the first meaningful download link in the Links column
          const linksCell = cells[3];
          const links = linksCell?.querySelectorAll("a");
          let link = "";
          for (const a of links ?? []) {
            const href = a.getAttribute("href") ?? "";
            if (href && !href.startsWith("#")) { link = href; break; }
          }

          entries.push({
            android: version,
            variant: image,
            arch: cells[5]?.textContent?.trim() ?? "",
            link,
            notes: `${cells[2]?.textContent?.trim() ?? ""} · ${cells[0]?.textContent?.trim() ?? ""}`,
          });
        }
      }

      if (entries.length === 0) { setGsiError("Parsed table but found zero entries."); return; }
      setGsiEntries(entries);
    } catch (e) {
      setGsiError(`Failed to fetch GSI list: ${e}`);
    } finally {
      setGsiLoading(false);
    }
  };

  const buttons = [
    { label: "Launch SCRCPY", onClick: () => launchScrcpy() },
    {
      label: "Install udev Rules",
      onClick: () =>
        requestConfirm(
          "Install udev Rules",
          "pkexec cp 51-android.rules /etc/udev/rules.d/ && udevadm reload",
          "Install Android USB udev rules so adb/fastboot work without root?",
          "This requires administrative privileges.",
          () => installUdevRules()
        ),
    },
    {
      label: "Fetch GSI List",
      onClick: fetchGsiList,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-on-surface">Tools</h2>
      <ButtonGrid buttons={buttons} />

      {gsiLoading && (
        <div className="bg-surface border border-outline rounded p-6 text-center">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <span className="text-sm text-on-surface-variant font-mono">Fetching GSI list...</span>
        </div>
      )}

      {gsiError && (
        <div className="bg-surface border border-red-500/20 rounded p-4">
          <p className="text-sm text-red-400 font-mono">{gsiError}</p>
          <button onClick={fetchGsiList} className="mt-2 text-xs text-primary font-mono hover:underline">Retry</button>
        </div>
      )}

      {gsiEntries && (
        <section className="border border-outline bg-surface overflow-hidden rounded-sm">
          <div className="px-4 py-2 border-b border-outline bg-background flex justify-between items-center">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">GSI LIST</span>
            <span className="text-[10px] font-mono text-on-surface-variant/60">{gsiEntries.length} entries</span>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-outline">
            {Array.from(
              gsiEntries.reduce((map, e) => {
                const group = map.get(e.android) ?? [];
                group.push(e);
                map.set(e.android, group);
                return map;
              }, new Map<string, GsiEntry[]>())
            )
              .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
              .map(([version, entries]) => (
                <div key={version}>
                  <div className="px-4 py-1.5 bg-background/80 border-b border-outline sticky top-0">
                    <span className="text-[11px] font-bold text-primary font-mono">Android {version}</span>
                    <span className="text-[9px] font-mono text-on-surface-variant/40 ml-2">{entries.length}</span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="font-mono text-[9px] text-on-surface-variant/60 uppercase font-bold">
                        <th className="px-3 py-1 border-r border-outline w-[22%]">VARIANT</th>
                        <th className="px-3 py-1 border-r border-outline w-[12%]">ARCH</th>
                        <th className="px-3 py-1 border-r border-outline">NOTES</th>
                        <th className="px-3 py-1 w-[14%]">LINK</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-mono text-on-surface divide-y divide-outline/60">
                      {entries.map((entry, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors">
                          <td className="px-3 py-1 border-r border-outline">{entry.variant}</td>
                          <td className="px-3 py-1 border-r border-outline">{entry.arch}</td>
                          <td className="px-3 py-1 border-r border-outline text-on-surface-variant/60 max-w-[200px] truncate">{entry.notes}</td>
                          <td className="px-3 py-1">
                            {entry.link && (
                              <button
                                onClick={() => window.open(entry.link.startsWith("http") ? entry.link : `https://github.com${entry.link}`, "_blank")}
                                className="text-primary hover:underline text-[10px] font-bold"
                              >
                                Download →
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
