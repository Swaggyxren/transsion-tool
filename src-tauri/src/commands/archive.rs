use crate::utils::process::run_cmd;
use std::path::PathBuf;

#[tauri::command]
pub async fn extract_archive(archive: String, output_dir: Option<String>) -> Result<String, String> {
    let archive_path = PathBuf::from(&archive);
    let out = output_dir.unwrap_or_else(|| {
        archive_path
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string())
    });

    run_cmd("7z", &["x", &archive, &format!("-o{}", out), "-y"]).await
}
