use std::process::Command;

fn resolve_build_node_path() -> Option<String> {
    let out = Command::new("sh")
        .args(["-lc", "command -v node"])
        .output()
        .ok()?;

    if !out.status.success() {
        return None;
    }

    let raw = String::from_utf8_lossy(&out.stdout);
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    Some(trimmed.to_string())
}

fn main() {
    // Embed version metadata derived from `git describe --tags --dirty`.
    // The single source of truth is `scripts/version.mjs` at the repo root.
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let script = std::path::Path::new(&manifest_dir)
        .parent()
        .unwrap()
        .join("scripts")
        .join("version.mjs");

    let (version, env, git_sha) = match Command::new("node").arg(&script).arg("--json").output() {
        Ok(out) if out.status.success() => {
            let raw = String::from_utf8_lossy(&out.stdout);
            let parsed: serde_json::Value =
                serde_json::from_str(&raw).unwrap_or(serde_json::Value::Null);
            let v = parsed["version"]
                .as_str()
                .unwrap_or("0.0.0-dev")
                .to_string();
            let e = parsed["env"].as_str().unwrap_or("development").to_string();
            let s = parsed["gitSha"].as_str().unwrap_or("unknown").to_string();
            (v, e, s)
        }
        _ => ("0.0.0-dev".into(), "development".into(), "unknown".into()),
    };

    println!("cargo:rustc-env=STRATA_VERSION={}", version);
    println!("cargo:rustc-env=STRATA_ENV={}", env);
    println!("cargo:rustc-env=STRATA_GIT_SHA={}", git_sha);
    if let Some(node_path) = resolve_build_node_path() {
        println!("cargo:rustc-env=STRATA_NODE_PATH={}", node_path);
    }
    println!("cargo:rerun-if-changed=../scripts/version.mjs");
    println!("cargo:rerun-if-changed=../.git/HEAD");
    println!("cargo:rerun-if-changed=../.git/refs/tags");
    println!("cargo:rerun-if-env-changed=VERSION_OVERRIDE");
    println!("cargo:rerun-if-env-changed=PATH");

    tauri_build::build()
}
