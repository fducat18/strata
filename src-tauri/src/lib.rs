// Strata Desktop — Tauri entry point
//
// Responsibilities:
// 1. Start the NestJS backend as a child process (port 3456)
// 2. Start the Astro frontend server as a child process (port 4321)
// 3. Wait until both servers are healthy before navigating to the frontend
// 4. Stop both servers when the app quits
// 5. Provide IPC commands for revealing the data folder

use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::Emitter;

/// Port used by the embedded NestJS backend
const BACKEND_PORT: u16 = 3456;
/// Port used by the Astro frontend SSR server
const FRONTEND_PORT: u16 = 4321;

/// Holds both sidecar child processes so we can clean them up on exit
struct SidecarProcesses {
    backend: Option<Child>,
    frontend: Option<Child>,
}

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

/// Resolve the repo root directory.
/// In dev mode: use CARGO_MANIFEST_DIR parent.
/// In production: use the resource directory inside the .app bundle.
fn repo_root(_app: &tauri::App) -> std::path::PathBuf {
    // For both dev and production, we use the repo layout.
    // Production bundling is a future improvement.
    let manifest = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    manifest.parent().unwrap().to_path_buf()
}

/// Run `npx prisma migrate deploy` to ensure the DB schema is up to date.
fn run_prisma_migrate(backend_path: &std::path::Path, database_url: &str) {
    let npx = find_npx();
    log::info!("Running prisma migrate deploy …");
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
    log::info!("Running prisma db seed …");
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

    log::info!("Starting backend: {} {}", node, main_js.display());

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

/// Spawn the Astro SSR frontend and return the child process handle.
fn spawn_frontend(front_path: &std::path::Path) -> Child {
    let node = find_node();
    let entry = front_path.join("dist").join("server").join("entry.mjs");

    log::info!("Starting frontend: {} {}", node, entry.display());

    Command::new(&node)
        .arg(&entry)
        .current_dir(front_path)
        .env("HOST", "0.0.0.0")
        .env("PORT", FRONTEND_PORT.to_string())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .expect("failed to start Astro frontend — is Node.js installed?")
}

/// Poll an HTTP endpoint until it responds 200 or we give up.
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

/// Tauri IPC: reveal the data folder in Finder
#[tauri::command]
fn reveal_data_folder() {
    let dir = data_dir();
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(&dir).spawn();
    }
}

/// Tauri IPC: get the backend base URL (for the frontend to call the API)
#[tauri::command]
fn get_backend_url() -> String {
    format!("http://localhost:{}", BACKEND_PORT)
}

/// Kill a child process and wait for it to exit
fn kill_child(name: &str, child: &mut Child) {
    log::info!("Shutting down {} (pid={}) …", name, child.id());
    let _ = child.kill();
    let _ = child.wait();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Shared handle so we can kill both sidecars on exit
    let sidecars: Arc<Mutex<SidecarProcesses>> = Arc::new(Mutex::new(SidecarProcesses {
        backend: None,
        frontend: None,
    }));
    let sidecars_for_setup = Arc::clone(&sidecars);
    let sidecars_for_exit = Arc::clone(&sidecars);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            // Logging
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

            // ── Resolve paths ──
            let root = repo_root(app);
            let backend_path = root.join("backend");
            let front_path = root.join("front");
            log::info!("Backend path: {}", backend_path.display());
            log::info!("Frontend path: {}", front_path.display());

            // ── Run Prisma migrations & seed ──
            run_prisma_migrate(&backend_path, &database_url);
            run_prisma_seed(&backend_path, &database_url);

            // ── E2: Spawn both sidecars ──
            let backend = spawn_backend(&backend_path, &database_url);
            let frontend = spawn_frontend(&front_path);
            {
                let mut s = sidecars_for_setup.lock().unwrap();
                s.backend = Some(backend);
                s.frontend = Some(frontend);
            }

            // ── Health-poll in a background thread, then emit event ──
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
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![reveal_data_folder, get_backend_url])
        .on_window_event(move |_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Ok(mut s) = sidecars_for_exit.lock() {
                    if let Some(ref mut child) = s.backend {
                        kill_child("backend", child);
                    }
                    if let Some(ref mut child) = s.frontend {
                        kill_child("frontend", child);
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Strata desktop application");
}
