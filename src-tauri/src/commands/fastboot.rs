use crate::utils::process::run_cmd;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct FastbootCommandArgs {
    pub args: Vec<String>,
}

#[tauri::command]
pub async fn fastboot_command(args: FastbootCommandArgs) -> Result<String, String> {
    run_cmd("fastboot", &args.args.iter().map(|s| s.as_str()).collect::<Vec<_>>()).await
}

#[tauri::command]
pub async fn fastboot_stream(
    window: tauri::Window,
    args: FastbootCommandArgs,
) -> Result<(), String> {
    crate::utils::process::run_cmd_streaming(
        "fastboot",
        &mut args.args.clone(),
        window,
        "fastboot-output",
    )
    .await
}

#[tauri::command]
pub async fn fastboot_flash(
    partition: String,
    image: String,
    slot: Option<String>,
    disable_verity: bool,
    disable_verification: bool,
) -> Result<String, String> {
    let target = if let Some(s) = slot {
        format!("{}_{}", partition, s)
    } else {
        partition
    };

    let mut args = vec!["flash".to_string(), target, image];
    if disable_verity {
        args.insert(0, "--disable-verity".to_string());
    }
    if disable_verification {
        args.insert(0, "--disable-verification".to_string());
    }

    run_cmd("fastboot", &args.iter().map(|s| s.as_str()).collect::<Vec<_>>()).await
}

#[tauri::command]
pub async fn fastboot_erase(partition: String) -> Result<String, String> {
    run_cmd("fastboot", &["erase", &partition]).await
}

#[tauri::command]
pub async fn fastboot_switch_slot(slot: String) -> Result<String, String> {
    run_cmd("fastboot", &[&format!("--set-active={}", slot)]).await
}
