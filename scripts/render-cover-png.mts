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

/** The site faces a cover may use; latin-subset woff2s from the built CSS. */
const faces = [
  { family: "Newsreader", style: "normal", weight: "200 800" },
  { family: "Newsreader", style: "italic", weight: "200 800" },
  { family: "Hanken Grotesk", style: "normal", weight: "100 900" },
  { family: "Spline Sans Mono", style: "normal", weight: "300 700" },
] as const;

function findFontFiles(): { family: string; style: string; weight: string; file: string }[] {
  if (!existsSync(chunksDir)) {
    throw new Error("render-cover-png: no build output — run `npm run build` first");
  }
  const blocks: string[] = [];
  for (const file of readdirSync(chunksDir).filter((f) => f.endsWith(".css"))) {
    const css = readFileSync(path.join(chunksDir, file), "utf8");
    blocks.push(...(css.match(/@font-face\{[^}]*\}/g) ?? []));
  }
  return faces.map((face) => {
    const block = blocks.find(
      (b) =>
        b.includes(`font-family:${face.family};`) &&
        b.includes(`font-style:${face.style};`) &&
        b.includes("unicode-range:U+??"),
    );
    const src = block?.match(/src:url\(([^)]+)\)/);
    if (!block || !src) {
      throw new Error(
        `render-cover-png: ${face.family} (${face.style}, latin) not found in built CSS`,
      );
    }
    return { ...face, file: path.resolve(chunksDir, src[1]) };
  });
}

const fontFiles = findFontFiles();
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
    const fontCss = fontFiles
      .map(
        (f) => `@font-face { font-family: '${f.family}'; font-style: ${f.style};
                     font-weight: ${f.weight};
                     src: url('file://${f.file}') format('woff2'); }`,
      )
      .join("\n        ");
    writeFileSync(
      wrapper,
      `<!doctype html><meta charset="utf-8"><style>
        ${fontCss}
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
