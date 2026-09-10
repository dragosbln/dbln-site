// Parser contract for article code references (CodePeek). Imports the TS
// module directly — Node strips types natively.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dirName,
  fileKey,
  fileName,
  parseGithubBlobUrl,
  rangeLabel,
  rawContentUrl,
  refLabel,
} from "../src/lib/githubBlob.ts";

const BASE = "https://github.com/dbln/llm-guard/blob/main/src/guard/retry.ts";
const SHA = "ef4304c524f090b0a84dea3e05a78d3c6a0e8a66";

test("whole-file reference", () => {
  const ref = parseGithubBlobUrl(BASE);
  assert.deepEqual(ref, {
    href: BASE,
    owner: "dbln",
    repo: "llm-guard",
    gitRef: "main",
    path: "src/guard/retry.ts",
    start: undefined,
    end: undefined,
  });
  assert.equal(rangeLabel(ref), null);
  assert.equal(fileKey(ref), "dbln/llm-guard@main:src/guard/retry.ts");
  assert.equal(rawContentUrl(ref), "https://raw.githubusercontent.com/dbln/llm-guard/main/src/guard/retry.ts");
});

test("line range and single line", () => {
  const range = parseGithubBlobUrl(`${BASE}#L50-L53`);
  assert.equal(range.start, 50);
  assert.equal(range.end, 53);
  assert.equal(rangeLabel(range), "L50–L53");
  const single = parseGithubBlobUrl(`${BASE}#L12`);
  assert.equal(single.start, 12);
  assert.equal(single.end, 12);
  assert.equal(rangeLabel(single), "L12");
});

test("column anchors and reversed ranges normalize", () => {
  const ref = parseGithubBlobUrl(`${BASE}#L53C10-L50C2`);
  assert.equal(ref.start, 50);
  assert.equal(ref.end, 53);
});

test("query strings are tolerated, other github URLs are not references", () => {
  assert.ok(parseGithubBlobUrl(`${BASE}?plain=1#L3`));
  assert.equal(parseGithubBlobUrl("https://github.com/dbln/llm-guard"), null);
  assert.equal(parseGithubBlobUrl("https://github.com/dbln/llm-guard/tree/main/src"), null);
  assert.equal(parseGithubBlobUrl("https://github.com/dbln/llm-guard/blob/main/"), null);
  assert.equal(parseGithubBlobUrl(`${BASE}#readme`), null);
});

test("encoded paths decode for display and re-encode for raw fetch", () => {
  const ref = parseGithubBlobUrl("https://github.com/o/r/blob/main/docs/my%20notes.md#L2");
  assert.equal(ref.path, "docs/my notes.md");
  assert.equal(rawContentUrl(ref), "https://raw.githubusercontent.com/o/r/main/docs/my%20notes.md");
});

test("commit refs show as a short sha, branches as written", () => {
  assert.equal(refLabel(SHA), "ef4304c");
  assert.equal(refLabel("main"), "main");
  assert.equal(refLabel("v1.2.0"), "v1.2.0");
});

test("file and directory names", () => {
  assert.equal(fileName("src/guard/retry.ts"), "retry.ts");
  assert.equal(dirName("src/guard/retry.ts"), "src/guard/");
  assert.equal(fileName("README.md"), "README.md");
  assert.equal(dirName("README.md"), "");
});
