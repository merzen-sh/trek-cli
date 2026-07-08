#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");

const platforms = {
  win32: { os: "win32", arch: "x64", pkg: "@trek-cli/trek-win32-x64", binary: "trek.exe" },
  linux: { os: "linux", arch: "x64", pkg: "@trek-cli/trek-linux-x64", binary: "trek" },
};

const key = `${process.platform}-${process.arch}`;
const target = key === "win32-x64" ? platforms.win32 : key === "linux-x64" ? platforms.linux : null;

if (!target) {
  console.error(`Unsupported platform: ${process.platform} ${process.arch}`);
  process.exit(1);
}

let binaryPath;
try {
  binaryPath = require.resolve(`${target.pkg}/${target.binary}`);
} catch {
  const fallback = path.join(__dirname, "..", "node_modules", target.pkg, target.binary);
  binaryPath = fallback;
}

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error(`Failed to launch trek binary: ${err.message}`);
  console.error(`  path: ${binaryPath}`);
  process.exit(1);
});
