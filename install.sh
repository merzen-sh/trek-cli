#!/usr/bin/env bash
set -euo pipefail

REPO="merzen-sh/trek-cli"
VERSION=""
CANARY=false
INSTALL_DIR="${HOME}/trek/bin"
BINARY_NAME="trek"

if [[ -t 1 ]]; then
  BOLD='\033[1m'; BLUE='\033[1;34m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'; RED='\033[1;31m'; DARKGRAY='\033[1;90m'; NC='\033[0m'
else
  BOLD=''; BLUE=''; GREEN=''; YELLOW=''; RED=''; DARKGRAY=''; NC=''
fi

info()    { echo -e "  ${BLUE}[INFO]${NC} ${DARKGRAY}${*}${NC}"; }
success() { echo -e "  ${GREEN}[OK]${NC} ${DARKGRAY}${*}${NC}"; }
warn()    { echo -e "  ${YELLOW}[WARN]${NC} ${DARKGRAY}${*}${NC}" >&2; }
error()   { echo -e "  ${RED}[ERR]${NC} ${DARKGRAY}${*}${NC}" >&2; }

usage() {
  cat <<EOF
Trek CLI Installer

Usage: $0 [options]

Options:
  -v, --version <version>   Specify version to install (e.g. 0.1.0)
  -c, --canary              Install the latest canary (pre-release) version
  -d, --dir <path>          Installation directory (default: \$HOME/trek/bin)
  -h, --help                Show this help message
EOF
  exit 0
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -v|--version)
        VERSION="$2"
        shift 2
        ;;
      -c|--canary)
        CANARY=true
        shift
        ;;
      -d|--dir)
        INSTALL_DIR="$2"
        shift 2
        ;;
      -h|--help)
        usage
        ;;
      *)
        if [[ -z "$VERSION" ]]; then
          VERSION="$1"
          shift
        else
          error "Unknown argument: $1"
          exit 1
        fi
        ;;
    esac
  done
}

handle_windows() {
  local ps_url="https://raw.githubusercontent.com/$REPO/main/install.ps1"
  local ps_file="$TMP_DIR/install.ps1"

  info "Downloading Windows installer..."
  if ! curl -sfL -o "$ps_file" "$ps_url"; then
    error "Failed to download Windows installer."
    exit 1
  fi

  local ps_args=()
  [[ -n "$VERSION" ]] && ps_args+=("-Version" "$VERSION")
  [[ "$CANARY" == true ]] && ps_args+=("-Canary")
  ps_args+=("-Dir" "$INSTALL_DIR")

  exec powershell -ExecutionPolicy Bypass -File "$ps_file" "${ps_args[@]}"
}

detect_platform() {
  local os arch

  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    mingw*|msys*|cygwin*)
      handle_windows
      ;;
    linux)
      case "$arch" in
        x86_64|amd64) TARGET="x86_64-unknown-linux-gnu" ;;
        aarch64|arm64) TARGET="aarch64-unknown-linux-gnu" ;;
        *) error "Unsupported architecture: $arch"; exit 1 ;;
      esac
      ;;
    darwin)
      case "$arch" in
        x86_64|amd64) TARGET="x86_64-apple-darwin" ;;
        aarch64|arm64) TARGET="aarch64-apple-darwin" ;;
        *) error "Unsupported architecture: $arch"; exit 1 ;;
      esac
      ;;
    *)
      error "Unsupported OS: $os"
      exit 1
      ;;
  esac

  ARCHIVE_NAME="${BINARY_NAME}-${TARGET}.tar.gz"
  BINARY_NAME_TARGET="${BINARY_NAME}-${TARGET}"
}

github_api() {
  local path="$1"
  curl -sf "https://api.github.com/repos/$REPO$path"
}

resolve_version_via_tags() {
  github_api "/tags" | grep '"name":' | sed -E 's/.*"name": "v([^"]+)".*/\1/' | head -n 1
}

