import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 3000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function resolvePath(url) {
  const parsed = new URL(url, `http://localhost:${port}`);
  const pathname = parsed.pathname === "/" ? "/app/index.html" : parsed.pathname;
  const target = normalize(join(root, pathname));
  if (!target.startsWith(root)) return null;
  return target;
}

createServer((request, response) => {
  const parsed = new URL(request.url || "/", `http://localhost:${port}`);
  if (parsed.pathname === "/") {
    response.writeHead(302, { location: "/app/index.html" });
    response.end();
    return;
  }
  const target = resolvePath(request.url || "/");
  if (!target || !existsSync(target) || statSync(target).isDirectory()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("No encontrado");
    return;
  }
  response.writeHead(200, { "content-type": types[extname(target)] || "application/octet-stream" });
  createReadStream(target).pipe(response);
}).listen(port, () => {
  console.log(`Sistecredito Co-crea listo en http://localhost:${port}`);
});
