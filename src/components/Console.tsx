import { useEffect, useRef, useState } from "react";
import { useConsole } from "../lib/console";

export default function Console() {
  const { logs, clear, write } = useConsole();
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    write("Transsion Tool started.", "info");
    write("Initializing ADB server...", "info");
    write("Daemon started successfully on port 5037", "info");
  }, [write]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const copyToClipboard = () => {
    const text = logs.map((log) => log.text).join("\n");
    navigator.clipboard.writeText(text);
  };

  const clearLogs = () => {
    clear();
  };

  return (
    <div className={`${expanded ? "h-96" : "h-40"} bg-background border-t border-outline flex flex-col relative z-20 mt-auto transition-all duration-200`}>
      {/* Terminal Header */}
      <div className="px-6 h-8 border-b border-outline flex justify-between items-center bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">SYSTEM_LOG_CONSOLE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Collapse" : "Expand"}
            className={`material-symbols-outlined text-sm transition-colors ${
              expanded ? "text-primary" : "text-on-surface-variant hover:text-white"
            }`}
          >
            {expanded ? "expand_more" : "expand_less"}
          </button>
          <button
            onClick={copyToClipboard}
            title="Copy Logs"
            className="material-symbols-outlined text-sm text-on-surface-variant hover:text-white transition-colors"
          >
            content_copy
          </button>
          <button
            onClick={clearLogs}
            title="Clear Logs"
            className="material-symbols-outlined text-sm text-on-surface-variant hover:text-[#ffb4ab] transition-colors"
          >
            delete
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-tight space-y-0.5 bg-background custom-scrollbar">
        {logs.map((log) => {
          let labelColor = "text-green-500";
          let labelText = "INFO";
          let msgColor = "text-on-surface";

          if (log.type === "stderr") {
            labelColor = "text-red-400";
            labelText = "ERR";
            msgColor = "text-red-400";
          } else if (log.type === "info") {
            labelColor = "text-green-500";
            labelText = "INFO";
            msgColor = "text-on-surface";
          }

          return (
            <div key={log.id} className="flex gap-2 break-all">
              <span className="text-on-surface-variant opacity-50 whitespace-nowrap select-none">
                [{new Date().toLocaleTimeString()}]
              </span>
              <span className={`${labelColor} font-bold whitespace-nowrap select-none w-8`}>{labelText}</span>
              <span className={msgColor}>{log.text}</span>
            </div>
          );
        })}
        <div className="flex gap-2 items-center opacity-50 select-none pt-1">
          <span className="text-on-surface font-bold">&gt;_</span>
          <span className="text-on-surface">Listening for commands...</span>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
