#!/usr/bin/env bash

set -euo pipefail

SOURCE_DIR="$(realpath ./dist)"
RELEASE_DIR="$(realpath ./release)"
OUTPUT_FILE="$RELEASE_DIR/SHASUMS.txt"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Folder $SOURCE_DIR not found"
    exit 1
fi

mkdir -p "$RELEASE_DIR"
rm -f "$OUTPUT_FILE"

cd "$SOURCE_DIR"

echo "Creating SHASUMS.txt for binary files..."

find . -maxdepth 1 -type f -name "trek-*" | sort | while read -r file; do
    clean_file="${file#./}"
    
    sha256sum "$clean_file" >> "$OUTPUT_FILE"
done

echo "Successfully created SHASUMS.txt!"
echo "--------------------------------------"
cat "$OUTPUT_FILE"
echo "--------------------------------------"