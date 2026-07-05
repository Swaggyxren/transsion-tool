const sections = [
  {
    id: "adb",
    icon: "terminal",
    title: "ADB Commands",
    items: [
      { cmd: "Push File", desc: "Copies a file from your PC to the device.", detail: "adb push <local> <remote> — Copies a file or directory to the device's filesystem." },
      { cmd: "Pull File", desc: "Copies a file from the device to your PC.", detail: "adb pull <remote> <local> — Downloads a file or directory from the device." },
      { cmd: "Install APK", desc: "Installs an Android app package.", detail: "adb install <apk> — Sideloads an APK onto the device. Use -d for downgrade." },
      { cmd: "Screenshot", desc: "Captures the device screen and saves to PC.", detail: "adb shell screencap → adb pull → cleanup. Captures the current screen as a PNG." },
      { cmd: "Open SCRCPY", desc: "Mirrors and controls the device screen.", detail: "Launches scrcpy — a desktop application that displays and controls your Android device via USB." },
      { cmd: "Wireless TCP/IP", desc: "Switches ADB to TCP mode for wireless use.", detail: "adb tcpip 5555 — Restarts adbd listening on TCP port 5555 so you can disconnect USB." },
      { cmd: "Wireless Connect", desc: "Connects to a device by IP address.", detail: "adb connect <ip>:5555 — Pairs with a device on wireless ADB after running TCP/IP mode." },
      { cmd: "Sideload ZIP", desc: "Pushes an OTA ZIP via recovery sideload.", detail: "adb sideload <zip> — Used in recovery mode to flash OTA updates or ROM zips." },
      { cmd: "Reboot Commands", desc: "Restart the device in various modes.", detail: "adb reboot <mode>\n  bootloader — Reboots to fastboot/bootloader mode for flashing.\n  recovery — Reboots to recovery mode for OTAs and factory reset.\n  fastboot — Reboots to fastbootd (userspace fastboot) for flashing dynamic partitions.\n  (no arg) — Reboots the system normally." },
      { cmd: "List / 3rd-party packages", desc: "Shows installed packages.", detail: "pm list packages [flags] — Lists all (-3 for third-party) installed packages on the device." },
      { cmd: "Uninstall app", desc: "Removes a package for the current user.", detail: "pm uninstall -k --user 0 <pkg> — Uninstalls but keeps app data (-k). Works per-user." },
      { cmd: "Battery info", desc: "Displays battery statistics.", detail: "dumpsys battery — Shows level, health, temperature, voltage, and charging status." },
      { cmd: "Device props", desc: "Shows key build and hardware properties.", detail: "getprop — Reads system properties like Android version, model, manufacturer, and storage." },
      { cmd: "Dmesg log", desc: "Dumps the kernel ring buffer.", detail: "dmesg — Shows kernel log messages useful for debugging hardware and driver issues." },
    ],
  },
  {
    id: "fastboot",
    icon: "bolt",
    title: "Fastboot Commands",
    items: [
      { cmd: "Flash Image", desc: "Writes an image file to a partition.", detail: "fastboot flash <partition> <image> — Writes the image to the specified partition (boot, vendor_boot, vbmeta, etc.). Supports slot suffixes (_a, _b) and --slot=all." },
      { cmd: "Boot Image", desc: "Temporarily boots an image from RAM.", detail: "fastboot boot <image> — Loads the image into memory and boots it without writing to flash. Changes lost on reboot." },
      { cmd: "Disable vbmeta", desc: "Disables AVB verification on vbmeta.", detail: "fastboot --disable-verity --disable-verification flash vbmeta <image> — Required before flashing GSIs on devices with verified boot." },
      { cmd: "Format/Wipe", desc: "Wipes userdata and cache partitions.", detail: "fastboot -w — Completely wipes userdata and cache. Useful for clean flashes or before selling device." },
      { cmd: "Erase FRP", desc: "Removes Factory Reset Protection.", detail: "fastboot erase frp — Clears the FRP lock partition. Used for bypassing Google account verification." },
      { cmd: "Erase Metadata", desc: "Wipes the metadata partition.", detail: "fastboot erase metadata — Clears the metadata partition which stores OTA metadata and dynamic partition info." },
      { cmd: "Unlock BL", desc: "Unlocks the bootloader.", detail: "fastboot flashing unlock — Unlocks the bootloader to allow custom firmware. Wipes all data on most devices." },
      { cmd: "Lock BL", desc: "Locks the bootloader.", detail: "fastboot flashing lock — Re-locks the bootloader. ⚠ DANGER: Will brick Transsion devices if modified firmware is installed." },
      { cmd: "Set Slot A/B", desc: "Switches the active boot slot.", detail: "fastboot --set-active=<a|b> — Changes which slot the device boots from. Used on A/B partition devices." },
      { cmd: "OEM Info", desc: "Shows device bootloader info.", detail: "fastboot oem device-info — Displays bootloader status including lock state and device tamper flags." },
      { cmd: "Reboot commands", desc: "Restarts the device in various modes.", detail: "fastboot reboot [mode] — System, bootloader, or fastbootd. Reboot EDL enters Qualcomm Emergency Download mode." },
      { cmd: "Getvar All", desc: "Lists all fastboot variables.", detail: "fastboot getvar all — Displays all device variables including slot count, current slot, product name, and bootloader version." },
    ],
  },
  {
    id: "flash",
    icon: "system_update_alt",
    title: "GSI Flash",
    items: [
      { cmd: "GSI Flash Workflow", desc: "Step-by-step GSI flashing process.", detail: `1. Reboot to bootloader:
   adb reboot bootloader

2. Disable vbmeta verification:
   fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img

3. Reboot to fastbootd:
   fastboot reboot fastboot

4. Flash empty images to product & system_ext:
   fastboot flash product placebo.img
   fastboot flash system_ext placebo.img

5. Flash the GSI to system:
   fastboot flash system gsi.img

6. Wait for the GSI to finish flashing.

7. Wipe user data:
   fastboot -w

8. Reboot to fastbootd (optional):
   fastboot reboot fastboot

The device should now boot into the GSI. If it bootloops, you may need to wipe data again or flash a different GSI variant (AB vs A-only, arm64 vs arm64_binder64).` },
    ],
  },
  {
    id: "root",
    icon: "security",
    title: "Root Tools",
    items: [
      { cmd: "Fetch Releases", desc: "Gets latest root manager APKs from GitHub.", detail: "Fetches the latest release from each root manager's GitHub repo via the API. Only shows .apk assets filtered from the release." },
      { cmd: "Rooting Steps", desc: "General process for rooting.", detail: "1. Unlock bootloader (Fastboot tab)\n2. Obtain your stock boot.img (or init_boot.img on newer devices) — dump it from your device using tools like AMT Tool or Phoenix Tool, or find it on sites like needrom.com.\n3. Patch the image with Magisk/KernelSU/APatch on the phone\n4. Pull the patched image back:\n   adb pull /sdcard/Download/magisk_patched.img\n5. Flash the patched image in the Fastboot tab\n6. Reboot and verify root\n\nAlternatively, if your device has a custom recovery, you can flash a prebuilt GKI kernel that comes with root included. Note that this approach may still require the root manager app to be installed separately for full functionality." },
    ],
  },
  {
    id: "apps",
    icon: "grid_view",
    title: "App Manager",
    items: [
      { cmd: "List packages", desc: "Loads all installed packages from device.", detail: "Runs pm list packages, pm list packages -d (disabled), and pm list packages -s (system) in parallel, then merges results." },
      { cmd: "Disable / Enable", desc: "Toggles package state.", detail: "pm disable-user --user 0 <pkg> / pm enable --user 0 <pkg>. Disabled packages are hidden from the app drawer. System apps show an extra warning." },
      { cmd: "Uninstall", desc: "Removes a package for the current user.", detail: "pm uninstall -k --user 0 <pkg>. User-level uninstall — a factory reset restores the app. System packages show a warning." },
      { cmd: "Debloater", desc: "Batch uninstalls known Transsion bloatware.", detail: "Runs pm uninstall --user 0 for a curated list of 50+ known safe-to-remove Transsion packages (TOS7–TOS16). Script by Laynsb. Keyboard is removed — install Gboard first." },
    ],
  },
  {
    id: "tools",
    icon: "build",
    title: "Tools",
    items: [
      { cmd: "Launch SCRCPY", desc: "Starts scrcpy screen mirroring.", detail: "Launches the scrcpy binary which mirrors and allows control of the connected device." },
      { cmd: "Install udev Rules", desc: "Sets up Linux USB permissions for ADB.", detail: "Writes Android udev rules to /etc/udev/rules.d/ so ADB/fastboot work without root. Requires sudo." },
      { cmd: "GSI List", desc: "Fetches TrebleDroid GSI list from GitHub.", detail: "Scrapes the TrebleDroid wiki page for available GSI images grouped by Android version, with download links." },
    ],
  },
];

export default function DocsPanel() {
  return (
    <div className="space-y-8 pb-8">
      <h2 className="text-2xl font-bold text-on-surface">Reference</h2>
      <p className="text-xs font-mono text-on-surface-variant/60 -mt-4">
        How each command and function works in Transsion Tool.
      </p>

      {sections.map((section) => (
        <section key={section.id}>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">{section.icon}</span>
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">{section.title}</h3>
          </div>

          <div className="border border-outline bg-surface rounded-sm overflow-hidden divide-y divide-outline/60">
            {section.items.map((item, i) => (
              <details key={i} className="group">
                <summary className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-primary/5 transition-colors list-none">
                  <span className="material-symbols-outlined text-sm text-primary/60 group-open:text-primary transition-colors">chevron_right</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold font-mono text-on-surface">{item.cmd}</span>
                    <span className="text-[10px] font-mono text-on-surface-variant/60 ml-2">{item.desc}</span>
                  </div>
                </summary>
                <div className="px-4 pb-3 pt-0">
                  <div className="bg-background border border-outline rounded p-3">
                    <code className="text-[11px] font-mono text-on-surface leading-relaxed whitespace-pre-wrap">{item.detail}</code>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
