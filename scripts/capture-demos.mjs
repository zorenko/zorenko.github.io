/* Takes the stills and recordings that stand in for the live demos where they can't be used (components/demo.tsx):
   for each demo in content/work.ts, in its folder in public/demos/<name>/,
   - still.webp and still@2x.webp: the demo as it opens, at its size and at twice it;
   - tour.mp4: one round of its walkthrough, H.264, for phones and tablets.
   Take them again when a demo's screens or its walkthrough change.

   Needs Playwright, which the site doesn't depend on, and ffmpeg. Run it from a folder that has Playwright, outside
   the repo:
     mkdir -p /tmp/democap && cd /tmp/democap && npm i playwright
     node <repo>/scripts/capture-demos.mjs [visuals celsia …]
   With names, it takes only those demos. It serves public/ itself. */

import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "public");
const { chromium } = createRequire(join(process.cwd(), "/"))("playwright");
const { WORK } = await import(join(ROOT, "content/work.ts"));

// The walkthrough's cursor on a phone: the recording is shown at about a third of its size, so the cursor and its name
// are drawn larger than in the live demo to read there
const CURSOR_SCALE = 2.4;
const FPS = 30;
const CRF = 30; // H.264 quality: the demos are flat UI and compress well

const only = process.argv.slice(2);
const demos = WORK.filter((w) => w.media.type === "demo")
  .map((w) => ({ ...w.media, name: w.media.src.split("/")[2] }))
  .filter((d) => !only.length || only.includes(d.name));

// public/, served as the site serves it
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".woff2": "font/woff2", ".mp4": "video/mp4" };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try {
    const body = await readFile(join(PUBLIC, path.endsWith("/") ? path + "index.html" : path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const origin = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
const withQuery = (src, q) => src + (src.includes("?") ? "&" : "?") + q;

async function open(demo, { scale, walk }) {
  const page = await browser.newPage({ viewport: { width: demo.width, height: demo.height }, deviceScaleFactor: scale });
  page.on("pageerror", (e) => console.error(`  ${demo.name}: ${e.message}`));
  await page.goto(origin + withQuery(demo.src, walk ? `walkscale=${CURSOR_SCALE}` : "nowalk"), { waitUntil: "load" });
  // A glass demo is see-through where the card's tint shows through: the stills and recording have it under them
  if (demo.glass) await page.addStyleTag({ content: `html { background: ${demo.background} !important; }` });
  await page.evaluate(() => document.fonts.ready);
  // As the site waits before it shows the live demo (components/demo.tsx): its pictures in view have loaded
  await page.evaluate(() => window.demoReady);
  await page.waitForTimeout(600);
  return page;
}

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
  if (r.status) throw new Error(`ffmpeg failed: ${args.join(" ")}`);
}

// WebP from Chromium's canvas: this Mac's ffmpeg can't write it
async function webp(png, width, height, quality, file) {
  const page = await browser.newPage();
  const url = await page.evaluate(async ({ src, width, height, quality }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = Object.assign(document.createElement("canvas"), { width, height });
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, width, height);
    return c.toDataURL("image/webp", quality);
  }, { src: `data:image/png;base64,${png.toString("base64")}`, width, height, quality });
  await page.close();
  writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
}

async function stills(demo, dir) {
  const page = await open(demo, { scale: 2, walk: false });
  const png = await page.screenshot();
  await page.close();
  await webp(png, demo.width * 2, demo.height * 2, 0.74, join(dir, "still@2x.webp"));
  await webp(png, demo.width, demo.height, 0.8, join(dir, "still.webp"));
}

// One round of the walkthrough, from the page as it opens to the end of its last scene, as Chrome paints it (its
// screencast sends a frame each time the page changes; each frame lasts until the next)
async function tour(demo, dir) {
  const frames = join(tmpdir(), `${demo.name}-frames`);
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames);
  const page = await open(demo, { scale: 1, walk: true });
  const round = page.evaluate(() => new Promise((r) => addEventListener("walkthrough-round", r, { once: true })));
  const cdp = await page.context().newCDPSession(page);
  const shots = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const file = join(frames, `${String(shots.length).padStart(5, "0")}.jpg`);
    writeFileSync(file, Buffer.from(data, "base64"));
    shots.push({ file, t: metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, maxWidth: demo.width, maxHeight: demo.height, everyNthFrame: 1 });
  await Promise.race([round, page.waitForTimeout(180_000)]);
  await page.waitForTimeout(400);
  const end = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await page.close();

  const list = shots.map((s, i) => `file '${s.file}'\nduration ${((shots[i + 1]?.t ?? end) - s.t).toFixed(4)}`);
  const concat = join(frames, "list.txt");
  writeFileSync(concat, `ffconcat version 1.0\n${list.join("\n")}\nfile '${shots.at(-1).file}'\n`);
  ffmpeg([
    "-f", "concat", "-safe", "0", "-i", concat,
    "-vf", `fps=${FPS},scale=${demo.width}:${demo.height}:flags=lanczos,crop=trunc(iw/2)*2:trunc(ih/2)*2:0:0,format=yuv420p`,
    "-c:v", "libx264", "-preset", "slow", "-crf", String(CRF), "-tune", "animation",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-movflags", "+faststart", "-an", join(dir, "tour.mp4"),
  ]);
  rmSync(frames, { recursive: true, force: true });
  return (end - shots[0].t).toFixed(1);
}

for (const demo of demos) {
  const dir = join(PUBLIC, "demos", demo.name);
  process.stdout.write(`${demo.name}: stills… `);
  await stills(demo, dir);
  process.stdout.write("tour… ");
  const s = await tour(demo, dir);
  console.log(`${s} s`);
}

await browser.close();
server.close();
