// Strata Desktop — Tauri entry point
//
// Responsibilities:
// 1. Start the NestJS backend as a child process (port 3456)
// 2. Start the Astro frontend server as a child process (port 6543)
// 3. Wait until both servers are healthy before navigating to the frontend
// 4. Stop both servers when the app quits (incl. Cmd-Q, panic, abort)
// 5. Provide IPC commands for revealing the data folder + reading version

use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager, RunEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

const BACKEND_PORT: u16 = 3456;
const FRONTEND_PORT: u16 = 6543;

/// Build-time version metadata (injected by build.rs from scripts/version.mjs).
const APP_VERSION: &str = env!("STRATA_VERSION");
const APP_ENV: &str = env!("STRATA_ENV"); // git-state label from version.mjs
const APP_GIT_SHA: &str = env!("STRATA_GIT_SHA");

fn is_dev_build() -> bool {
    // Runtime mode must depend on Tauri build profile, not git tag cleanliness.
    cfg!(debug_assertions)
}

fn runtime_env_label() -> &'static str {
    if is_dev_build() {
        "development"
    } else {
        "production"
    }
}

/// Holds both sidecar child processes so we can clean them up on every exit
/// path (window close, RunEvent::ExitRequested, panic — Drop guarantees it).
struct SidecarProcesses {
    backend: Option<Child>,
    frontend: Option<Child>,
}

impl SidecarProcesses {
    fn shutdown_all(&mut self) {
        if let Some(ref mut child) = self.backend {
            kill_child("backend", child);
        }
        if let Some(ref mut child) = self.frontend {
            kill_child("frontend", child);
        }
        self.backend = None;
        self.frontend = None;
    }
}

impl Drop for SidecarProcesses {
    fn drop(&mut self) {
        self.shutdown_all();
    }
}

/// Where the SQLite database lives.
/// Both dev and prod Tauri builds use `<repo>/backend/.data/`.
/// This matches Docker dev (`strata-dev.db`) and Docker prod (`strata.db`),
/// so switching between the web app and the desktop app preserves data.
fn data_dir() -> std::path::PathBuf {
    let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let repo_root = manifest.parent().expect("CARGO_MANIFEST_DIR has no parent");
    repo_root.join("backend").join(".data")
}

fn ensure_data_dir() -> String {
    let dir = data_dir();
    std::fs::create_dir_all(&dir).expect("could not create data directory");
    let db_file = if is_dev_build() { "strata-dev.db" } else { "strata.db" };
    format!("file:{}", dir.join(db_file).display())
}

fn find_node() -> String {
    for candidate in &[
        "/opt/homebrew/bin/node",
        "/usr/local/bin/node",
        "/usr/bin/node",
    ] {
        if std::path::Path::new(candidate).exists() {
            return candidate.to_string();
        }
    }
    "node".to_string()
}


/// Resolve the repo root directory.
/// Bundling Node + sources into the .app is tracked in
/// `issues/bundle-node-runtime.md`; until then we use the repo layout.
fn repo_root(_app: &tauri::App) -> std::path::PathBuf {
    let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    manifest.parent().unwrap().to_path_buf()
}

fn run_prisma_migrate(backend_path: &std::path::Path, database_url: &str) -> Result<(), String> {
    let node = find_node();
    // Use the local prisma binary directly via node so this works when PATH is
    // stripped (e.g. GUI app launched from /Applications — no /opt/homebrew/bin).
    let prisma_js = backend_path
        .join("node_modules")
        .join("prisma")
        .join("build")
        .join("index.js");
    log::info!("Running prisma migrate deploy …");
    let status = Command::new(&node)
        .args([prisma_js.to_str().unwrap(), "migrate", "deploy"])
        .current_dir(backend_path)
        .env("DATABASE_URL", database_url)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .status();

    match status {
        Ok(s) if s.success() => {
            log::info!("Prisma migrate deploy succeeded");
            Ok(())
        }
        Ok(s) => Err(format!("prisma migrate deploy exited with {}", s)),
        Err(e) => Err(format!("could not run prisma migrate: {}", e)),
    }
}

