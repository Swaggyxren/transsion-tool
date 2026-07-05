import { DeviceInfo, isMode } from "../lib/device";
import { adbCommand, fastbootCommand } from "../lib/commands";
import DeviceCard from "../components/DeviceCard";

function adbRebootBootloader() {
  return adbCommand(["reboot", "bootloader"]);
}
function adbRebootRecovery() {
  return adbCommand(["reboot", "recovery"]);
}
function adbRebootFastbootd() {
  return adbCommand(["reboot", "fastboot"]);
}

interface DashboardProps {
  device: DeviceInfo | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function Dashboard({ device, loading, onRefresh }: DashboardProps) {
  const showAdb = isMode(device, "adb", "recovery", "sideload");
  const showFastboot = isMode(device, "bootloader", "fastbootd");

  const rebootActions = [
    {
      label: "Reboot Bootloader",
      icon: "restart_alt",
      onClick: () => adbRebootBootloader(),
      disabled: !showAdb,
      title: "Reboot device to bootloader/fastboot mode",
    },
    {
      label: "Reboot Recovery",
      icon: "medical_services",
      onClick: () => adbRebootRecovery(),
      disabled: !showAdb,
      title: "Reboot device to recovery mode",
    },
    {
      label: "Reboot Fastbootd",
      icon: "developer_board",
      onClick: () => adbRebootFastbootd(),
      disabled: !showAdb,
      title: "Reboot device to fastbootd (userspace fastboot)",
    },
    {
      label: "Reboot System",
      icon: "power_settings_new",
      onClick: () => (showAdb ? adbCommand(["reboot"]) : fastbootCommand(["reboot"])),
      disabled: !showAdb && !showFastboot,
      title: "Reboot device normally",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Top Section: Device Status & Warning */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Device Status Card */}
        <div className="xl:col-span-8">
          <DeviceCard device={device} loading={loading} onRefresh={onRefresh} />
        </div>

        {/* Warning Center & Quick Actions */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Warning Center Card */}
          <section className="bg-surface border border-outline border-l-4 border-l-[#f59e0b] p-4 flex gap-4 items-start rounded-sm">
            <span className="material-symbols-outlined text-[#f59e0b]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div>
              <h3 className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider font-mono mb-1">CRITICAL ADVISORY</h3>
              <p className="text-xs text-on-surface font-medium leading-tight">
                {device?.profile?.notes && device.profile.notes.length > 0 ? (
                  device.profile.notes.join(" · ")
                ) : (
                  "Do NOT lock the bootloader while unofficial/modified imgs are flashed."
                )}
              </p>
            </div>
          </section>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            {rebootActions.map((btn, index) => {
              const isPrimary = btn.label === "Reboot System";
              return (
                <button
                  key={index}
                  disabled={btn.disabled}
                  onClick={btn.onClick}
                  title={btn.title}
                   className={`p-4 flex flex-col justify-between transition-all duration-75 text-left border rounded-sm ${
                    isPrimary
                      ? "bg-primary border-primary text-on-primary hover:brightness-110"
                      : "bg-surface border-outline text-on-surface hover:bg-primary/20 group"
                  } ${btn.disabled ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  <span className={`material-symbols-outlined ${isPrimary ? "text-on-primary" : "text-on-surface-variant group-hover:text-primary"} text-2xl`}>
                    {btn.icon}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono mt-4">
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>


    </div>
  );
}
