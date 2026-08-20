import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["app", "src", "scripts", "tests", "docs"];
const forbidden = [["ced", "ula"].join(""), ["contraseña", " real"].join(""), ["password", "="].join(""), ["api", "_key"].join(""), ["secret", "_key"].join("")];
let failures = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(js|mjs|css|html|md)$/.test(entry)) continue;
    const content = readFileSync(path, "utf8");
    for (const term of forbidden) {
      if (content.toLowerCase().includes(term)) {
        console.error(`Contenido no permitido en ${path}: ${term}`);
        failures += 1;
      }
    }
    if (path.endsWith("scripts\\lint.mjs")) continue;
    if (/\bconsole\.log\(/.test(content) && !path.includes("scripts")) {
      console.error(`Evita console.log en codigo de producto: ${path}`);
      failures += 1;
    }
  }
}

for (const root of roots) walk(root);
if (failures) process.exit(1);
console.log("Lint del prototipo sin hallazgos.");