fn run_prisma_seed(backend_path: &std::path::Path, database_url: &str) {
    let node = find_node();
    let prisma_js = backend_path
        .join("node_modules")
        .join("prisma")
        .join("build")
        .join("index.js");
    log::info!("Running prisma db seed …");
    let status = Command::new(&node)
        .args([prisma_js.to_str().unwrap(), "db", "seed"])
        .current_dir(backend_path)
        .env("DATABASE_URL", database_url)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .status();

    match status {
        Ok(s) if s.success() => log::info!("Prisma seed succeeded"),
        Ok(s) => log::warn!("Prisma seed exited with {}", s),
        Err(e) => log::error!("Failed to run prisma seed: {}", e),
    }
}

fn spawn_backend(
    backend_path: &std::path::Path,
    database_url: &str,
) -> Result<Child, String> {
    let node = find_node();
    let main_js = backend_path.join("dist").join("main.js");

    if !main_js.exists() {
        return Err(format!(
            "backend bundle not found at {} — run `cd backend && npm run build`",
            main_js.display()
        ));
    }

    log::info!("Starting backend: {} {}", node, main_js.display());

    Command::new(&node)
        .arg(&main_js)
        .current_dir(backend_path)
        .env("DATABASE_URL", database_url)
        .env("PORT", BACKEND_PORT.to_string())
        .env("NODE_ENV", "production")
        .env("ENABLE_SWAGGER", "false")
        .env("ALLOWED_ORIGINS", "tauri://localhost,http://localhost:6543")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to start NestJS backend: {} (is Node.js installed?)", e))
}

fn spawn_frontend(front_path: &std::path::Path) -> Result<Child, String> {
    let node = find_node();
    let entry = front_path.join("dist").join("server").join("entry.mjs");

    if !entry.exists() {
        return Err(format!(
            "frontend bundle not found at {} — run `cd front && npm run build`",
            entry.display()
        ));
    }

    log::info!("Starting frontend: {} {}", node, entry.display());

    Command::new(&node)
        .arg(&entry)
        .current_dir(front_path)
        .env("HOST", "0.0.0.0")
        .env("PORT", FRONTEND_PORT.to_string())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to start Astro frontend: {} (is Node.js installed?)", e))
}

fn wait_for_server(url: &str, name: &str, max_attempts: u32) -> bool {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .unwrap();

    for attempt in 1..=max_attempts {
        match client.get(url).send() {
            Ok(resp) if resp.status().is_success() => {
                log::info!("{} healthy after {} attempts", name, attempt);
                return true;
            }
            _ => {
                log::info!("{} health check {}/{} …", name, attempt, max_attempts);
                thread::sleep(Duration::from_millis(500));
            }
        }
    }
    log::error!("{} did not become healthy after {} attempts", name, max_attempts);
    false
}

#[tauri::command]
fn reveal_data_folder() {
    let dir = data_dir();
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(&dir).spawn();
    }
}

#[tauri::command]
fn get_backend_url() -> String {
    format!("http://localhost:{}", BACKEND_PORT)
}

#[tauri::command]
fn get_app_version() -> serde_json::Value {
    serde_json::json!({
        "version": APP_VERSION,
        "env": runtime_env_label(),
        "gitSha": APP_GIT_SHA,
    })
}

fn kill_child(name: &str, child: &mut Child) {
    log::info!("Shutting down {} (pid={}) …", name, child.id());
    let _ = child.kill();
    let _ = child.wait();
}

