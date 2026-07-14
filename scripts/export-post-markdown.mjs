// Copies src/content/posts/*.md into public/blog/ so every article ships a
// raw-markdown twin at /blog/<slug>.md (the llms.txt "append .md" contract).
// Runs via the predev/prebuild npm hooks; output is gitignored.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "src", "content", "posts");
const dest = path.join(process.cwd(), "public", "blog");

mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => f.endsWith(".md"));

// prune twins of deleted/renamed posts so ghosts never ship
let pruned = 0;
for (const stale of readdirSync(dest).filter((f) => f.endsWith(".md"))) {
  if (!files.includes(stale)) {
    rmSync(path.join(dest, stale));
    pruned++;
  }
}

for (const file of files) {
  copyFileSync(path.join(src, file), path.join(dest, file));
}
console.log(
  `export-post-markdown: ${files.length} markdown twin(s) → public/blog/` +
    (pruned ? ` (pruned ${pruned} stale)` : ""),
);
