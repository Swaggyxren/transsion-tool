mod commands;
mod models;
mod utils;

use commands::{adb, archive, device, download, fastboot, flash, scrcpy};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            device::detect_device,
            device::load_profile,
            adb::adb_command,
            adb::adb_stream,
            adb::adb_pull,
            adb::adb_push,
            adb::adb_install,
            adb::adb_sideload,
            adb::adb_shell,
            fastboot::fastboot_command,
            fastboot::fastboot_stream,
            fastboot::fastboot_flash,
            fastboot::fastboot_erase,
            fastboot::fastboot_switch_slot,
            flash::flash_gsi,
            flash::flash_image,
            download::download_root_manager,
            archive::extract_archive,
            scrcpy::launch_scrcpy,
            utils::paths::get_app_data_dir,
            utils::paths::get_placebo_path,
            utils::wallpaper::get_wallpaper_color,
            utils::udev::install_udev_rules,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