resolve_version() {
  if [[ -n "$VERSION" ]]; then
    return
  fi

  if [[ "$CANARY" == true ]]; then
    info "Retrieving latest canary version..."
    VERSION=$(github_api "/releases" | \
      python3 -c "
import sys, json
releases = json.load(sys.stdin)
for r in releases:
    if r.get('prerelease'):
        print(r['tag_name'].lstrip('v'))
        break
" 2>/dev/null || true)

    if [[ -z "$VERSION" ]]; then
      warn "No canary release found. Falling back to latest tag."
      VERSION=$(resolve_version_via_tags)
      CANARY=false
    fi
  fi

  if [[ -z "$VERSION" ]]; then
    info "Retrieving latest stable version..."
    VERSION=$(github_api "/releases/latest" | \
      python3 -c "
import sys, json
r = json.load(sys.stdin)
print(r['tag_name'].lstrip('v'))
" 2>/dev/null || true)

    if [[ -z "$VERSION" ]]; then
      warn "No releases found. Falling back to latest tag."
      VERSION=$(resolve_version_via_tags)
    fi
  fi

  if [[ -z "$VERSION" ]]; then
    error "Could not determine version to install."
    exit 1
  fi
}

download_archive() {
  local tag="$1"
  local url="https://github.com/$REPO/releases/download/$tag/$ARCHIVE_NAME"

  info "Downloading $ARCHIVE_NAME for $tag ..."

  if ! curl -L --fail -o "$TMP_DIR/$ARCHIVE_NAME" "$url"; then
    error "Failed to download: $url"
    exit 1
  fi
}

verify_checksum() {
  local tag="$1"
  local checksums_url="https://github.com/$REPO/releases/download/$tag/SHASUMS.txt"
  local checksums_file="$TMP_DIR/SHASUMS.txt"

  info "Verifying checksum..."
  if ! curl -sfL -o "$checksums_file" "$checksums_url"; then
    warn "Could not download SHASUMS.txt, skipping verification."
    return
  fi

  local expected
  expected=$(grep "  $ARCHIVE_NAME$" "$checksums_file" 2>/dev/null || true)
  if [[ -z "$expected" ]]; then
    warn "No checksum found for $ARCHIVE_NAME in SHASUMS.txt."
    return
  fi

  echo "$expected" | (cd "$TMP_DIR" && sha256sum -c --quiet - 2>/dev/null) || {
    error "Checksum verification failed!"
    echo "  Expected: $expected" >&2
    exit 1
  }
  success "Checksum verified."
}

extract_and_install() {
  tar -xzf "$TMP_DIR/$ARCHIVE_NAME" -C "$TMP_DIR"

  info "Installing to $INSTALL_DIR/$BINARY_NAME ..."
  mkdir -p "$INSTALL_DIR"

  local src="$TMP_DIR/$BINARY_NAME_TARGET"
  local dst="$INSTALL_DIR/$BINARY_NAME"

  if [[ ! -f "$src" ]]; then
    error "Binary not found in archive: $BINARY_NAME_TARGET"
    ls "$TMP_DIR" >&2
    exit 1
  fi

  if [[ ! -w "$INSTALL_DIR" ]]; then
    sudo cp "$src" "$dst"
    sudo chmod +x "$dst"
  else
    cp "$src" "$dst"
    chmod +x "$dst"
  fi
}

add_to_path() {
  local rc_file="$1"
  local line="$2"

  if [[ ! -f "$rc_file" ]]; then
    mkdir -p "$(dirname "$rc_file")" 2>/dev/null || true
  fi

  if ! grep -qxF "$line" "$rc_file" 2>/dev/null; then
    echo "$line" >> "$rc_file"
    success "Added PATH entry to $rc_file"
  fi
}

update_shell_config() {
  local dir_display

  # Use $HOME in shell config for portability
  dir_display="${INSTALL_DIR/#$HOME/\$HOME}"

  info "Updating shell configuration..."

  case "$SHELL" in
    */bash)
      add_to_path "$HOME/.bashrc" "export PATH=\"\$PATH:$dir_display\""
      ;;
    */zsh)
      add_to_path "$HOME/.zshrc" "export PATH=\"\$PATH:$dir_display\""
      ;;
    */fish)
      add_to_path "$HOME/.config/fish/config.fish" "fish_add_path $dir_display"
      ;;
  esac

  # Also check common config files even if SHELL doesn't match
  if [[ "$SHELL" != */bash ]] && [[ -f "$HOME/.bashrc" ]]; then
    add_to_path "$HOME/.bashrc" "export PATH=\"\$PATH:$dir_display\""
  fi
  if [[ "$SHELL" != */zsh ]] && [[ -f "$HOME/.zshrc" ]]; then
    add_to_path "$HOME/.zshrc" "export PATH=\"\$PATH:$dir_display\""
  fi
  if [[ "$SHELL" != */fish ]] && [[ -f "$HOME/.config/fish/config.fish" ]]; then
    add_to_path "$HOME/.config/fish/config.fish" "fish_add_path $dir_display"
  fi

  info "Restart your shell or run: source <config-file>"
}

main() {
  parse_args "$@"

  TMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TMP_DIR"' EXIT

  detect_platform

  resolve_version

  local tag="v${VERSION#v}"
  info "Selected version: $tag"
  download_archive "$tag"
  verify_checksum "$tag"
  extract_and_install
  success "Trek CLI installed: $(command -v $BINARY_NAME || echo "$INSTALL_DIR/$BINARY_NAME")"
  update_shell_config
}

main "$@"