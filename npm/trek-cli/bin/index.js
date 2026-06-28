#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const { platform, arch } = process;

const PLATFORM_MAP = {
  linux: "linux",
  win32: "windows",
};

const ARCH_MAP = {
  x64: "x64",
  arm64: "arm64",
};

const targetOS = PLATFORM_MAP[platform];
const targetArch = ARCH_MAP[arch];

if (!targetOS || !targetArch) {
  console.error(`Error: Unsupported platform/architecture (${platform}-${arch}) by trek-cli.`);
  process.exit(1);
}

const packageName = `@trek-cli/trek-${targetOS}-${targetArch}`;
const binaryName = platform === "win32" ? "trek.exe" : "trek";

let binaryPath;

try {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  binaryPath = path.join(path.dirname(packageJsonPath), binaryName);
} catch (err) {
  console.error(`Error: Cannot find binary package "${packageName}".`);
  console.error(`Please try re-installing trek-cli.`);
  process.exit(1);
}

const args = process.argv;

const result = spawnSync(binaryPath, args, {
  stdio: "inherit",
  windowsHide: true,
});

process.exit(result.status ?? 0);
