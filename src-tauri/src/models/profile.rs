use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnlockCommand {
    pub command: String,
    pub args: Vec<String>,
    pub confirm_on_device: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DangerousCommand {
    pub command: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceProfile {
    pub oem: String,
    pub brands: Vec<String>,
    pub models: Vec<String>,
    pub unlock_commands: Vec<UnlockCommand>,
    pub unlock_prerequisites: Vec<String>,
    pub unlock_requires_code: bool,
    pub forbidden_commands: Vec<String>,
    pub dangerous_commands: Vec<DangerousCommand>,
    pub supports_fastbootd: bool,
    pub requires_vbmeta_disable: bool,
    pub known_partitions: Vec<String>,
    pub notes: Vec<String>,
    pub image_url_template: Option<String>,
}

impl DeviceProfile {
    pub fn transsion() -> Self {
        Self {
            oem: "Transsion".to_string(),
            brands: vec!["Tecno".to_string(), "Infinix".to_string(), "Itel".to_string()],
            models: vec![
                "Pova 5".to_string(),
                "Pova 5 Pro".to_string(),
                "Pova 4".to_string(),
                "Pova 4 Pro".to_string(),
                "Spark 10".to_string(),
                "Spark 10 Pro".to_string(),
                "Note 30".to_string(),
                "Note 30 Pro".to_string(),
                "Hot 30".to_string(),
                "Hot 30i".to_string(),
                "Phantom V".to_string(),
                "Camon 20".to_string(),
                "Camon 20 Pro".to_string(),
            ],
            unlock_commands: vec![UnlockCommand {
                command: "fastboot".to_string(),
                args: vec!["flashing".to_string(), "unlock".to_string()],
                confirm_on_device: true,
                description: "Unlock bootloader via fastboot flashing unlock".to_string(),
            }],
            unlock_prerequisites: vec![
                "USB Debugging enabled".to_string(),
                "OEM Unlocking enabled".to_string(),
                "Tecno/Infinix/Itel account (2+ weeks old)".to_string(),
            ],
            unlock_requires_code: false,
            forbidden_commands: vec![
                "fastboot flashing lock".to_string(),
                "fastboot oem lock".to_string(),
            ],
            dangerous_commands: vec![
                DangerousCommand {
                    command: "fastboot erase userdata".to_string(),
                    reason: "This will wipe all user data.".to_string(),
                },
                DangerousCommand {
                    command: "fastboot flash vbmeta".to_string(),
                    reason: "Incorrect vbmeta can cause bootloop.".to_string(),
                },
            ],
            supports_fastbootd: true,
            requires_vbmeta_disable: true,
            known_partitions: vec![
                "boot".to_string(),
                "boot_a".to_string(),
                "boot_b".to_string(),
                "recovery".to_string(),
                "vbmeta".to_string(),
                "vbmeta_a".to_string(),
                "vbmeta_b".to_string(),
                "super".to_string(),
                "system".to_string(),
                "system_a".to_string(),
                "system_b".to_string(),
                "product".to_string(),
                "product_a".to_string(),
                "product_b".to_string(),
                "system_ext".to_string(),
                "system_ext_a".to_string(),
                "system_ext_b".to_string(),
                "vendor".to_string(),
                "vendor_a".to_string(),
                "vendor_b".to_string(),
                "dtbo".to_string(),
                "userdata".to_string(),
                "metadata".to_string(),
                "cache".to_string(),
            ],
            notes: vec![
                "Locking the bootloader with fastboot will BRICK your device.".to_string(),
                "Use SP Flash Tool to re-lock Transsion devices.".to_string(),
                "Always disable vbmeta verification before flashing GSIs.".to_string(),
            ],
            image_url_template: Some("https://www.gsmarena.com/{model_slug}-{id}.php".to_string()),
        }
    }

    pub fn matches(&self, manufacturer: &str, model: &str, product: &str) -> bool {
        let mfr = manufacturer.to_lowercase();
        let mdl = model.to_lowercase();
        let prd = product.to_lowercase();

        let brand_match = self.brands.iter().any(|b| mfr.contains(&b.to_lowercase()));
        let model_match = self.models.iter().any(|m| {
            let low = m.to_lowercase();
            mdl.contains(&low) || prd.contains(&low)
        });

        brand_match && model_match
    }
}
