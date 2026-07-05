use std::path::PathBuf;
use directories::BaseDirs;
use tauri::command;
use tauri::Manager;

pub fn app_data_dir() -> Result<PathBuf, String> {
    BaseDirs::new()
        .map(|dirs| dirs.data_dir().join("transsion-tool"))
        .ok_or_else(|| "Could not determine app data directory".to_string())
}

#[command]
pub fn get_app_data_dir() -> Result<String, String> {
    app_data_dir().map(|p| p.to_string_lossy().to_string())
}

#[command]
pub fn get_placebo_path(app: tauri::AppHandle) -> Result<String, String> {
    let resource_path = app
        .path()
        .resolve("resources/placebo.img", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve resource path: {}", e))?;
    Ok(resource_path.to_string_lossy().to_string())
}
