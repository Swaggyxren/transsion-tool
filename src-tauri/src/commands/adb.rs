use crate::utils::process::{run_cmd, run_cmd_streaming};
use serde::Deserialize;
use tauri::Window;

#[derive(Debug, Deserialize)]
pub struct AdbCommandArgs {
    pub args: Vec<String>,
}

#[tauri::command]
pub async fn adb_command(args: AdbCommandArgs) -> Result<String, String> {
    let mut cmd_args = vec![];
    cmd_args.extend(args.args);
    run_cmd("adb", &cmd_args.iter().map(|s| s.as_str()).collect::<Vec<_>>()).await
}

#[tauri::command]
pub async fn adb_stream(
    window: Window,
    args: AdbCommandArgs,
) -> Result<(), String> {
    let mut cmd_args: Vec<String> = args.args;
    run_cmd_streaming("adb", &mut cmd_args, window, "adb-output").await
}

#[tauri::command]
pub async fn adb_pull(remote: String, local: String) -> Result<String, String> {
    run_cmd("adb", &["pull", &remote, &local]).await
}

#[tauri::command]
pub async fn adb_push(local: String, remote: String) -> Result<String, String> {
    run_cmd("adb", &["push", &local, &remote]).await
}

#[tauri::command]
pub async fn adb_install(apk: String, downgrade: bool) -> Result<String, String> {
    let mut args = vec!["install".to_string(), apk];
    if downgrade {
        args.insert(1, "-d".to_string());
    }
    run_cmd("adb", &args.iter().map(|s| s.as_str()).collect::<Vec<_>>()).await
}

#[tauri::command]
pub async fn adb_sideload(zip: String) -> Result<String, String> {
    run_cmd("adb", &["sideload", &zip]).await
}

#[tauri::command]
pub async fn adb_shell(command: String) -> Result<String, String> {
    run_cmd("adb", &["shell", &command]).await
}
