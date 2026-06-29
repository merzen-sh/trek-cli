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

sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" \
  "$ROOT_DIR/packages/wasm-web/package.json" \
  "$ROOT_DIR/packages/app/package.json" \
  "$ROOT_DIR/packages/ui/package.json"

echo "Bumpped version to $NEW_VERSION"