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
    // Portable mode: check alongside the exe first
    if let Ok(exe_dir) = app.path().resource_dir() {
        let sidecar = exe_dir.join("placebo.img");
        if sidecar.exists() {
            return Ok(sidecar.to_string_lossy().to_string());
        }
    }

    // Bundled mode: resolve from app resources
    let resource_path = app
        .path()
        .resolve("resources/placebo.img", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve resource path: {}", e))?;

    if resource_path.exists() {
        return Ok(resource_path.to_string_lossy().to_string());
    }

    Err("placebo.img not found — place it alongside the executable or install the app properly.".to_string())
}
