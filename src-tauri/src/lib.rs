use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::ffi::OsStrExt;

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    SystemParametersInfoW, SPI_SETDESKWALLPAPER, SPIF_SENDWININICHANGE, SPIF_UPDATEINIFILE,
};

#[tauri::command]
fn save_wallpaper(bytes: Vec<u8>, filename: String) -> Result<String, String> {
    let downloads = dirs::download_dir()
        .ok_or_else(|| "Could not find Downloads folder".to_string())?;
    let path = downloads.join(&filename);
    std::fs::write(&path, &bytes).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn set_wallpaper(bytes: Vec<u8>, filename: String) -> Result<String, String> {
    let tmp_dir = std::env::temp_dir().join("wllpr");
    std::fs::create_dir_all(&tmp_dir).map_err(|e| e.to_string())?;
    let path = tmp_dir.join(&filename);
    std::fs::write(&path, &bytes).map_err(|e| e.to_string())?;

    let path_str = path.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        let script = format!(
            r#"
            tell application "System Events"
                tell every desktop
                    set picture to "{}"
                end tell
            end tell
            "#,
            path_str
        );

        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let home = std::env::var("HOME").map_err(|e| e.to_string())?;
            let db_path = format!("{}/Library/Application Support/Dock/desktoppicture.db", home);

            let _ = Command::new("sqlite3")
                .arg(&db_path)
                .arg(format!("UPDATE data SET value = '{}';", path_str))
                .output();

            let _ = Command::new("killall").arg("Dock").output();
        }
    }

    #[cfg(target_os = "windows")]
    {
        let wide_path = path
            .as_os_str()
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();

        let ok = unsafe {
            SystemParametersInfoW(
                SPI_SETDESKWALLPAPER,
                0,
                Some(wide_path.as_ptr() as *mut _),
                SPIF_UPDATEINIFILE | SPIF_SENDWININICHANGE,
            )
        }
        .is_ok();

        if !ok {
            return Err(std::io::Error::last_os_error().to_string());
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        return Err("Setting wallpaper is not supported on this platform".to_string());
    }

    Ok(path_str)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_wallpaper, set_wallpaper])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
