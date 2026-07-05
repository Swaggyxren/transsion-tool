import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export async function openFileDialog(options?: {
  multiple?: boolean;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | string[] | null> {
  return open({
    multiple: options?.multiple ?? false,
    filters: options?.filters,
  });
}

export interface AdbArgs {
  args: string[];
}

export function adbCommand(args: string[]): Promise<string> {
  return invoke("adb_command", { args: { args } });
}

export function adbPull(remote: string, local: string): Promise<string> {
  return invoke("adb_pull", { remote, local });
}

export function adbPush(local: string, remote: string): Promise<string> {
  return invoke("adb_push", { local, remote });
}

export function adbInstall(apk: string, downgrade = false): Promise<string> {
  return invoke("adb_install", { apk, downgrade });
}

export function adbSideload(zip: string): Promise<string> {
  return invoke("adb_sideload", { zip });
}

export function adbShell(command: string): Promise<string> {
  return invoke("adb_shell", { command });
}

export function adbStream(args: string[]): Promise<void> {
  return invoke("adb_stream", { args: { args } });
}

export interface FastbootArgs {
  args: string[];
}

export function fastbootCommand(args: string[]): Promise<string> {
  return invoke("fastboot_command", { args: { args } });
}

export function fastbootStream(args: string[]): Promise<void> {
  return invoke("fastboot_stream", { args: { args } });
}

export function fastbootFlash(
  partition: string,
  image: string,
  slot?: string,
  disableVerity = false,
  disableVerification = false
): Promise<string> {
  return invoke("fastboot_flash", {
    partition,
    image,
    slot,
    disableVerity,
    disableVerification,
  });
}

export function fastbootErase(partition: string): Promise<string> {
  return invoke("fastboot_erase", { partition });
}

export function fastbootSwitchSlot(slot: string): Promise<string> {
  return invoke("fastboot_switch_slot", { slot });
}

export function flashImage(
  image: string,
  partition: string,
  slot?: string
): Promise<string> {
  return invoke("flash_image", { image, partition, slot });
}

export function flashGsi(
  gsiImage: string,
  slot: string | null,
  emptyImage: string
): Promise<string> {
  return invoke("flash_gsi", { gsiImage, slot, emptyImage });
}

export function downloadRootManager(
  manager: "magisk" | "apatch" | "kernelsu"
): Promise<string> {
  return invoke("download_root_manager", { manager });
}

export function extractArchive(
  archive: string,
  outputDir?: string
): Promise<string> {
  return invoke("extract_archive", { archive, outputDir });
}

export function launchScrcpy(): Promise<void> {
  return invoke("launch_scrcpy");
}

export function installUdevRules(): Promise<string> {
  return invoke("install_udev_rules");
}

export function getAppDataDir(): Promise<string> {
  return invoke("get_app_data_dir");
}

export function getPlaceboPath(): Promise<string> {
  return invoke("get_placebo_path");
}

export function getWallpaperColor(): Promise<string> {
  return invoke("get_wallpaper_color");
}
