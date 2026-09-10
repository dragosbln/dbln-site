/**
 * Keyword tint for the CodePeek pane: keywords and comments only, the way
 * the design tints them (no full syntax highlighting, and nothing at all for
 * file types it doesn't know). Output is escaped HTML per line; strings are
 * left plain so their contents are never mistaken for keywords.
 */

type Lang = { kw?: Set<string>; line?: string; block?: [string, string] };

const C_LIKE =
  "import export from default const let var function return if else for while do switch case break continue new await async try catch finally throw class extends implements interface type enum yield in of instanceof typeof void delete this super static readonly public private protected abstract declare namespace module as is keyof satisfies get set null undefined true false int long double float char bool boolean struct union using package final override virtual";

const LANGS: Record<string, Lang> = {
  c: { kw: words(C_LIKE), line: "//", block: ["/*", "*/"] },
  go: {
    kw: words(
      "package import func return if else for range switch case default break continue go defer chan select struct interface map type var const nil true false fallthrough goto",
    ),
    line: "//",
    block: ["/*", "*/"],
  },
  rs: {
    kw: words(
      "use fn let mut pub struct enum impl trait for in if else match return while loop break continue as mod crate self Self super where type const static unsafe async await move ref dyn true false",
    ),
    line: "//",
    block: ["/*", "*/"],
  },
  py: {
    kw: words(
      "import from as def class return if elif else for while in not and or is None True False try except finally raise with lambda yield pass break continue global nonlocal assert del async await",
    ),
    line: "#",
  },
  rb: {
    kw: words(
      "def end class module if elsif else unless while until for in do return yield begin rescue ensure raise require require_relative attr_reader attr_accessor self nil true false and or not then case when",
    ),
    line: "#",
  },
  sh: {
    kw: words(
      "if then else elif fi for while do done case esac in function return export local readonly set unset exit source",
    ),
    line: "#",
  },
  sql: {
    kw: words(
      "select from where and or not in as join left right inner outer on group by order having limit offset insert into values update set delete create table index drop alter primary key references null is distinct union",
    ),
    line: "--",
    block: ["/*", "*/"],
  },
  yaml: { line: "#" },
};

const EXT: Record<string, string> = {
  ts: "c", tsx: "c", js: "c", jsx: "c", mjs: "c", cjs: "c", mts: "c", cts: "c",
  java: "c", kt: "c", kts: "c", swift: "c", cs: "c", c: "c", h: "c", cpp: "c", cc: "c", hpp: "c", scala: "c",
  go: "go", rs: "rs", py: "py", rb: "rb", sh: "sh", bash: "sh", zsh: "sh",
  sql: "sql", yml: "yaml", yaml: "yaml", toml: "yaml",
};

function words(list: string): Set<string> {
  return new Set(list.split(" "));
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export type TintClasses = { keyword: string; comment: string };

/** One escaped HTML string per input line, keywords/comments wrapped. */
export function tintLines(lines: string[], path: string, cls: TintClasses): string[] {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  const lang = LANGS[EXT[ext]];
  if (!lang) return lines.map(escapeHtml);

  const comment = (s: string) => `<i class="${cls.comment}">${escapeHtml(s)}</i>`;
  const keyword = (s: string) => `<b class="${cls.keyword}">${escapeHtml(s)}</b>`;
  let inBlock = false;

  return lines.map((line) => {
    let out = "";
    let i = 0;
    const n = line.length;
    while (i < n) {
      if (inBlock && lang.block) {
        const j = line.indexOf(lang.block[1], i);
        if (j < 0) {
          out += comment(line.slice(i));
          i = n;
        } else {
          out += comment(line.slice(i, j + lang.block[1].length));
          i = j + lang.block[1].length;
          inBlock = false;
        }
        continue;
      }
      if (lang.block && line.startsWith(lang.block[0], i)) {
        const j = line.indexOf(lang.block[1], i + lang.block[0].length);
        if (j < 0) {
          out += comment(line.slice(i));
          i = n;
          inBlock = true;
        } else {
          out += comment(line.slice(i, j + lang.block[1].length));
          i = j + lang.block[1].length;
        }
        continue;
      }
      if (lang.line && line.startsWith(lang.line, i)) {
        out += comment(line.slice(i));
        i = n;
        continue;
      }
      const ch = line[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        let j = i + 1;
        while (j < n && line[j] !== ch) {
          if (line[j] === "\\") j++;
          j++;
        }
        out += escapeHtml(line.slice(i, j + 1));
        i = j + 1;
        continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        let j = i + 1;
        while (j < n && /[\w$]/.test(line[j])) j++;
        const word = line.slice(i, j);
        out += lang.kw?.has(word) ? keyword(word) : escapeHtml(word);
        i = j;
        continue;
      }
      out += escapeHtml(ch);
      i++;
    }
    return out;
  });
}
