#!/usr/bin/env node
/* Validate article-diagram SVGs against the dg-* grammar.
   Usage: node validate.mjs <file.svg> [more.svg …]
   Errors (exit 1) = mechanical rule violations.
   Warnings = judgment calls to surface to the user. */

import fs from "node:fs";

const PALETTE = new Set(
  [
    "#f6f4ef", "#efece4", "#17191c", "#4a4d52", "#6b6e73", "#d9d5cb",
    "#0c7b72", "#0a5b55", "#e4efec", "#a83a2e", "#7e2b21", "#f5e3de",
    "#8a8c8f", // arrowhead gray (markers only)
    "none", "transparent", "currentcolor",
  ],
);

const CLASSES = new Set([
  "dg-node", "key", "legacy", "fail", "t", "s",
  "dg-edge", "dg-flow", "run", "dg-step", "dg-band", "live", "dg-note",
  "dg-cell", "ghost", "dg-chip", "plain", "dg-wire",
  "dg-seq", "hl", "ring", "dg-appear", "dg-recede", "dg-pulse", "outline",
  "dg-stall", "dg-meter", "dg-visit",
]);

// motion families for the one-idea heuristic; pairs that form one idea share a name
const FAMILIES = [
  [/\bdg-flow\b[^"]*\brun\b|\brun\b[^"]*\bdg-flow\b/, "flow"],
  [/\bdg-seq\b/, "sequence"],
  [/\bdg-appear\b|\bdg-recede\b/, "transition"],
  [/\bdg-pulse\b/, "failure-pulse"],
  [/\bdg-stall\b|\bdg-meter\b/, "accumulation"],
  [/\bdg-visit\b/, "movement"],
];

function check(file) {
  const errors = [];
  const warnings = [];
  const src = fs.readFileSync(file, "utf8");
  const body = src.replace(/<!--[\s\S]*?-->/g, "");

  // --- balanced tags (svg subset; no CDATA/DOCTYPE expected) ---
  const stack = [];
  const tagRe = /<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
  let m;
  while ((m = tagRe.exec(body)) !== null) {
    const [full, name, attrs] = m;
    if (full.startsWith("</")) {
      if (stack.pop() !== name) errors.push(`unbalanced </${name}>`);
    } else if (!full.endsWith("/>")) {
      stack.push(name);
    }
    // quotes must be paired inside the tag
    const quotes = (attrs.match(/"/g) || []).length;
    if (quotes % 2 !== 0) errors.push(`odd number of quotes in <${name} …>`);
  }
  if (stack.length) errors.push(`unclosed tags: ${stack.join(", ")}`);

  // --- root requirements ---
  const rootMatch = body.match(/<svg\b[^>]*>/);
  const root = rootMatch ? rootMatch[0] : "";
  if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(root)) errors.push("root <svg> missing xmlns");
  if (!/role="img"/.test(root)) errors.push('root <svg> missing role="img"');
  const vb = root.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!vb) errors.push("missing/nonstandard viewBox");
  else if (Number(vb[1]) !== 440) warnings.push(`viewBox width ${vb[1]} (articles standardize on 440 for mobile legibility)`);
  const aria = root.match(/aria-label="([^"]*)"/);
  if (!aria) errors.push("missing aria-label");
  else if (aria[1].length < 80) errors.push("aria-label too short — narrate the full diagram, motion included");
  if (!/<title>[^<]+<\/title>/.test(body)) errors.push("missing <title>");
  if (!/<desc>[^<]+<\/desc>/.test(body)) errors.push("missing <desc>");

  // --- ids unique, url(#) refs resolve ---
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) errors.push(`duplicate ids: ${[...new Set(dup)].join(", ")}`);
  for (const [, ref] of body.matchAll(/url\(#([^)]+)\)/g)) {
    if (!ids.includes(ref)) errors.push(`url(#${ref}) does not resolve`);
  }

  // --- class whitelist ---
  for (const [, cls] of body.matchAll(/class="([^"]+)"/g)) {
    for (const token of cls.trim().split(/\s+/)) {
      if (!CLASSES.has(token)) errors.push(`unknown class "${token}" — not in the grammar`);
    }
  }

  // --- literal colors must be palette; style attrs custom-props only ---
  for (const [, attr, val] of body.matchAll(/\b(fill|stroke)="([^"]+)"/g)) {
    const v = val.trim().toLowerCase();
    if (v.startsWith("url(")) continue;
    if (!PALETTE.has(v)) errors.push(`literal ${attr}="${val}" is outside the palette`);
  }
  for (const [, style] of body.matchAll(/style="([^"]*)"/g)) {
    if (!/^(\s*--[a-z]+:\s*[^;"]+;?\s*)+$/i.test(style)) {
      errors.push(`style="${style}" — style attributes may only set --i/--dx/--dy`);
    }
  }
  if (/font-size="/.test(body)) errors.push("inline font-size — text sizes come from the vocabulary classes");
  if (/<animate|<animateTransform|<script/i.test(body)) errors.push("SMIL/script found — motion comes from the CSS grammar only");

  // --- motion inventory (judgment heuristic) ---
  const used = FAMILIES.filter(([re]) => re.test(body)).map(([, name]) => name);
  if (used.length === 0) warnings.push("no motion classes — fine for a static figure, otherwise add the one idea");
  if (used.length >= 3) warnings.push(`motion families used: ${used.join(", ")} — check the one-idea rule with the user`);

  return { file, errors, warnings, motion: used };
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node validate.mjs <file.svg> […]");
  process.exit(2);
}

let failed = false;
for (const file of files) {
  const { errors, warnings, motion } = check(file);
  const status = errors.length ? "FAIL" : "PASS";
  if (errors.length) failed = true;
  console.log(`${status}  ${file}  (motion: ${motion.join("+") || "none"})`);
  for (const e of errors) console.log(`  error: ${e}`);
  for (const w of warnings) console.log(`  warn:  ${w}`);
}
process.exit(failed ? 1 : 0);
