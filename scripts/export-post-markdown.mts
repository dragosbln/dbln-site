// Copies src/content/posts/*.md into public/blog/ so every article ships a
// raw-markdown twin at /blog/<slug>.md (the llms.txt "append .md" contract).
// Runs via the predev/prebuild npm hooks; output is gitignored.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "src", "content", "posts");
const dest = path.join(process.cwd(), "public", "blog");

/**
 * Full-line comments in the frontmatter block are internal notes (TODOs,
 * reminders) — the public twin must never ship them. The body is untouched.
 */
function stripFrontmatterComments(markdown: string): string {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return markdown;
  const cleaned = match[1]
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
  return `---\n${cleaned}\n---` + markdown.slice(match[0].length);
}

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
  const markdown = readFileSync(path.join(src, file), "utf8");
  writeFileSync(path.join(dest, file), stripFrontmatterComments(markdown));
}
console.log(
  `export-post-markdown: ${files.length} markdown twin(s) → public/blog/` +
    (pruned ? ` (pruned ${pruned} stale)` : ""),
);
