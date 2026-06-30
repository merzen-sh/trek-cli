#!/usr/bin/env python3
import sys
import re

if len(sys.argv) < 4:
    print("Usage: update-cargo-lock.py <lock_file> <crate_name> <new_version>")
    sys.exit(1)

lock_file, crate_name, new_ver = sys.argv[1], sys.argv[2], sys.argv[3]

with open(lock_file, "r") as f:
    text = f.read()

pattern = re.compile(
    r"(\[\[package\]\]\r?\nname\s*=\s*\"" + re.escape(crate_name) + r"\"\r?\nversion\s*=\s*\")[^\"]+(\")"
)

updated, count = pattern.subn(r"\g<1>" + new_ver + r"\2", text)

if count > 0:
    with open(lock_file, "w") as f:
        f.write(updated)
    print(f"Updated {crate_name} version to {new_ver} in Cargo.lock")
