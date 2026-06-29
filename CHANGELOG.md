## [canary] - 2026-06-29

### 🚀 Features

- Implement multi-platform native binary distribution
- Add release workflow automation
- Automate release process with automated changelogs, binary packaging, checksum generation, and GitHub releases

### 🐛 Bug Fixes

- Redirect missing version error message to stderr
- Suppress browser command output to prevent stdout/stderr clutter

### 🚜 Refactor

- Migrate wasm-web package from npm/ directory to packages/ directory
- Consolidate path resolution
- Enforce version argument
- Simplify browser launch logic
- Assign command builder to variable
- Replace standard print statements with structured logging

### 📚 Documentation

- Add documentation overview

### 🧪 Testing

- Restrict unix-specific config path tests to non-windows targets

### ⚙️ Miscellaneous Tasks

- Add git-cliff configuration and rust-toolchain definition
- Run format
- Add workflows for automated testing
- Remove trek-cli npm package and platform-specific binary wrappers
- Add write permissions for contents and pull-requests to release workflow
- Add paths-filter to skip testing workflow when no Rust files changed
- Add checkout step to test workflow to enable path filtering
- Upgrade actions/upload-artifact and actions/download-artifact to v7
- Trigger test workflow on changes to test.yml configuration
- Update git checkout depth and fix version tag variable in release workflow
