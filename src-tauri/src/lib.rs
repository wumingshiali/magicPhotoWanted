use std::io::Write;

use base64::{engine::general_purpose::STANDARD, Engine as _};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::{FsExt, OpenOptions};

/// Shows the native save dialog and writes the generated poster to disk.
///
/// The dialog and file-system plugins are used instead of a desktop-only
/// implementation so the same command also works on Android and iOS, where
/// the picker returns a scoped content / file URL.
/// The image is handed over as base64 because Tauri IPC is JSON based.
#[tauri::command]
async fn save_poster(
    app: tauri::AppHandle,
    base64_data: String,
    default_name: String,
) -> Result<Option<String>, String> {
    let bytes = STANDARD
        .decode(base64_data.as_bytes())
        .map_err(|error| format!("海报数据无效：{error}"))?;

    let file_name = if default_name.to_ascii_lowercase().ends_with(".png") {
        default_name
    } else {
        format!("{default_name}.png")
    };

    let dialog_app = app.clone();
    let path = tauri::async_runtime::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .set_title("保存通缉令海报")
            .set_file_name(&file_name)
            .add_filter("PNG 图片", &["png"])
            .blocking_save_file()
    })
    .await
    .map_err(|error| format!("无法打开保存对话框：{error}"))?;

    let Some(path) = path else {
        return Ok(None);
    };

    let mut options = OpenOptions::new();
    options.read(false).write(true).create(true).truncate(true);

    #[cfg(target_os = "ios")]
    let write_path = path.clone();

    let mut file = app
        .fs()
        .open(path.clone(), options)
        .map_err(|error| format!("无法写入文件：{error}"))?;
    file.write_all(&bytes)
        .map_err(|error| format!("无法写入文件：{error}"))?;
    file.flush()
        .map_err(|error| format!("无法写入文件：{error}"))?;
    drop(file);

    #[cfg(target_os = "ios")]
    let _ = app.fs().stop_accessing_security_scoped_resource(write_path);

    Ok(Some(path.to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![save_poster])
        .run(tauri::generate_context!())
        .expect("failed to run Magic Photo");
}
