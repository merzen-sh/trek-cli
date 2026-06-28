import * as fs from "fs";
import * as path from "path";

const version = process.argv[2];

if(!version){
    console.log("missing version");
    process.exit(1);
}

const NPM_DIR = path.join(__dirname, "../npm");
const TREK_CLI_PKG_PATH = path.join(NPM_DIR, "trek-cli/package.json");

const TARGET_PLATFORMS = [
  { id: "trek-linux-x64", os: ["linux"], cpu: ["x64"] },
  { id: "trek-linux-arm64", os: ["linux"], cpu: ["arm64"] },
  { id: "trek-windows-x64", os: ["win32"], cpu: ["x64"] },
  { id: "trek-windows-arm64", os: ["win32"], cpu: ["arm64"] },
];

function main() {
  console.log(`Generating scoped packages for version: ${version}`);

  if (!fs.existsSync(NPM_DIR)) {
    fs.mkdirSync(NPM_DIR, { recursive: true });
  }

  const optionalDeps: Record<string, string> = {};

  for (const platform of TARGET_PLATFORMS) {
    const platformDir = path.join(NPM_DIR, platform.id);
    if (!fs.existsSync(platformDir)) {
      fs.mkdirSync(platformDir, { recursive: true });
    }

    const scopedName = `@trek-cli/${platform.id}`;

    const isWindows = platform.os.includes("win32");
    const binPath = isWindows ? "./trek.exe" : "./trek";

    const pkgContent = {
      name: scopedName,
      version: version,
      os: platform.os,
      cpu: platform.cpu,
      bin: {
        trek: binPath,
      },
    };

    fs.writeFileSync(
      path.join(platformDir, "package.json"),
      JSON.stringify(pkgContent, null, 2) + "\n",
    );

    optionalDeps[scopedName] = version;
  }

  if (fs.existsSync(TREK_CLI_PKG_PATH)) {
    const cliPkg = JSON.parse(fs.readFileSync(TREK_CLI_PKG_PATH, "utf8"));

    cliPkg.version = version;
    cliPkg.optionalDependencies = {
      ...cliPkg.optionalDependencies,
      ...optionalDeps,
    };

    fs.writeFileSync(TREK_CLI_PKG_PATH, JSON.stringify(cliPkg, null, 2) + "\n");
    console.log("Successfully updated trek-cli/package.json and corrected all bin structures!");
  } else {
    console.error(`Error: Cannot find trek-cli/package.json at ${TREK_CLI_PKG_PATH}`);
  }
}

main();
