// Strata Desktop — Tauri entry point
//
// Responsibilities:
// 1. Start the NestJS backend as a child process (sidecar)
// 2. Wait until the backend is healthy before showing the window
// 3. Stop the backend when the app quits
// 4. Provide IPC commands for backup/restore and revealing the data folder

use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Manager};

/// Port used by the embedded NestJS backend
const BACKEND_PORT: u16 = 3456;

/// Where the SQLite database lives on macOS
fn data_dir() -> std::path::PathBuf {
    let mut dir = dirs::data_dir().expect("could not determine app data directory");
    dir.push("Strata");
    dir
}

/// Ensure the data directory exists and return the DATABASE_URL
fn ensure_data_dir() -> String {
    let dir = data_dir();
    std::fs::create_dir_all(&dir).expect("could not create data directory");
    // Prisma SQLite URL format: file:/absolute/path/to/strata.db
    format!("file:{}", dir.join("strata.db").display())
}

/// Locate the `node` binary on the system
fn find_node() -> String {
    // Common Homebrew paths on Apple Silicon / Intel, plus system default
    for candidate in &[
        "/opt/homebrew/bin/node",
        "/usr/local/bin/node",
        "/usr/bin/node",
    ] {
        if std::path::Path::new(candidate).exists() {
            return candidate.to_string();
        }
    }
    // Fall back to PATH lookup
    "node".to_string()
}

/// Locate the `npx` binary on the system
fn find_npx() -> String {
    for candidate in &[
        "/opt/homebrew/bin/npx",
        "/usr/local/bin/npx",
        "/usr/bin/npx",
    ] {
        if std::path::Path::new(candidate).exists() {
            return candidate.to_string();
        }
    }
    "npx".to_string()
}

/// Resolve the backend directory.
/// In dev mode the repo layout is used; in production the resources are
/// bundled inside the .app bundle.
fn backend_dir(app: &tauri::App) -> std::path::PathBuf {
    if cfg!(debug_assertions) {
        // Dev mode — repo-root/backend/
        let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        manifest.parent().unwrap().join("backend")
    } else {
        // Production — resources are copied into the bundle
        app.path()
            .resource_dir()
            .expect("could not find resource dir")
    }
}

/// Run `npx prisma migrate deploy` to ensure the DB schema is up to date.
fn run_prisma_migrate(backend_path: &std::path::Path, database_url: &str) {
    let npx = find_npx();
    log::info!("Running prisma migrate deploy from {}", backend_path.display());
    let status = Command::new(&npx)
        .args(["prisma", "migrate", "deploy"])
        .current_dir(backend_path)
        .env("DATABASE_URL", database_url)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .status();

    match status {
        Ok(s) if s.success() => log::info!("Prisma migrate deploy succeeded"),
        Ok(s) => log::warn!("Prisma migrate deploy exited with {}", s),
        Err(e) => log::error!("Failed to run prisma migrate: {}", e),
    }
}

/// Run `npx prisma db seed` to seed reference data.
fn run_prisma_seed(backend_path: &std::path::Path, database_url: &str) {
    let npx = find_npx();
    log::info!("Running prisma db seed from {}", backend_path.display());
    let status = Command::new(&npx)
        .args(["prisma", "db", "seed"])
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

/// Spawn the NestJS backend and return the child process handle.
fn spawn_backend(backend_path: &std::path::Path, database_url: &str) -> Child {
    let node = find_node();
    let main_js = backend_path.join("dist").join("main.js");

    log::info!(
        "Starting backend: {} {} (cwd={})",
        node,
        main_js.display(),
        backend_path.display()
    );

    Command::new(&node)
        .arg(&main_js)
        .current_dir(backend_path)
        .env("DATABASE_URL", database_url)
        .env("PORT", BACKEND_PORT.to_string())
        .env("NODE_ENV", "production")
        .env("ENABLE_SWAGGER", "false")
        .env("ALLOWED_ORIGINS", "tauri://localhost,http://localhost:4321")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .expect("failed to start NestJS backend — is Node.js installed?")
}

/// Poll the backend health endpoint until it responds 200 or we give up.
fn wait_for_backend(max_attempts: u32) -> bool {
    let url = format!("http://localhost:{}/api/v1/health", BACKEND_PORT);
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .unwrap();

    for attempt in 1..=max_attempts {
        match client.get(&url).send() {
            Ok(resp) if resp.status().is_success() => {
                log::info!("Backend healthy after {} attempts", attempt);
                return true;
            }
            _ => {
                log::info!("Health check attempt {}/{} …", attempt, max_attempts);
                thread::sleep(Duration::from_millis(500));
            }
        }
    }
    log::error!("Backend did not become healthy after {} attempts", max_attempts);
    false
}

/// Tauri IPC: reveal the data folder in Finder
#[tauri::command]
fn reveal_data_folder() {
    let dir = data_dir();
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(&dir).spawn();
    }
}

/// Tauri IPC: get the backend base URL
#[tauri::command]
fn get_backend_url() -> String {
    format!("http://localhost:{}", BACKEND_PORT)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Shared handle so we can kill the backend on exit
    let backend_child: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    let child_for_setup = Arc::clone(&backend_child);
    let child_for_exit = Arc::clone(&backend_child);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            // Always enable logging in dev; in release only info+
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(if cfg!(debug_assertions) {
                        log::LevelFilter::Debug
                    } else {
                        log::LevelFilter::Info
                    })
                    .build(),
            )?;

            // ── E3: Ensure data directory & DATABASE_URL ──
            let database_url = ensure_data_dir();
            log::info!("Database URL: {}", database_url);

            // ── Resolve backend path ──
            let backend_path = backend_dir(app);
            log::info!("Backend path: {}", backend_path.display());

            // ── Run Prisma migrations & seed ──
            run_prisma_migrate(&backend_path, &database_url);
            run_prisma_seed(&backend_path, &database_url);

            // ── E2: Spawn the backend ──
            let child = spawn_backend(&backend_path, &database_url);
            *child_for_setup.lock().unwrap() = Some(child);

            // ── Health-poll in a background thread, then emit event ──
            let handle = app.handle().clone();
            thread::spawn(move || {
                if wait_for_backend(30) {
                    let _ = handle.emit("backend-ready", true);
                } else {
                    let _ = handle.emit("backend-ready", false);
                    log::error!("Backend failed to start — app may not function correctly");
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![reveal_data_folder, get_backend_url])
        .on_window_event(move |_window, event| {
            // Kill the backend when the app window is destroyed
            if let tauri::WindowEvent::Destroyed = event {
                if let Ok(mut guard) = child_for_exit.lock() {
                    if let Some(ref mut child) = *guard {
                        log::info!("Shutting down backend (pid={})", child.id());
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Strata desktop application");
}
