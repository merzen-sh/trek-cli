## [0.1.3-canary.0] - 2026-07-01

### 🚀 Features

- Integrate OpenAPI client
- Implement rate limiting and auto-exit for invalid PIN attempts
- Implement system field filtering

### 🚜 Refactor

- Modularize configuration UI components
- Modularized server routing logic
- Extract script management logic into a new trek-scripts crate
- Modularize server configuration

### ⚙️ Miscellaneous Tasks

- Enable tag fetching and full history
- Run format
- Enable release-embed feature
- Run formatter after generating api types in justfile
- Update release workflow to use generated git-cliff changelog content
## [0.1.2] - 2026-06-30

### 🐛 Bug Fixes

- Update bump-version script to use version output instead of releaseTag

### ⚙️ Miscellaneous Tasks

- Update release workflow checkout logic
- Swap version tags in workflow
## [0.1.1] - 2026-06-30

### 🚀 Features

- Add cross-platform installation scripts
- Add Windows PowerShell installer
- Implement PIN-based server authentication and secure dashboard access flow

### 🐛 Bug Fixes

- Use backslash path separator in install.ps1

### 🚜 Refactor

- Migrate proxy server to reqwest

### ⚙️ Miscellaneous Tasks

- Update dependencies and prevent external 401 errors from triggering local pin clearing
## [0.1.0] - 2026-06-30

### 🚀 Features

- Implement multi-platform native binary distribution
- Add release workflow automation
- Automate release process with automated changelogs, binary packaging, checksum generation, and GitHub releases
- Add dry-run support to release workflow

### 🐛 Bug Fixes

- Redirect missing version error message to stderr
- Suppress browser command output to prevent stdout/stderr clutter
- Align release branch and version tag naming using output version variable and include changelog in release body

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
- Update release workflow to support platform-specific binary extensions
- Update checkout step in release workflow
- Migrate build artifacts from dist to release directory and update workflow pathing
