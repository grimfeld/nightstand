#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default();

  // Biometric prompts only exist on mobile. The desktop build never registers
  // the plugin, and the client treats its absence as "nothing to unlock".
  #[cfg(mobile)]
  let builder = builder.plugin(tauri_plugin_biometric::init());

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
