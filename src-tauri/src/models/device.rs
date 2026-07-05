use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "snake_case")]
pub enum DeviceMode {
    #[default]
    None,
    Adb,
    Recovery,
    Sideload,
    Bootloader,
    Fastbootd,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "snake_case")]
pub enum LockState {
    #[default]
    Unknown,
    Locked,
    Unlocked,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DeviceState {
    pub mode: DeviceMode,
    pub serial: Option<String>,
    pub product: Option<String>,
    pub manufacturer: Option<String>,
    pub model: Option<String>,
    pub android_version: Option<String>,
    pub api_level: Option<String>,
    pub bootloader_version: Option<String>,
    pub current_slot: Option<String>,
    pub slot_count: Option<String>,
    pub lock_state: LockState,
    pub is_userspace: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub state: DeviceState,
    pub profile: Option<super::profile::DeviceProfile>,
}
