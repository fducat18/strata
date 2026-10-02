// Strata Desktop — Tauri entry point
//
// Responsibilities:
// 1. Start the NestJS backend as a child process (port 3456)
// 2. Start the NestJS backend sidecar (desktop-only API, localhost protected)
// 3. Wait until backend is healthy, then notify the bundled frontend loader
// 4. Stop sidecars when the app quits (incl. Cmd-Q, panic, abort)
// 5. Provide IPC commands for revealing the data folder + reading version

use rand::RngCore;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager, RunEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

const BACKEND_PORT: u16 = 3456;
const DESKTOP_TOKEN_HEADER: &str = "X-Strata-Desktop-Token";
const DESKTOP_TOKEN_ENV: &str = "STRATA_DESKTOP_API_TOKEN";
const BACKEND_PID_FILE: &str = "strata-desktop-backend.pid";

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
    backend_pid_file: Option<PathBuf>,
}

impl SidecarProcesses {
    fn shutdown_all(&mut self) {
        if let Some(ref mut child) = self.backend {
            kill_child("backend", child);
        }
        if let Some(ref pid_file) = self.backend_pid_file {
            let _ = fs::remove_file(pid_file);
        }
        self.backend = None;
        self.backend_pid_file = None;
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
    let db_file = if is_dev_build() {
        "strata-dev.db"
    } else {
        "strata.db"
    };
    format!("file:{}", dir.join(db_file).display())
}

fn backend_pid_file_path() -> PathBuf {
    data_dir().join(BACKEND_PID_FILE)
}

fn random_hex_token() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

fn resolve_node_binary_with<F>(
    path_exists: F,
    build_time_node: Option<&str>,
    home_dir: Option<&Path>,
) -> String
where
    F: Fn(&str) -> bool,
{
    let mut candidates: Vec<String> = Vec::new();

    if let Some(path) = build_time_node
        .map(str::trim)
        .filter(|path| !path.is_empty())
    {
        candidates.push(path.to_string());
    }

    for candidate in [
        "/opt/homebrew/bin/node",
        "/usr/local/bin/node",
        "/usr/bin/node",
    ] {
        candidates.push(candidate.to_string());
    }

    if let Some(home) = home_dir {
        candidates.push(
            home.join(".local")
                .join("bin")
                .join("node")
                .to_string_lossy()
                .to_string(),
        );
    }

    for candidate in candidates {
        if path_exists(&candidate) {
            return candidate;
        }
    }

    "node".to_string()
}

fn find_node() -> String {
    let home_dir = std::env::var_os("HOME").map(PathBuf::from);
    resolve_node_binary_with(
        |candidate| Path::new(candidate).exists(),
        option_env!("STRATA_NODE_PATH"),
        home_dir.as_deref(),
    )
}

fn prisma_package_dir(backend_path: &Path) -> PathBuf {
    backend_path.join("node_modules").join("prisma")
}

fn prisma_package_json_path(backend_path: &Path) -> PathBuf {
    prisma_package_dir(backend_path).join("package.json")
}

fn add_candidate(candidates: &mut Vec<PathBuf>, candidate: PathBuf) {
    if !candidates.iter().any(|existing| existing == &candidate) {
        candidates.push(candidate);
    }
}

fn prisma_cli_js_candidates(backend_path: &Path) -> Vec<PathBuf> {
    let prisma_dir = prisma_package_dir(backend_path);
    let mut candidates: Vec<PathBuf> = Vec::new();

    let package_json_path = prisma_package_json_path(backend_path);
    if let Ok(package_json_raw) = fs::read_to_string(&package_json_path) {
        if let Ok(package_json) = serde_json::from_str::<serde_json::Value>(&package_json_raw) {
            let bin_rel = match package_json.get("bin") {
                Some(serde_json::Value::String(single_bin)) => Some(single_bin.clone()),
                Some(serde_json::Value::Object(bin_obj)) => bin_obj
                    .get("prisma")
                    .or_else(|| bin_obj.values().next())
                    .and_then(|v| v.as_str())
                    .map(str::to_string),
                _ => None,
            };
            if let Some(bin_rel) = bin_rel {
                let rel = bin_rel.trim_start_matches("./");
                add_candidate(&mut candidates, prisma_dir.join(rel));
            }
        }
    }

    for fallback in ["build/index.js", "dist/cli/src/bin.js", "dist/index.js"] {
        add_candidate(&mut candidates, prisma_dir.join(fallback));
    }

    candidates
}

fn ensure_prisma_cli_js(backend_path: &Path) -> Result<PathBuf, String> {
    let candidates = prisma_cli_js_candidates(backend_path);
    if let Some(found) = candidates.into_iter().find(|candidate| candidate.exists()) {
        return Ok(found);
    }

    let checked_paths = prisma_cli_js_candidates(backend_path)
        .iter()
        .map(|p| p.display().to_string())
        .collect::<Vec<String>>()
        .join(", ");

    Err(format!(
        "prisma CLI not found. Checked: [{}] — run `npm run tauri:install` from repo root (or `cd backend && npm ci`)",
        checked_paths
    ))
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
    let prisma_js = ensure_prisma_cli_js(backend_path)?;
    let prisma_js_arg = prisma_js.to_string_lossy().into_owned();
    log::info!("Running prisma migrate deploy …");
    let status = Command::new(&node)
        .args([prisma_js_arg.as_str(), "migrate", "deploy"])
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
        Err(e) => Err(format!(
            "could not run prisma migrate with node '{}': {}",
            node, e
        )),
    }
}

