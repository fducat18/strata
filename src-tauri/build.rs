use std::process::Command;

fn main() {
  // Embed version metadata derived from `git describe --tags --dirty`.
  // The single source of truth is `scripts/version.mjs` at the repo root.
  let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
  let script = std::path::Path::new(&manifest_dir)
    .parent()
    .unwrap()
    .join("scripts")
    .join("version.mjs");

  let (version, env, git_sha) = match Command::new("node")
    .arg(&script)
    .arg("--json")
    .output()
  {
    Ok(out) if out.status.success() => {
      let raw = String::from_utf8_lossy(&out.stdout);
      let parsed: serde_json::Value = serde_json::from_str(&raw)
        .unwrap_or(serde_json::Value::Null);
      let v = parsed["version"].as_str().unwrap_or("0.0.0-dev").to_string();
      let e = parsed["env"].as_str().unwrap_or("development").to_string();
      let s = parsed["gitSha"].as_str().unwrap_or("unknown").to_string();
      (v, e, s)
    }
    _ => ("0.0.0-dev".into(), "development".into(), "unknown".into()),
  };

  println!("cargo:rustc-env=STRATA_VERSION={}", version);
  println!("cargo:rustc-env=STRATA_ENV={}", env);
  println!("cargo:rustc-env=STRATA_GIT_SHA={}", git_sha);
  println!("cargo:rerun-if-changed=../scripts/version.mjs");
  println!("cargo:rerun-if-changed=../.git/HEAD");
  println!("cargo:rerun-if-changed=../.git/refs/tags");

  tauri_build::build()
}
