import { invoke } from "@tauri-apps/api/core";

export type DeviceMode =
  | "none"
  | "adb"
  | "recovery"
  | "sideload"
  | "bootloader"
  | "fastbootd";

export type LockState = "unknown" | "locked" | "unlocked";

export interface DeviceState {
  mode: DeviceMode;
  serial?: string;
  product?: string;
  manufacturer?: string;
  model?: string;
  android_version?: string;
  api_level?: string;
  bootloader_version?: string;
  current_slot?: string;
  slot_count?: string;
  lock_state: LockState;
  is_userspace: boolean;
  battery_level?: number;
  os_version?: string;
}

export interface DeviceProfile {
  oem: string;
  brands: string[];
  models: string[];
  unlock_commands: {
    command: string;
    args: string[];
    confirm_on_device: boolean;
    description: string;
  }[];
  unlock_prerequisites: string[];
  unlock_requires_code: boolean;
  forbidden_commands: string[];
  dangerous_commands: { command: string; reason: string }[];
  supports_fastbootd: boolean;
  requires_vbmeta_disable: boolean;
  known_partitions: string[];
  notes: string[];
  image_url_template?: string;
}

export interface DeviceInfo {
  state: DeviceState;
  profile?: DeviceProfile;
}

export async function detectDevice(): Promise<DeviceInfo> {
  return invoke("detect_device");
}

export async function loadProfile(): Promise<DeviceProfile> {
  return invoke("load_profile");
}

export function isMode(
  device: DeviceInfo | null,
  ...modes: DeviceMode[]
): boolean {
  return device != null && modes.includes(device.state.mode);
}
