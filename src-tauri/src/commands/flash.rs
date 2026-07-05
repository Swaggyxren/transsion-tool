use crate::utils::process::run_cmd;

#[tauri::command]
pub async fn flash_image(
    image: String,
    partition: String,
    slot: Option<String>,
) -> Result<String, String> {
    let target = if let Some(s) = slot {
        format!("{}_{}", partition, s)
    } else {
        partition
    };
    run_cmd("fastboot", &["flash", &target, &image]).await
}

#[tauri::command]
pub async fn flash_gsi(
    gsi_image: String,
    slot: Option<String>,
    empty_image: String,
) -> Result<String, String> {
    let system_part = if let Some(s) = slot.clone() {
        format!("system_{}", s)
    } else {
        "system".to_string()
    };
    let product_part = if let Some(s) = slot.clone() {
        format!("product_{}", s)
    } else {
        "product".to_string()
    };
    let system_ext_part = if let Some(s) = slot.clone() {
        format!("system_ext_{}", s)
    } else {
        "system_ext".to_string()
    };

    // Reboot to fastbootd
    let _ = run_cmd("fastboot", &["reboot", "fastboot"]).await;
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;

    // Flash empty images to product and system_ext
    let mut output = String::new();
    output.push_str(&run_cmd("fastboot", &["flash", &product_part, &empty_image]).await?);
    output.push_str(&run_cmd("fastboot", &["flash", &system_ext_part, &empty_image]).await?);

    // Flash GSI to system
    output.push_str(&run_cmd("fastboot", &["flash", &system_part, &gsi_image]).await?);

    // Wipe data
    output.push_str(&run_cmd("fastboot", &["erase", "userdata"]).await?);
    output.push_str(&run_cmd("fastboot", &["erase", "metadata"]).await?);

    Ok(output)
}