fn run_prisma_seed(
    backend_path: &std::path::Path,
    database_url: &str,
    seed_profile: &str,
) -> Result<(), String> {
    let node = find_node();
    let prisma_js = ensure_prisma_cli_js(backend_path)?;
    let prisma_js_arg = prisma_js.to_string_lossy().into_owned();
    log::info!("Running prisma db seed with {} profile …", seed_profile);
    let output = Command::new(&node)
        .args([prisma_js_arg.as_str(), "db", "seed"])
        .current_dir(backend_path)
        .env("DATABASE_URL", database_url)
        .env("STRATA_SEED_PROFILE", seed_profile)
        .output()
        .map_err(|e| format!("could not run prisma seed with node '{}': {}", node, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        if !stdout.is_empty() {
            log::info!("Prisma seed output:\n{}", stdout);
        }
        if !stderr.is_empty() {
            log::warn!("Prisma seed warnings:\n{}", stderr);
        }
        log::info!("Prisma seed succeeded");
        return Ok(());
    }

    Err(format!(
        "prisma db seed exited with {}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        if stdout.is_empty() { "<empty>" } else { &stdout },
        if stderr.is_empty() { "<empty>" } else { &stderr }
    ))
}

fn read_asset_type_count(backend_path: &std::path::Path, database_url: &str) -> Result<u64, String> {
    let node = find_node();
    let script = r#"
const { fileURLToPath } = require('node:url');
const Database = require('better-sqlite3');

const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl.startsWith('file:')) {
  console.error(`Unsupported DATABASE_URL for desktop sqlite probe: ${databaseUrl}`);
  process.exit(1);
}

const dbPath = fileURLToPath(new URL(databaseUrl));
const db = new Database(dbPath, { readonly: true, fileMustExist: true });
const row = db.prepare('SELECT COUNT(*) AS count FROM asset_types').get();
db.close();
process.stdout.write(String(Number(row?.count ?? 0)));
"#;

    let output = Command::new(&node)
        .args(["-e", script])
        .current_dir(backend_path)
        .env("DATABASE_URL", database_url)
        .output()
        .map_err(|e| format!("could not inspect asset_types with node '{}': {}", node, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(format!(
            "asset_types probe exited with {}{}",
            output.status,
            if stderr.is_empty() {
                String::new()
            } else {
                format!(" ({})", stderr)
            }
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    stdout.parse::<u64>().map_err(|e| {
        format!(
            "failed to parse asset_types probe output '{}' as integer: {}",
            stdout, e
        )
    })
}

fn should_seed_reference_data(is_dev_build: bool, is_fresh_db: bool, asset_type_count: Option<u64>) -> bool {
    if is_fresh_db {
        return true;
    }
    if is_dev_build {
        return false;
    }
    matches!(asset_type_count, Some(0))
}

fn spawn_backend(
    backend_path: &std::path::Path,
    database_url: &str,
    desktop_token: &str,
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

    let allowed_origins = if is_dev_build() {
        // Dev: allow any 127.0.0.1 port (Tauri dev server port is dynamic) + production Tauri
        // The backend middleware treats http://127.0.0.1:1430 as a sentinel to enable prefix matching
        "http://localhost:6543,http://127.0.0.1:6543,http://127.0.0.1:1430,tauri://localhost"
    } else {
        // Prod: only allow production Tauri
        "tauri://localhost"
    };

    Command::new(&node)
        .arg(&main_js)
        .current_dir(backend_path)
        .env("DATABASE_URL", database_url)
        .env("PORT", BACKEND_PORT.to_string())
        .env("NODE_ENV", "production")
        .env("ENABLE_SWAGGER", "false")
        .env("ALLOWED_ORIGINS", allowed_origins)
        .env(DESKTOP_TOKEN_ENV, desktop_token)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!(
            "failed to start NestJS backend with node '{}': {} (is Node.js installed and executable?)",
            node, e
        ))
}

fn cleanup_stale_backend(pid_file: &PathBuf) {
    let Ok(raw_pid) = fs::read_to_string(pid_file) else {
        return;
    };
    let Ok(pid) = raw_pid.trim().parse::<u32>() else {
        let _ = fs::remove_file(pid_file);
        return;
    };
    let pid_arg = pid.to_string();
    let running = Command::new("kill")
        .args(["-0", &pid_arg])
        .status()
        .map(|s| s.success())
        .unwrap_or(false);
    if running {
        log::warn!("Found stale backend process pid={} — terminating", pid);
        let _ = Command::new("kill").args(["-TERM", &pid_arg]).status();
        thread::sleep(Duration::from_millis(250));
        let _ = Command::new("kill").args(["-KILL", &pid_arg]).status();
    }
    let _ = fs::remove_file(pid_file);
}

fn cleanup_stale_legacy_frontend() {
    let pids = Command::new("lsof")
        .args(["-nP", "-iTCP:4321", "-sTCP:LISTEN", "-t"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .unwrap_or_default();

    for raw_pid in pids.lines() {
        let pid = raw_pid.trim();
        if pid.is_empty() {
            continue;
        }
        let cmd = Command::new("ps")
            .args(["-p", pid, "-o", "command="])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .unwrap_or_default();
        if !cmd.contains("/front/dist/server/entry.mjs") {
            continue;
        }
        log::warn!(
            "Found stale legacy frontend sidecar pid={} ({}) — terminating",
            pid,
            cmd.trim()
        );
        let _ = Command::new("kill").args(["-TERM", pid]).status();
        thread::sleep(Duration::from_millis(250));
        let _ = Command::new("kill").args(["-KILL", pid]).status();
    }
}

fn wait_for_backend(url: &str, desktop_token: &str, max_attempts: u32) -> bool {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .unwrap();

    for attempt in 1..=max_attempts {
        match client
            .get(url)
            .header(DESKTOP_TOKEN_HEADER, desktop_token)
            .send()
        {
            Ok(resp) if resp.status().is_success() => {
                log::info!("Backend healthy after {} attempts", attempt);
                return true;
            }
            _ => {
                log::info!("Backend health check {}/{} …", attempt, max_attempts);
                thread::sleep(Duration::from_millis(500));
            }
        }
    }
    log::error!(
        "Backend did not become healthy after {} attempts",
        max_attempts
    );
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
    format!("http://localhost:{}/api/v1", BACKEND_PORT)
}

#[tauri::command]
fn get_app_version() -> serde_json::Value {
    serde_json::json!({
        "version": APP_VERSION,
        "env": runtime_env_label(),
        "gitSha": APP_GIT_SHA,
    })
}

#[derive(Clone, Serialize)]
struct BackendReadyPayload {
    ready: bool,
    backend_api_url: String,
    desktop_token: String,
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

#[cfg(test)]
mod tests {
    use super::{ensure_prisma_cli_js, resolve_node_binary_with, should_seed_reference_data};
    use std::collections::HashSet;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_test_dir(name: &str) -> PathBuf {
        let mut dir = std::env::temp_dir();
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time moved backwards")
            .as_nanos();
        dir.push(format!("strata-tauri-{name}-{nanos}"));
        dir
    }

    #[test]
    fn resolve_node_prefers_build_time_path() {
        let build_node = "/tmp/custom-node";
        let resolved = resolve_node_binary_with(
            |candidate| candidate == build_node,
            Some(build_node),
            Some(Path::new("/Users/alice")),
        );
        assert_eq!(resolved, build_node);
    }

    #[test]
    fn resolve_node_uses_home_local_bin_when_system_paths_missing() {
        let home = Path::new("/Users/alice");
        let home_node = home
            .join(".local")
            .join("bin")
            .join("node")
            .to_string_lossy()
            .to_string();
        let existing: HashSet<String> = HashSet::from([home_node.clone()]);

        let resolved =
            resolve_node_binary_with(|candidate| existing.contains(candidate), None, Some(home));
        assert_eq!(resolved, home_node);
    }

    #[test]
    fn resolve_node_falls_back_to_bare_node_when_no_candidate_exists() {
        let resolved = resolve_node_binary_with(|_| false, None, None);
        assert_eq!(resolved, "node");
    }

    #[test]
    fn ensure_prisma_cli_js_returns_error_when_missing() {
        let backend_path = temp_test_dir("missing-prisma");
        let err = ensure_prisma_cli_js(&backend_path).expect_err("missing prisma path should fail");
        assert!(err.contains("prisma CLI not found"));
    }

    #[test]
    fn ensure_prisma_cli_js_returns_path_when_present() {
        let backend_path = temp_test_dir("present-prisma");
        let prisma_dir = backend_path
            .join("node_modules")
            .join("prisma")
            .join("build");
        fs::create_dir_all(&prisma_dir).expect("create prisma dir");
        let prisma_js = prisma_dir.join("index.js");
        fs::write(&prisma_js, "module.exports = {};\n").expect("write prisma stub");

        let resolved = ensure_prisma_cli_js(&backend_path).expect("prisma path should resolve");
        assert_eq!(resolved, prisma_js);

        fs::remove_dir_all(&backend_path).expect("cleanup temp test dir");
    }

    #[test]
    fn ensure_prisma_cli_js_prefers_package_json_bin() {
        let backend_path = temp_test_dir("prisma-package-json-bin");
        let prisma_dir = backend_path.join("node_modules").join("prisma");
        let bin_path = prisma_dir.join("dist").join("cli").join("src");
        fs::create_dir_all(&bin_path).expect("create prisma dist dir");
        let prisma_js = bin_path.join("bin.js");
        fs::write(&prisma_js, "module.exports = {};\n").expect("write prisma bin stub");
        fs::write(
            prisma_dir.join("package.json"),
            r#"{"name":"prisma","bin":{"prisma":"dist/cli/src/bin.js"}}"#,
        )
        .expect("write prisma package json");

        let resolved = ensure_prisma_cli_js(&backend_path).expect("prisma path should resolve");
        assert_eq!(resolved, prisma_js);

        fs::remove_dir_all(&backend_path).expect("cleanup temp test dir");
    }

    #[test]
    fn should_seed_reference_data_for_fresh_dev_or_prod() {
        assert!(should_seed_reference_data(true, true, None));
        assert!(should_seed_reference_data(false, true, None));
    }

    #[test]
    fn should_seed_reference_data_for_existing_prod_when_empty_only() {
        assert!(should_seed_reference_data(false, false, Some(0)));
        assert!(!should_seed_reference_data(false, false, Some(1)));
    }

    #[test]
    fn should_not_seed_existing_dev_db() {
        assert!(!should_seed_reference_data(true, false, Some(0)));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let sidecars: Arc<Mutex<SidecarProcesses>> = Arc::new(Mutex::new(SidecarProcesses {
        backend: None,
        backend_pid_file: None,
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
            let desktop_token = random_hex_token();
            let backend_pid_file = backend_pid_file_path();
            cleanup_stale_backend(&backend_pid_file);
            cleanup_stale_legacy_frontend();

            let root = repo_root(app);
            let backend_path = root.join("backend");
            log::info!("Backend path: {}", backend_path.display());

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
            let is_dev_runtime = is_dev_build();
            let asset_type_count = if !is_fresh_db && !is_dev_runtime {
                match read_asset_type_count(&backend_path, &database_url) {
                    Ok(count) => {
                        log::info!("Existing production DB detected — asset_types count={}.", count);
                        Some(count)
                    }
                    Err(e) => {
                        let msg = format!("Could not verify production reference data:\n{}", e);
                        log::error!("{}", msg);
                        app.dialog()
                            .message(&msg)
                            .title("Strata — startup error")
                            .kind(MessageDialogKind::Error)
                            .blocking_show();
                        std::process::exit(1);
                    }
                }
            } else {
                None
            };

            let should_seed = should_seed_reference_data(is_dev_runtime, is_fresh_db, asset_type_count);
            if should_seed {
                let seed_profile = if is_dev_runtime { "development" } else { "production" };
                if is_fresh_db {
                    log::info!(
                        "Fresh database detected — running {} seed profile.",
                        seed_profile
                    );
                } else {
                    log::warn!(
                        "Production database has zero asset types — running {} seed profile.",
                        seed_profile
                    );
                }
                if let Err(e) = run_prisma_seed(&backend_path, &database_url, seed_profile) {
                    let msg = format!("Database seed failed:\n{}", e);
                    log::error!("{}", msg);
                    app.dialog()
                        .message(&msg)
                        .title("Strata — startup error")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                    std::process::exit(1);
                }
            } else {
                log::info!("Existing database detected — skipping seed.");
            }

            let backend = match spawn_backend(&backend_path, &database_url, &desktop_token) {
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
            let _ = fs::write(&backend_pid_file, backend.id().to_string());
            {
                let mut s = sidecars_for_setup.lock().unwrap();
                s.backend = Some(backend);
                s.backend_pid_file = Some(backend_pid_file.clone());
            }

            let handle = app.handle().clone();
            thread::spawn(move || {
                let backend_url = format!("http://localhost:{}/api/v1/health", BACKEND_PORT);
                let backend_api_url = format!("http://localhost:{}/api/v1", BACKEND_PORT);

                let backend_ok = wait_for_backend(&backend_url, &desktop_token, 30);

                if backend_ok {
                    log::info!("Backend ready — navigating to bundled frontend");
                    if let Some(window) = handle.get_webview_window("main") {
                        // Use localStorage (persists across navigation) instead of sessionStorage
                        let inject_script = format!(
                            "localStorage.setItem('STRATA_DESKTOP_BACKEND_URL', {api:?}); \
                             localStorage.setItem('STRATA_DESKTOP_TOKEN', {token:?}); \
                             window.location.href = '/app/';",
                            api = backend_api_url,
                            token = desktop_token
                        );
                        let _ = window.eval(&inject_script);
                    }
                    let _ = handle.emit("backend-ready", BackendReadyPayload {
                        ready: true,
                        backend_api_url: backend_api_url.clone(),
                        desktop_token: desktop_token.clone(),
                    });
                } else {
                    log::error!("Backend failed to start");
                    let _ = handle.emit("backend-ready", BackendReadyPayload {
                        ready: false,
                        backend_api_url: String::new(),
                        desktop_token: String::new(),
                    });
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
            if matches!(
                event,
                tauri::WindowEvent::Destroyed | tauri::WindowEvent::CloseRequested { .. }
            ) {
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
        if matches!(event, RunEvent::ExitRequested { .. } | RunEvent::Exit) {
            if let Ok(mut s) = sidecars_for_run.lock() {
                s.shutdown_all();
            }
        }
    });
}
