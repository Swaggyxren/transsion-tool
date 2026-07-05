use crate::utils::paths::app_data_dir;
use std::path::PathBuf;

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RootManager {
    Magisk,
    Apatch,
    Kernelsu,
}

#[tauri::command]
pub async fn download_root_manager(manager: RootManager) -> Result<String, String> {
    let urls = match manager {
        RootManager::Magisk => (
            "Magisk-v30.6.apk",
            "https://github.com/topjohnwu/Magisk/releases/download/v30.6/Magisk-v30.6.apk",
        ),
        RootManager::Apatch => (
            "APatch_0.12.apk",
            "https://github.com/bmax121/APatch/releases/download/0.12/APatch_11107-28-g0c97438_11135-release-signed.apk",
        ),
        RootManager::Kernelsu => (
            "KernelSU_v3.0.0.apk",
            "https://github.com/tiann/KernelSU/releases/download/v3.0.0/KernelSU_v3.0.0_32179-release.apk",
        ),
    };

    let dir: PathBuf = app_data_dir()?.join("root-managers");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let path = dir.join(urls.0);
    let response = reqwest::get(urls.1).await.map_err(|e| e.to_string())?;
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    std::fs::write(&path, bytes).map_err(|e| e.to_string())?;

    Ok(path.to_string_lossy().to_string())
}
