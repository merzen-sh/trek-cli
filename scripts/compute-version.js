const fs = require("fs");
const path = require("path");
const semver = require("semver");

const increment = process.argv[2];
const tagOverride = process.argv[3];

const versionFilePath = path.join(__dirname, "..", "version");
const versionFileContents = fs.readFileSync(versionFilePath, "utf-8");
const [currentVersion] = versionFileContents.split("\n");

const identifier = increment.startsWith("pre") ? "canary" : "latest";
const newVersion = semver.inc(currentVersion, increment, identifier);

const parsed = semver.parse(newVersion);
const tag = tagOverride || parsed?.prerelease[0] || "latest";

fs.writeFileSync(versionFilePath, `${newVersion}\n${tag}\n`);
