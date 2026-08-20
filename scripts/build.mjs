import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync("app", join(dist, "app"), { recursive: true });
cpSync("src", join(dist, "src"), { recursive: true });
writeFileSync(
  join(dist, "index.html"),
  '<!doctype html><meta http-equiv="refresh" content="0; url=app/index.html"><a href="app/index.html">Abrir Sistecredito Co-crea</a>\n',
);
console.log("Build local creado en dist/");
