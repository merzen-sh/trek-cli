const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "..", "packages", "app");
const pkg = JSON.parse(fs.readFileSync(path.join(appDir, "package.json"), "utf-8"));
const htmlPath = path.join(appDir, "dist", "index.html");

let html = fs.readFileSync(htmlPath, "utf-8");
html = html.replace("<%version%>", pkg.version);
fs.writeFileSync(htmlPath, html);
