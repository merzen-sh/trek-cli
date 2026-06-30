#!/usr/bin/env bash

set -euo pipefail

rm -rf "./release"
mkdir -p "./release"

SOURCE_DIR="$(realpath ./dist)"
RELEASE_DIR="$(realpath ./release)"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Could not find the source directory $SOURCE_DIR"
    exit 1
fi

cd "$SOURCE_DIR"

for item in trek-*; do
    if [[ "$item" == "tmp_"* ]]; then
        continue
    fi

    echo "⚙️ Packaging: $item"
    TMP_DIR="tmp_$item"
    mkdir -p "$TMP_DIR"

    if [[ "$item" == *windows* || "$item" == *pc-windows-msvc* || "$item" == *pc-windows-gnu* ]]; then
        if [[ "$item" == *.exe ]]; then
            TARGET_BIN_NAME="$item"
        else
            TARGET_BIN_NAME="$item.exe"
        fi

        if [ -d "$item" ]; then
            SRC_EXE=$(find "$item" -type f -name "trek*" | head -n 1)
            cp "$SRC_EXE" "$TMP_DIR/$TARGET_BIN_NAME"
        else
            cp "$item" "$TMP_DIR/$TARGET_BIN_NAME"
        fi
        
        OUTPUT_NAME="$item.zip"
        echo "Creating Zip..."
        (cd "$TMP_DIR" && zip -q "$RELEASE_DIR/$OUTPUT_NAME" "$TARGET_BIN_NAME")
    else
        TARGET_BIN_NAME="$item"
        if [ -d "$item" ]; then
            SRC_BIN=$(find "$item" -type f -name "trek*" | head -n 1)
            cp "$SRC_BIN" "$TMP_DIR/$TARGET_BIN_NAME"
        else
            cp "$item" "$TMP_DIR/$TARGET_BIN_NAME"
        fi
        chmod +x "$TMP_DIR/$TARGET_BIN_NAME"
        
        OUTPUT_NAME="$item.tar.gz"
        echo "🗜️ Creating Tarball..."
        tar -czf "$RELEASE_DIR/$OUTPUT_NAME" -C "$TMP_DIR" "$TARGET_BIN_NAME"
    fi

    rm -rf "$TMP_DIR"
done

echo "✨ Done!"
echo "📂 All files in the $RELEASE_DIR folder ready!"
echo "--------------------------------------"
cd "$RELEASE_DIR"
ls -la
echo "--------------------------------------"