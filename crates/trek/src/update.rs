use semver::Version;
#[cfg(not(debug_assertions))]
use trek_log::log_warn;

#[cfg(not(debug_assertions))]
pub async fn check_for_updates() -> anyhow::Result<()> {
    let current_version = env!("CARGO_PKG_VERSION");
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()?;

    let res = client
        .get("https://api.github.com/repos/merzen-sh/trek-cli/releases/latest")
        .header(
            reqwest::header::USER_AGENT,
            format!("trek-cli/{current_version}"),
        )
        .send()
        .await?;

    if !res.status().is_success() {
        return Ok(());
    }

    #[derive(serde::Deserialize)]
    struct Release {
        tag_name: String,
    }

    let release: Release = res.json().await?;
    let latest_version_str = release.tag_name.trim_start_matches('v');
    let current_version_str = current_version.trim_start_matches('v');

    if let (Ok(latest), Ok(current)) = (
        Version::parse(latest_version_str),
        Version::parse(current_version_str),
    ) {
        if latest > current {
            log_warn!("A new version of trek-cli is available: v{latest} (current: v{current})");
            log_warn!("Download it from: https://github.com/merzen-sh/trek-cli/releases/latest");
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_comparison() {
        let v0 = Version::parse("0.1.0").unwrap();
        let v1 = Version::parse("0.1.1").unwrap();
        let v2 = Version::parse("0.2.0").unwrap();
        let v3 = Version::parse("1.0.0").unwrap();

        assert!(v1 > v0);
        assert!(v2 > v1);
        assert!(v3 > v2);
        assert!(v0 < v1);
        assert_eq!(v0, Version::parse("0.1.0").unwrap());
    }

    #[test]
    fn version_prefix_stripping() {
        let with_v = "v0.1.0".trim_start_matches('v');
        let without_v = "0.1.0";
        assert_eq!(
            Version::parse(with_v).unwrap(),
            Version::parse(without_v).unwrap(),
        );
    }

    #[test]
    fn pre_release_version_comparison() {
        let stable = Version::parse("1.0.0").unwrap();
        let rc = Version::parse("1.0.0-rc.1").unwrap();
        let beta = Version::parse("1.0.0-beta.1").unwrap();
        let alpha = Version::parse("1.0.0-alpha.1").unwrap();

        assert!(stable > rc);
        assert!(rc > beta);
        assert!(beta > alpha);
        assert!(alpha < beta);
        assert!(alpha < stable);
    }
}
