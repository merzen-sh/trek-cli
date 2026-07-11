#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");

const platforms = {
  win32: {
    os: "win32",
    arch: "x64",
    pkg: "@trek-cli/trek-win32-x64",
    binary: "trek.exe",
  },
  linux: {
    os: "linux",
    arch: "x64",
    pkg: "@trek-cli/trek-linux-x64",
    binary: "trek",
  },
};

function getPackageManager() {
  const executionPath = process.argv[1] || "";

  if (executionPath.includes(".bun")) {
    return "bun";
  } else if (executionPath.includes("node_modules") || executionPath.includes("npm")) {
    return "npm";
  } else if (executionPath.includes("yarn")) {
    return "yarn";
  } else if (executionPath.includes("pnpm")) {
    return "pnpm";
  }

  return "unknown";
}

const runtimeName = process.release.name;
const pkgManager = getPackageManager();

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
  env: {
    ...process.env,
    TREK_RUNTIME: runtimeName,
    TREK_PACKAGE_MANAGER: pkgManager,
  },
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error(`Failed to launch trek binary: ${err.message}`);
  console.error(`  path: ${binaryPath}`);
  process.exit(1);
});
