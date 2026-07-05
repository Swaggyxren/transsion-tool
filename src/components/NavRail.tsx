type Page =
  | "dashboard"
  | "adb"
  | "fastboot"
  | "flash"
  | "root"
  | "apps"
  | "tools"
  | "docs";

interface NavRailProps {
  active: Page;
  onChange: (page: Page) => void;
}

const items: { id: Page; label: string; iconName: string; fill?: boolean }[] = [
  { id: "dashboard", label: "Home", iconName: "home", fill: true },
  { id: "adb", label: "ADB", iconName: "terminal" },
  { id: "fastboot", label: "Fastboot", iconName: "bolt" },
  { id: "flash", label: "GSI Flash", iconName: "system_update_alt" },
  { id: "root", label: "Root", iconName: "security" },
  { id: "apps", label: "Apps", iconName: "grid_view" },
  { id: "tools", label: "Tools", iconName: "build" },
  { id: "docs", label: "Docs", iconName: "book" },
];

export default function NavRail({ active, onChange }: NavRailProps) {
  return (
    <aside className="fixed h-screen w-64 left-0 bg-surface border-r border-outline flex flex-col py-6 z-50">
      {/* Header / Brand */}
      <div className="mb-8 px-6 pb-6 border-b border-outline">
        <h1 className="text-xl font-bold text-primary tracking-tighter leading-none font-mono">Transsion Tool</h1>
        <p className="text-[10px] font-mono text-on-surface-variant opacity-60 mt-2 uppercase tracking-wider">v1.2.0-dev</p>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 space-y-0.5">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative flex items-center gap-3 w-full transition-all duration-100 text-left overflow-hidden ${
                isActive
                  ? "bg-primary/10 text-primary font-bold rounded-r-full"
                  : "text-on-surface-variant/50 hover:bg-primary/15 hover:text-on-surface rounded"
              }`}
              style={{ padding: "10px 16px" }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full shadow-[0_0_8px_1px_var(--md-sys-color-primary)]" />
              )}
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: isActive || item.fill ? "'FILL' 1" : undefined }}
              >
                {item.iconName}
              </span>
              <span className="text-sm font-mono tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Daemon Telemetry */}
      <div className="p-4 border-t border-outline bg-primary/[0.03]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-sm text-primary">usb</span>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider leading-none">DAEMON_MODE</p>
            <p className="text-[10px] text-green-500 font-mono uppercase mt-1">Listening...</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
