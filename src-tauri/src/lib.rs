#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default();

  // Biometric prompts and camera scanning only exist on mobile. The desktop
  // build never registers these plugins, and the client treats their absence
  // as "nothing to unlock" / "no scanner".
  #[cfg(mobile)]
  let builder = builder
    .plugin(tauri_plugin_biometric::init())
    .plugin(tauri_plugin_barcode_scanner::init());

  builder
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
