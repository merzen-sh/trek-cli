#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

NEW_VERSION=$1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" "$ROOT_DIR/Cargo.toml"

# Scan crates and update their versions in Cargo.lock
for manifest in "$ROOT_DIR"/crates/*/Cargo.toml; do
  if [ -f "$manifest" ]; then
    CRATE_NAME=$(grep -E '^name\s*=\s*' "$manifest" | head -n 1 | sed -E 's/^name\s*=\s*"(.*)"/\1/')
    if [ -n "$CRATE_NAME" ]; then
      python3 "$SCRIPT_DIR/update-cargo-lock.py" "$ROOT_DIR/Cargo.lock" "$CRATE_NAME" "$NEW_VERSION"
    fi
  fi
done

sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" \
  "$ROOT_DIR/packages/wasm-web/package.json" \
  "$ROOT_DIR/packages/app/package.json" \
  "$ROOT_DIR/packages/ui/package.json" \
  "$ROOT_DIR/packages/api-types/package.json"

echo "Bumpped version to $NEW_VERSION"