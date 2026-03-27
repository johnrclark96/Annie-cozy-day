const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");
const TEMPLATE = path.join(__dirname, "template.html");
const OUT_DIR = path.join(__dirname, "dist");
const OUT_FILE = path.join(OUT_DIR, "annies-cozy-day.html");
const ASSETS_SRC = path.join(__dirname, "assets");
const ASSETS_DST = path.join(OUT_DIR, "assets");

// Read all .js files in src/, sorted by filename (numeric prefix ensures order)
const srcFiles = fs.readdirSync(SRC_DIR)
  .filter(f => f.endsWith(".js"))
  .sort();

console.log("Concatenating", srcFiles.length, "source files...");

let script = "";
for (const file of srcFiles) {
  const content = fs.readFileSync(path.join(SRC_DIR, file), "utf8");
  script += "\n    // \u2550\u2550\u2550 " + file + " \u2550\u2550\u2550\n";
  script += content;
  script += "\n";
}

// Validate syntax
try {
  new Function(script);
  console.log("\u2713 Syntax OK (" + script.split("\n").length + " lines)");
} catch (e) {
  console.error("\u2717 SYNTAX ERROR:", e.message);
  process.exit(1);
}

// Build HTML
const templateStr = fs.readFileSync(TEMPLATE, "utf8");
const htmlOut = templateStr.replace("{{GAME_SCRIPT}}", script);

// Write output
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, htmlOut);
console.log("\u2713 Written:", OUT_FILE, "(" + htmlOut.split("\n").length + " lines)");

// Copy assets
fs.mkdirSync(ASSETS_DST, { recursive: true });
const assets = fs.readdirSync(ASSETS_SRC);
for (const asset of assets) {
  fs.copyFileSync(path.join(ASSETS_SRC, asset), path.join(ASSETS_DST, asset));
  console.log("\u2713 Copied asset:", asset);
}

console.log("\nBuild complete! Open dist/annies-cozy-day.html to play.");
