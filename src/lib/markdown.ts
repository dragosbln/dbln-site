import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * Code-block theme: the design's dark block (#1b1d20) with the token palette
 * from blog-social/blog.css, expressed as a minimal VS Code theme so shiki
 * inlines the colors at build time. No highlighting JS ships to the client.
 */
const dblnCodeTheme = {
  name: "dbln-dark",
  type: "dark" as const,
  colors: {
    "editor.background": "#1b1d20",
    "editor.foreground": "#e8e6e0",
  },
  tokenColors: [
    { settings: { foreground: "#e8e6e0" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#7e8285", fontStyle: "italic" } },
    { scope: ["keyword", "storage.type", "storage.modifier", "keyword.operator.new", "keyword.operator.expression"], settings: { foreground: "#6ee7da" } },
    { scope: ["string", "string.template", "punctuation.definition.string"], settings: { foreground: "#c3d98f" } },
    { scope: ["constant.numeric", "constant.language", "support.constant", "constant.other"], settings: { foreground: "#e0a36b" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call.generic"], settings: { foreground: "#9ec5ff" } },
    { scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"], settings: { foreground: "#9ec5ff" } },
    { scope: ["variable.other.property", "variable.other.object.property", "support.variable.property", "meta.object-literal.key"], settings: { foreground: "#d7c8ff" } },
    { scope: ["entity.name.tag"], settings: { foreground: "#6ee7da" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#c3d98f" } },
    { scope: ["markup.heading", "punctuation.definition.heading"], settings: { foreground: "#9ec5ff" } },
    { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
  ],
};

/**
 * Markdown → HTML at build time. Headings get ids (deep-linkable, and the
 * anchors article cross-links rely on); code blocks are highlighted by shiki.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeShiki, { theme: dblnCodeTheme })
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
