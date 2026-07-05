use crate::models::device::{DeviceInfo, DeviceMode, DeviceState, LockState};
use crate::models::profile::DeviceProfile;
use crate::utils::process::run_cmd;

#[tauri::command]
pub async fn detect_device() -> Result<DeviceInfo, String> {
    let mut state = DeviceState::default();

    // Try ADB detection first
    let adb_devices = run_cmd("adb", &["devices"]).await?;
    if let Some(line) = adb_devices.lines().find(|l| l.contains("\t")) {
        let parts: Vec<&str> =line.split('\t').collect();
        if parts.len() >= 2 {
            state.serial = Some(parts[0].trim().to_string());
            let status = parts[1].trim();
            state.mode = match status {
                "device" => DeviceMode::Adb,
                "recovery" => DeviceMode::Recovery,
                "sideload" => DeviceMode::Sideload,
                _ => DeviceMode::Adb,
            };

            // Gather ADB-side info
            if let Ok(props) = run_cmd("adb", &["shell", "getprop"]).await {
                state.manufacturer = extract_prop(&props, "ro.product.manufacturer");
                state.model = extract_prop(&props, "ro.product.model");
                state.android_version = extract_prop(&props, "ro.build.version.release");
                state.api_level = extract_prop(&props, "ro.build.version.sdk");
                state.product = extract_prop(&props, "ro.product.name");
            }

            if let Ok(lock) = run_cmd("adb", &["shell", "getprop", "ro.boot.flash.locked"]).await {
                state.lock_state = if lock.trim() == "1" {
                    LockState::Locked
                } else if lock.trim() == "0" {
                    LockState::Unlocked
                } else {
                    LockState::Unknown
                };
            }
        }
    }

    // Fallback to fastboot if no ADB device
    if state.mode == DeviceMode::None {
        let fb_devices = run_cmd("fastboot", &["devices"]).await?;
        if let Some(line) = fb_devices.lines().find(|l| l.contains("\tfastboot")) {
            let parts: Vec<&str> = line.split('\t').collect();
            state.serial = Some(parts[0].trim().to_string());
            state.mode = DeviceMode::Bootloader;

            if let Ok(userspace) = run_cmd("fastboot", &["getvar", "is-userspace"]).await {
                state.is_userspace = userspace.to_lowercase().contains("yes");
                if state.is_userspace {
                    state.mode = DeviceMode::Fastbootd;
                }
            }

            if let Ok(product) = run_cmd("fastboot", &["getvar", "product"]).await {
                state.product = extract_fastboot_var(&product, "product");
            }

            if let Ok(slot) = run_cmd("fastboot", &["getvar", "current-slot"]).await {
                state.current_slot = extract_fastboot_var(&slot, "current-slot");
            }

            if let Ok(slot_count) = run_cmd("fastboot", &["getvar", "slot-count"]).await {
                state.slot_count = extract_fastboot_var(&slot_count, "slot-count");
            }

            if let Ok(unlocked) = run_cmd("fastboot", &["getvar", "unlocked"]).await {
                state.lock_state = if unlocked.to_lowercase().contains("unlocked: yes") {
                    LockState::Unlocked
                } else if unlocked.to_lowercase().contains("unlocked: no") {
                    LockState::Locked
                } else {
                    LockState::Unknown
                };
            }
        }
    }

    // Match profile (Transsion only for now)
    let profile = state
        .manufacturer
        .as_ref()
        .zip(state.model.as_ref())
        .zip(state.product.as_ref())
        .and_then(|((mfr, mdl), prd)| {
            let p = DeviceProfile::transsion();
            if p.matches(mfr, mdl, prd) {
                Some(p)
            } else {
                None
            }
        });

    Ok(DeviceInfo { state, profile })
}

#[tauri::command]
pub async fn load_profile() -> Result<DeviceProfile, String> {
    Ok(DeviceProfile::transsion())
}

fn extract_prop(props: &str, key: &str) -> Option<String> {
    props.lines().find_map(|line| {
        if line.starts_with(&format!("[{}]", key)) {
            line.splitn(2, "]: ").nth(1).map(|s| s.trim().to_string())
        } else {
            None
        }
    })
}

fn extract_fastboot_var(output: &str, key: &str) -> Option<String> {
    output.lines().find_map(|line| {
        if line.to_lowercase().contains(&format!("{}:", key)) {
            line.splitn(2, ':').nth(1).map(|s| s.trim().to_string())
        } else {
            None
        }
    })
}
