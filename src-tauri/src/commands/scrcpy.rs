use tauri::command;
use tauri_plugin_shell::ShellExt;

#[command]
pub async fn launch_scrcpy(app: tauri::AppHandle) -> Result<(), String> {
    app.shell()
        .command("scrcpy")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}
