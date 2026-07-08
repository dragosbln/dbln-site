#!/usr/bin/env node
/* Render a diagram-in-progress for review.
   Usage: node workbench.mjs <file.svg> [--out diagram-workbench.html]
   Writes a self-contained page (repo root by default, gitignored) showing the
   figure at full width, at 360px, and with motion disabled (= the
   reduced-motion state), plus an id-badge toggle for precise feedback. */

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const svgPath = args.find((a) => !a.startsWith("--"));
if (!svgPath) {
  console.error("usage: node workbench.mjs <file.svg> [--out <file.html>]");
  process.exit(2);
}
const outIdx = args.indexOf("--out");
const outPath = outIdx !== -1 ? args[outIdx + 1] : "diagram-workbench.html";

const svg = fs.readFileSync(svgPath, "utf8");
const diagramCss = fs.readFileSync(path.join(process.cwd(), "src/styles/diagram.css"), "utf8");
// the tokens the diagram css depends on, mirrored from globals.css
const tokens = `:root {
  --paper: #f6f4ef; --paper-2: #efece4; --ink: #17191c; --ink-soft: #4a4d52;
  --ink-faint: #6b6e73; --line: #d9d5cb; --teal: #0c7b72; --teal-deep: #0a5b55;
  --accent-wash: #e4efec; --red: #a83a2e; --red-deep: #7e2b21; --red-wash: #f5e3de;
  --serif: "Newsreader", Georgia, serif;
  --sans: "Hanken Grotesk", system-ui, sans-serif;
  --mono: "Spline Sans Mono", ui-monospace, monospace;
}`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagram workbench — ${path.basename(svgPath)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Hanken+Grotesk:wght@400;600&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
${tokens}
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--sans); }
.wrap { max-width: 780px; margin: 0 auto; padding: 32px 20px 80px; }
h1 { font-family: var(--serif); font-weight: 500; font-size: 24px; margin: 0 0 4px; }
.sub { font-family: var(--mono); font-size: 11px; color: var(--ink-faint); margin-bottom: 24px; }
.controls { font-family: var(--mono); font-size: 12px; color: var(--ink-soft); margin-bottom: 20px; }
h2 { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--teal-deep); margin: 36px 0 10px; font-weight: 500; }
.figure { border: 1px solid var(--line); border-radius: 14px; background: var(--paper-2);
  padding: 22px 22px 16px; margin: 0; }
.figure svg { width: 100%; height: auto; display: block; }
.phone { width: 360px; max-width: 100%; }
.rm * { animation: none !important; }
.badge { font-family: var(--mono); font-size: 9px; fill: #fff; }
.badge-bg { fill: var(--ink); opacity: .85; }
${diagramCss}
</style>
</head>
<body>
<div class="wrap">
  <h1>Diagram workbench</h1>
  <div class="sub">${path.basename(svgPath)} · give feedback by badge id ("move n3 down", "e2 becomes the flow")</div>
  <div class="controls"><label><input type="checkbox" id="badges"> show element ids</label></div>

  <h2>Full width</h2>
  <figure class="figure" id="main">${svg}</figure>

  <h2>At 360px</h2>
  <div class="phone"><figure class="figure">${svg}</figure></div>

  <h2>Motion off (reduced-motion state)</h2>
  <figure class="figure rm">${svg}</figure>
</div>
<script>
document.getElementById("badges").addEventListener("change", (e) => {
  const svg = document.querySelector("#main svg");
  svg.querySelectorAll(".wb-badge").forEach((b) => b.remove());
  if (!e.target.checked) return;
  svg.querySelectorAll("[id]").forEach((el) => {
    if (el.tagName === "marker" || el.closest("defs")) return;
    let box; try { box = el.getBBox(); } catch { return; }
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "wb-badge");
    const w = 8 + el.id.length * 6;
    g.innerHTML = '<rect class="badge-bg" x="' + box.x + '" y="' + (box.y - 14) + '" width="' + w + '" height="13" rx="3"/>' +
      '<text class="badge" x="' + (box.x + 4) + '" y="' + (box.y - 4) + '">' + el.id + "</text>";
    svg.appendChild(g);
  });
});
</script>
</body>
</html>
`;

fs.writeFileSync(outPath, html);
console.log(`workbench written: ${outPath}`);
