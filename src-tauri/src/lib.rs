// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_fs::FsExt;
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_shell::ShellExt;

/// State containing Chrome-specific configuration and process info
#[derive(Debug)]
pub struct ChromeState {
    pub data_dir: PathBuf,
    chrome_pid: Mutex<Option<u32>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // autostart
            #[cfg(desktop)]
            {
                let autostart = app.autolaunch();
                let _ = autostart.enable();
                if let Ok(is_enabled) = autostart.is_enabled() {
                    println!(
                        "Autostart is {}",
                        if is_enabled { "enabled" } else { "disabled" }
                    );
                }
            }

            // create tray and menu
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_item])?;
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            // check for updates
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                println!("checking for updates");
                update(handle).await.unwrap();
            });

            // filesystem
            let scope = app.fs_scope();
            // scope.allow_directory("*");
            // scope.allow_file("*")
            // let _ = scope.allow_file_read("*");
            // let _ = scope.allow_file_write("*");
            // let _ = scope.allow_file_delete("*");
            // let _ = scope.allow_file_rename("*");
            // let _ = scope.allow_file_create("*");
            // let _ = scope.allow_file_read_metadata("*");
            // let _ = scope.allow_file_write_metadata("*");

            println!("filesystem app data dir: {:?}", app.path().app_data_dir());

            let chrome_data_dir = app.path().app_data_dir().unwrap().join("chrome");
            println!("chrome data dir: {:?}", chrome_data_dir);

            // Manage the chrome state
            app.manage(ChromeState {
                data_dir: chrome_data_dir,
                chrome_pid: Mutex::new(None),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, launch_chrome, kill_chrome, launch_iwa])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        // alternatively we could also call update.download() and update.install() separately
        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    println!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    println!("download finished");
                },
            )
            .await?;

        println!("update installed");
        app.restart();
    } else {
        println!("no updates available");
    }

    Ok(())
}

use chrome_launcher::Launcher;
use chrome_launcher::Options;
// https://github.com/chouzz/chrome_launcher/blob/main/src/chrome_launcher.rs

const KILL_CHROME_AFTER_LAUNCH: bool = false;

#[tauri::command]
fn launch_chrome(state: tauri::State<ChromeState>, app_handle: tauri::AppHandle) {
    let mut options = Options::default();
    options.starting_url = Some("https://www.userandagents.com".to_string());

    // Convert PathBuf to string for the chrome flag
    let user_data_dir = state.data_dir.to_string_lossy().to_string();

    options.chrome_flags = Some(vec![
        // "--start-fullscreen".to_string(),
        format!("--user-data-dir={}", user_data_dir),
        "--no-first-run".to_string(),
        "--no-default-browser-check".to_string(),
        "--enable-features=IsolatedWebApps,IsolatedWebAppDevMode,ControlledFrame,AutomaticFullscreenContentSetting,WebAppBorderless".to_string(),
        "--install-isolated-web-app-from-url=http://localhost:5193".to_string()
    ]);
    let mut launcher = Launcher::new(options);
    match launcher.launch() {
        Ok(launched_chrome) => {
            println!("Launched Chrome with PID: {}", launched_chrome.pid);
            // Store the PID in state
            *state.chrome_pid.lock().unwrap() = Some(launched_chrome.pid);

            // sleep for 10 seconds... would make more sense to check for app shortcut being installed
            
            if(KILL_CHROME_AFTER_LAUNCH){
                std::thread::sleep(std::time::Duration::from_secs(10));

                let shell = app_handle.shell();
                let output = tauri::async_runtime::block_on(async move {
                    shell
                        .command("kill")
                        .args([launched_chrome.pid.to_string()])
                        .output()
                        .await
                        .unwrap()
                });
                if output.status.success() {
                    println!("Result: {:?}", String::from_utf8(output.stdout));
                } else {
                    println!("Exit with code: {}", output.status.code().unwrap());
                }
                println!("Killed Chrome with PID?: {}", launched_chrome.pid);
            }
        }
        Err(e) => {
            eprintln!("Error launching Chrome: {}", e);
        }
    }
}

#[tauri::command]
fn kill_chrome(state: tauri::State<ChromeState>, app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(pid) = *state.chrome_pid.lock().unwrap() {
        println!("TODO: killing chrome with pid: {}", pid);
        let shell = app_handle.shell();
        let output = tauri::async_runtime::block_on(async move {
            shell
                .command("kill")
                .args([pid.to_string()])
                .output()
                .await
                .unwrap()
        });
        if output.status.success() {
            println!("Result: {:?}", String::from_utf8(output.stdout));
        } else {
            println!("Exit with code: {}", output.status.code().unwrap());
        }
        Ok(())
    } else {
        Err("Chrome is not running".to_string())
    }
}

// launch IWA from '~/Applications/Chrome Apps/IWA Controlled Frame Test.app' with --enable-features flags

#[tauri::command]
fn launch_iwa(_state: tauri::State<ChromeState>, app_handle: tauri::AppHandle) -> Result<(), String> {
    let handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        let (rx, child) = handle.shell().command("/Users/luke/Applications/Chrome Apps.localized/U&A IWA Test.app/Contents/MacOS/app_mode_loader")
            .args(["--enable-features=IsolatedWebApps,IsolatedWebAppDevMode,ControlledFrame,AutomaticFullscreenContentSetting,WebAppBorderless"])
            .spawn()
            .unwrap();
    });
    Ok(())
}

// #[tauri::command]
// fn kill_iwa(state: tauri::State<ChromeState>, app_handle: tauri::AppHandle) -> Result<(), String> {
//     let shell = app_handle.shell();
//     let output = shell.command("kill").output().await.unwrap();
//     Ok(())
// }






// use tauri_plugin_shell::ShellExt;
// fn kill_process(pid: u32) -> Result<(), String> {
//     let _ = state.shell().command("kill", &[pid.to_string()]);
//     Ok(())
// }

// chrome://web-app-internals/

// Snippet from chrome launcher npm package of flags to install isolated web app

// chromeFlags: [
//     '--remote-debugging-port=9222',  // Enable DevTools protocol
//     '--no-first-run',               // Skip first run wizards
//     '--no-default-browser-check',   // Skip default browser check
//     '--enable-features=IsolatedWebApps,IsolatedWebAppDevMode,ControlledFrame,AutomaticFullscreenContentSetting,WebAppBorderless',  // Enable IWA features
//     '--install-isolated-web-app-from-url=http://localhost:5193'
//   ]