fn window_title() -> String {
    if is_dev_build() {
        format!("Strata {} (DEV)", APP_VERSION)
    } else {
        format!("Strata {}", APP_VERSION)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let sidecars: Arc<Mutex<SidecarProcesses>> = Arc::new(Mutex::new(SidecarProcesses {
        backend: None,
        frontend: None,
    }));
    let sidecars_for_setup = Arc::clone(&sidecars);
    let sidecars_for_window = Arc::clone(&sidecars);
    let sidecars_for_run = Arc::clone(&sidecars);

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(if is_dev_build() {
                        log::LevelFilter::Debug
                    } else {
                        log::LevelFilter::Info
                    })
                    .max_file_size(10 * 1024 * 1024)
                    .build(),
            )?;

            log::info!(
                "Strata desktop starting — version={} runtime_env={} build_env={} sha={}",
                APP_VERSION,
                runtime_env_label(),
                APP_ENV,
                APP_GIT_SHA
            );

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title(&window_title());
            }

            let reveal_item = MenuItemBuilder::with_id("reveal-data", "Reveal Data Folder")
                .build(app)?;
            let about_item = MenuItemBuilder::with_id(
                "about-strata",
                format!("About Strata ({})", APP_VERSION),
            )
            .build(app)?;
            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&reveal_item)
                .separator()
                .close_window()
                .build()?;
            let app_menu = SubmenuBuilder::new(app, "Strata")
                .item(&about_item)
                .separator()
                .quit()
                .build()?;
            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;
            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&file_menu)
                .item(&edit_menu)
                .build()?;
            app.set_menu(menu)?;

            // Check BEFORE ensure_data_dir so we can detect a fresh install.
            // ensure_data_dir only creates the directory; prisma migrate creates the file.
            let db_filename = if is_dev_build() { "strata-dev.db" } else { "strata.db" };
            let is_fresh_db = !data_dir().join(db_filename).exists();

            let database_url = ensure_data_dir();
            log::info!("Database URL: {}", database_url);

            let root = repo_root(app);
            let backend_path = root.join("backend");
            let front_path = root.join("front");
            log::info!("Backend path: {}", backend_path.display());
            log::info!("Frontend path: {}", front_path.display());

            if let Err(e) = run_prisma_migrate(&backend_path, &database_url) {
                let msg = format!("Database migration failed:\n{}", e);
                log::error!("{}", msg);
                app.dialog()
                    .message(&msg)
                    .title("Strata — startup error")
                    .kind(MessageDialogKind::Error)
                    .blocking_show();
                std::process::exit(1);
            }
            if is_fresh_db {
                log::info!("Fresh database detected — running seed.");
                run_prisma_seed(&backend_path, &database_url);
            } else {
                log::info!("Existing database detected — skipping seed.");
            }

            let backend = match spawn_backend(&backend_path, &database_url) {
                Ok(c) => c,
                Err(e) => {
                    log::error!("{}", e);
                    app.dialog()
                        .message(&e)
                        .title("Strata — backend failed to start")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                    std::process::exit(1);
                }
            };
            let frontend = match spawn_frontend(&front_path) {
                Ok(c) => c,
                Err(e) => {
                    log::error!("{}", e);
                    app.dialog()
                        .message(&e)
                        .title("Strata — frontend failed to start")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                    std::process::exit(1);
                }
            };
            {
                let mut s = sidecars_for_setup.lock().unwrap();
                s.backend = Some(backend);
                s.frontend = Some(frontend);
            }

            let handle = app.handle().clone();
            thread::spawn(move || {
                let backend_url = format!("http://localhost:{}/api/v1/health", BACKEND_PORT);
                let frontend_url = format!("http://localhost:{}/", FRONTEND_PORT);

                let backend_ok = wait_for_server(&backend_url, "Backend", 30);
                let frontend_ok = wait_for_server(&frontend_url, "Frontend", 30);

                if backend_ok && frontend_ok {
                    log::info!("All services ready — navigating to frontend");
                    let _ = handle.emit("backend-ready", true);
                } else {
                    log::error!("Some services failed to start");
                    let _ = handle.emit("backend-ready", false);
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.dialog()
                            .message("One of Strata's background services did not become healthy. Check the logs (Help → Reveal Data Folder).")
                            .title("Strata — services not ready")
                            .kind(MessageDialogKind::Warning)
                            .blocking_show();
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            reveal_data_folder,
            get_backend_url,
            get_app_version
        ])
        .on_menu_event(|app, event| match event.id().as_ref() {
            "reveal-data" => reveal_data_folder(),
            "about-strata" => {
                let body = format!(
                    "Strata {}\n\nEnvironment: {}\nGit: {}\n\nData folder:\n{}",
                    APP_VERSION,
                    runtime_env_label(),
                    APP_GIT_SHA,
                    data_dir().display()
                );
                app.dialog()
                    .message(body)
                    .title("About Strata")
                    .kind(MessageDialogKind::Info)
                    .show(|_| {});
            }
            _ => {}
        })
        .on_window_event(move |_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Ok(mut s) = sidecars_for_window.lock() {
                    s.shutdown_all();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building Strata desktop application");

    // RunEvent::ExitRequested ensures cleanup on Cmd-Q paths that don't
    // route through Window::Destroyed.
    app.run(move |_app_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {
            if let Ok(mut s) = sidecars_for_run.lock() {
                s.shutdown_all();
            }
        }
    });
}
