use crate::utils::process::run_cmd;
use std::fs;

const UDEV_RULES: &str = include_str!("../../resources/51-android.rules");

#[tauri::command]
pub async fn install_udev_rules() -> Result<String, String> {
    let rules_path = "/etc/udev/rules.d/51-android-transsion-tool.rules";

    fs::write(rules_path, UDEV_RULES).map_err(|e| {
        format!(
            "Failed to write udev rules. Try running with pkexec/sudo. Error: {}",
            e
        )
    })?;

    run_cmd("udevadm", &["control", "--reload-rules"]).await?;
    run_cmd("udevadm", &["trigger"]).await?;

    Ok("Udev rules installed and reloaded. Reconnect your device.".to_string())
}
