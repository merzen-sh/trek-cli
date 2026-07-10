#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

TARGET="${1:?Usage: $0 <target-triple>}"

case "$TARGET" in
  x86_64-pc-windows-msvc) PKG="trek-win32-x64"; EXT=".exe" ;;
  x86_64-unknown-linux-gnu) PKG="trek-linux-x64"; EXT="" ;;
  *)
    echo "Warning: Unknown target '$TARGET' — skipping binary copy"
    exit 0
    ;;
esac

BIN_DIR="$ROOT_DIR/target/$TARGET/release"
if [ -f "$BIN_DIR/trek$EXT" ]; then
  SRC="$BIN_DIR/trek$EXT"
else
  echo "Binary not found in $BIN_DIR"
  echo "Build first: cargo build --target $TARGET -p trek --release"
  exit 1
fi

DST_DIR="$ROOT_DIR/npm/$PKG"
mkdir -p "$DST_DIR"
cp "$SRC" "$DST_DIR/trek$EXT"
chmod 755 "$DST_DIR/trek$EXT" 2>/dev/null || true

echo "Copied $SRC → $DST_DIR/trek$EXT"
