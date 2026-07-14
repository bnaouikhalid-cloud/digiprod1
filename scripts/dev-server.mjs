import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT || 8080);
const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf"
};

createServer((request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    let file = resolve(root, relative || "index.html");
    if (!file.startsWith(root)) throw new Error("Invalid path");
    if (statSync(file).isDirectory()) file = resolve(file, "index.html");
    response.writeHead(200, {
      "Content-Type": mime[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`DigiProd prototype: http://localhost:${port}/`);
});
