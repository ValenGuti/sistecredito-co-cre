import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const packageCandidates = [
  join(root, "node_modules", "@sc-ingenieria", "flux"),
  join(root, "node_modules", "flux"),
];
const fallback = {
  "flux-brand-primary": "#005c64",
  "flux-brand-secondary": "#15a09a",
  "flux-accent": "#ffb23f",
  "flux-bg": "#f6f8fb",
  "flux-surface": "#ffffff",
  "flux-surface-soft": "#eef4f6",
  "flux-ink": "#17212b",
  "flux-muted": "#667085",
  "flux-line": "#d8e0e7",
  "flux-ok": "#197b53",
  "flux-warn": "#b76b00",
  "flux-bad": "#b42318",
  "flux-info": "#1d5fd1",
  "flux-radius": "8px",
};

const packageDir = packageCandidates.find((candidate) => existsSync(candidate));
const tokens = packageDir ? readPackageTokens(packageDir) : {};
const aliases = buildAliases(tokens);
const output = renderCss(packageDir, tokens, aliases);

writeFileSync(join(root, "app", "flux-tokens.generated.css"), output);
console.log(packageDir ? "Tokens Flux sincronizados." : "Flux no esta instalado; se conservaron tokens fallback.");

function readPackageTokens(dir) {
  const files = walk(dir).filter((file) => /\.(css|scss|sass|less)$/.test(file));
  const found = {};
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const matches = content.matchAll(/--([A-Za-z0-9-_]+)\s*:\s*([^;{}]+);/g);
    for (const match of matches) {
      const name = match[1].trim();
      const value = match[2].trim();
      if (isUsableCssValue(value)) found[name] = value;
    }
  }
  return found;
}

function buildAliases(tokens) {
  return {
    "flux-brand-primary": pick(tokens, ["brand.*primary", "primary", "principal"]),
    "flux-brand-secondary": pick(tokens, ["brand.*secondary", "secondary", "secundario", "teal"]),
    "flux-accent": pick(tokens, ["accent", "warning", "yellow", "amarillo"]),
    "flux-bg": pick(tokens, ["background", "bg", "neutral.*50"]),
    "flux-surface": pick(tokens, ["surface", "white", "blanco"]),
    "flux-surface-soft": pick(tokens, ["surface.*soft", "neutral.*100", "gray.*100", "gris.*100"]),
    "flux-ink": pick(tokens, ["text.*primary", "ink", "black", "negro", "neutral.*900"]),
    "flux-muted": pick(tokens, ["text.*secondary", "muted", "neutral.*500", "gray.*500"]),
    "flux-line": pick(tokens, ["border", "line", "neutral.*200", "gray.*200"]),
    "flux-ok": pick(tokens, ["success", "exito", "green", "verde"]),
    "flux-warn": pick(tokens, ["warning", "alert", "orange", "naranja"]),
    "flux-bad": pick(tokens, ["danger", "error", "red", "rojo"]),
    "flux-info": pick(tokens, ["info", "blue", "azul"]),
    "flux-radius": pick(tokens, ["radius.*md", "border.*radius", "radius"]),
  };
}

function renderCss(packageDir, tokens, aliases) {
  const source = packageDir ? packageDir.replaceAll("\\", "/") : "fallback-local";
  const packageVars = Object.entries(tokens)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");
  const aliasVars = Object.entries(fallback)
    .map(([alias, value]) => {
      const tokenName = aliases[alias];
      return tokenName ? `  --${alias}: var(--${tokenName}, ${value});` : `  --${alias}: ${value};`;
    })
    .join("\n");
  return `:root {\n  --flux-source: "${source}";\n${packageVars ? `${packageVars}\n` : ""}${aliasVars}\n}\n`;
}

function pick(tokens, patterns) {
  const entries = Object.keys(tokens);
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "i");
    const exact = entries.find((name) => regex.test(name));
    if (exact) return exact;
  }
  return null;
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(path));
    else results.push(path);
  }
  return results;
}

function isUsableCssValue(value) {
  return value && !value.includes("$") && !value.includes("@") && value.length < 160;
}
