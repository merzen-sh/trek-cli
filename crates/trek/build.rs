fn main() {
    println!("cargo:rerun-if-changed=build.rs");

    let profile = std::env::var("PROFILE").unwrap_or_default();
    if profile == "release" {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let dist = std::path::Path::new(&manifest_dir).join("../../packages/app/dist");

        if !dist.exists() {
            panic!(
                "packages/app/dist not found at {}.\n\
                 Run `pnpm build` in the workspace root before building for release.",
                dist.display()
            );
        }

        println!("cargo:rerun-if-changed={}", dist.display());
    }
}
