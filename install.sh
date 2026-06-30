#!/usr/bin/env bash
set -euo pipefail

REPO="merzen-sh/trek-cli"
VERSION=""
CANARY=false
INSTALL_DIR="${HOME}/trek/bin"
BINARY_NAME="trek"

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
          echo "Unknown argument: $1" >&2
          exit 1
        fi
        ;;
    esac
  done
}

detect_platform() {
  local os arch

  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    linux)
      case "$arch" in
        x86_64|amd64) TARGET="x86_64-unknown-linux-gnu" ;;
        aarch64|arm64) TARGET="aarch64-unknown-linux-gnu" ;;
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
      esac
      ;;
    mingw*|msys*|cygwin*)
      case "$arch" in
        x86_64|amd64) TARGET="x86_64-pc-windows-msvc" ;;
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
      esac
      ;;
    *)
      echo "Unsupported OS: $os" >&2
      exit 1
      ;;
  esac

  if [[ "$os" == mingw* || "$os" == msys* || "$os" == cygwin* ]]; then
    ARCHIVE_NAME="${BINARY_NAME}-${TARGET}.zip"
    BINARY_NAME_TARGET="${BINARY_NAME}-${TARGET}.exe"
  else
    ARCHIVE_NAME="${BINARY_NAME}-${TARGET}.tar.gz"
    BINARY_NAME_TARGET="${BINARY_NAME}-${TARGET}"
  fi
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
    echo "Retrieving latest canary version..."
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
      echo "No canary release found. Falling back to latest tag."
      VERSION=$(resolve_version_via_tags)
      CANARY=false
    fi
  fi

  if [[ -z "$VERSION" ]]; then
    echo "Retrieving latest stable version..."
    VERSION=$(github_api "/releases/latest" | \
      python3 -c "
import sys, json
r = json.load(sys.stdin)
print(r['tag_name'].lstrip('v'))
" 2>/dev/null || true)

    if [[ -z "$VERSION" ]]; then
      echo "No releases found. Falling back to latest tag."
      VERSION=$(resolve_version_via_tags)
    fi
  fi

  if [[ -z "$VERSION" ]]; then
    echo "Could not determine version to install." >&2
    exit 1
  fi
}

download_archive() {
  local tag="$1"
  local url="https://github.com/$REPO/releases/download/$tag/$ARCHIVE_NAME"

  echo "Downloading $ARCHIVE_NAME for $tag ..."

  if ! curl -L --fail -o "$TMP_DIR/$ARCHIVE_NAME" "$url"; then
    echo "Failed to download: $url" >&2
    exit 1
  fi
}

extract_and_install() {
  if [[ "$ARCHIVE_NAME" == *.zip ]]; then
    unzip -o "$TMP_DIR/$ARCHIVE_NAME" -d "$TMP_DIR" > /dev/null 2>&1 || \
    (cd "$TMP_DIR" && unzip -o "$ARCHIVE_NAME" > /dev/null)
  else
    tar -xzf "$TMP_DIR/$ARCHIVE_NAME" -C "$TMP_DIR"
  fi

  echo "Installing to $INSTALL_DIR/$BINARY_NAME ..."
  mkdir -p "$INSTALL_DIR"

  local src="$TMP_DIR/$BINARY_NAME_TARGET"
  local dst="$INSTALL_DIR/$BINARY_NAME"

  if [[ ! -f "$src" ]]; then
    echo "Binary not found in archive: $BINARY_NAME_TARGET" >&2
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
    echo "  Added PATH entry to $rc_file"
  fi
}

update_shell_config() {
  local dir_display

  # Use $HOME in shell config for portability
  dir_display="${INSTALL_DIR/#$HOME/\$HOME}"

  echo "Updating shell configuration..."

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

  echo "  Restart your shell or run: source <config-file>"
}

main() {
  parse_args "$@"
  detect_platform

  TMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TMP_DIR"' EXIT

  resolve_version

  local tag="v${VERSION#v}"
  echo "Selected version: $tag"
  download_archive "$tag"
  extract_and_install
  echo "Trek CLI installed successfully: $(command -v $BINARY_NAME || echo "$INSTALL_DIR/$BINARY_NAME")"
  update_shell_config
}

main "$@"