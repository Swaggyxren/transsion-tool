use image::imageops::FilterType;
use std::path::PathBuf;
use std::process::Command;

#[tauri::command]
pub async fn get_wallpaper_color() -> Result<String, String> {
    let path = get_wallpaper_path()?;
    if !path.exists() {
        return Err("Wallpaper not found".to_string());
    }

    let img = image::open(&path).map_err(|e| e.to_string())?;
    let resized = img.resize(64, 64, FilterType::Triangle);
    let rgba = resized.to_rgba8();

    let (mut r, mut g, mut b, mut count) = (0u64, 0u64, 0u64, 0u64);
    for pixel in rgba.pixels() {
        let [pr, pg, pb, _] = pixel.0;
        r += pr as u64;
        g += pg as u64;
        b += pb as u64;
        count += 1;
    }

    if count == 0 {
        return Err("Could not extract wallpaper color".to_string());
    }

    let hex = format!(
        "#{:02x}{:02x}{:02x}",
        (r / count) as u8,
        (g / count) as u8,
        (b / count) as u8
    );
    Ok(hex)
}

fn get_wallpaper_path() -> Result<PathBuf, String> {
    // Try GNOME
    if let Ok(output) = Command::new("gsettings")
        .args(["get", "org.gnome.desktop.background", "picture-uri"])
        .output()
    {
        let uri = String::from_utf8_lossy(&output.stdout);
        let path = uri
            .trim()
            .trim_start_matches("file://")
            .trim_matches('\'');
        if !path.is_empty() {
            return Ok(PathBuf::from(path));
        }
    }

    // Try KDE
    if let Ok(output) = Command::new("kreadconfig5")
        .args(["--file", "kwinrc", "--group", "Desktops", "--key", "wallpaper"])
        .output()
    {
        let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !name.is_empty() {
            // Simplified fallback for KDE
            return Ok(PathBuf::from(format!(
                "/usr/share/wallpapers/{}/contents/images/default.png",
                name
            )));
        }
    }

    Err("Could not detect wallpaper path".to_string())
}
