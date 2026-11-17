/* Serves the built site (out/, from `npm run build`) the way GitHub Pages does: /about/ is about/index.html, a
   missing page is 404.html, and text is gzipped, so the transfer sizes the tests weigh are the published ones.
   Started by playwright.config.ts; on its own: node tests/perf/serve.mjs [port] */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const OUT = fileURLToPath(new URL("../../out", import.meta.url));
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};
const TEXT = new Set([".html", ".js", ".css", ".json", ".txt", ".svg"]);

async function resolve(path) {
  const file = join(OUT, normalize(path));
  if (!file.startsWith(OUT)) return null;
  try {
    const s = await stat(file);
    if (s.isFile()) return file;
    if (s.isDirectory()) return (await stat(join(file, "index.html"))).isFile() ? join(file, "index.html") : null;
  } catch {}
  return null;
}

async function send(req, res, file, status) {
  const ext = extname(file);
  let body = await readFile(file);
  const headers = { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": "max-age=600" };
  if (TEXT.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "")) {
    body = gzipSync(body);
    headers["content-encoding"] = "gzip";
  }
  // Videos are fetched in ranges
  const range = !headers["content-encoding"] && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : body.length - 1;
    headers["content-range"] = `bytes ${start}-${end}/${body.length}`;
    headers["accept-ranges"] = "bytes";
    res.writeHead(206, headers).end(body.subarray(start, end + 1));
    return;
  }
  res.writeHead(status, headers).end(body);
}

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = await resolve(path);
    if (file) return await send(req, res, file, 200);
    const notFound = await resolve("/404.html");
    if (notFound) return await send(req, res, notFound, 404);
    res.writeHead(404).end();
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(PORT, () => console.log(`Serving out/ at http://localhost:${PORT}`));
