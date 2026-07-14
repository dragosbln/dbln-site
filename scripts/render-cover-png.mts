// Rasterizes public/blog/covers/<slug>.svg into a committed 1200×630 PNG
// twin (public/blog/covers/<slug>.png) for og:image — the major link
// scrapers (X, Facebook, LinkedIn, Slack) do not render SVG. Run it after
// adding or editing a cover:
//
//   npm run build && node scripts/render-cover-png.mts [slug]
//
// The build must exist first: the wrapper page embeds the site's own built
// Spline Sans Mono woff2 so the FIG label renders in the real face, not a
// fallback. Requires Google Chrome (override the binary with CHROME_BIN).
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const coversDir = path.join(process.cwd(), "public", "blog", "covers");
const chunksDir = path.join(process.cwd(), "out", "_next", "static", "chunks");

const chrome =
  process.env.CHROME_BIN ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(chrome)) {
  throw new Error(`render-cover-png: Chrome not found at ${chrome} (set CHROME_BIN)`);
}

/** The latin-subset Spline Sans Mono woff2 from the built CSS. */
function findFontFile(): string {
  if (!existsSync(chunksDir)) {
    throw new Error("render-cover-png: no build output — run `npm run build` first");
  }
  for (const file of readdirSync(chunksDir).filter((f) => f.endsWith(".css"))) {
    const css = readFileSync(path.join(chunksDir, file), "utf8");
    const match = css.match(
      /@font-face\{font-family:Spline Sans Mono;[^}]*src:url\(([^)]+)\)[^}]*unicode-range:U\+\?\?/,
    );
    if (match) return path.resolve(chunksDir, match[1]);
  }
  throw new Error("render-cover-png: Spline Sans Mono not found in built CSS");
}

const fontFile = findFontFile();
const only = process.argv[2];
const covers = readdirSync(coversDir).filter(
  (f) => f.endsWith(".svg") && (!only || f === `${only}.svg`),
);
if (covers.length === 0) {
  throw new Error(`render-cover-png: no covers matched${only ? ` "${only}"` : ""}`);
}

const tmp = mkdtempSync(path.join(os.tmpdir(), "covers-"));
try {
  for (const cover of covers) {
    const svg = readFileSync(path.join(coversDir, cover), "utf8");
    const wrapper = path.join(tmp, cover.replace(/\.svg$/, ".html"));
    writeFileSync(
      wrapper,
      `<!doctype html><meta charset="utf-8"><style>
        @font-face { font-family: 'Spline Sans Mono';
                     src: url('file://${fontFile}') format('woff2'); }
        * { margin: 0 } svg { display: block }
      </style>${svg}`,
    );
    const png = path.join(coversDir, cover.replace(/\.svg$/, ".png"));
    execFileSync(chrome, [
      "--headless=new",
      `--screenshot=${png}`,
      "--window-size=1200,630",
      "--hide-scrollbars",
      "--disable-gpu",
      `file://${wrapper}`,
    ]);
    console.log(`render-cover-png: ${path.basename(png)} (${statSync(png).size} bytes)`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
