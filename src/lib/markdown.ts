import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { Content as MdastContent, Parent as MdastParent, Root as MdastRoot } from "mdast";
import rehypeInlineSvg from "./rehypeInlineSvg";
import rehypeRasterImages from "./rehypeRasterImages";
import rehypeTableScroll from "./rehypeTableScroll";

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
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#8b8f93", fontStyle: "italic" } },
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
 * Raw HTML in article markdown would be silently dropped by remark-rehype
 * (no allowDangerousHtml) — an author typing an angle-bracket placeholder in
 * prose would lose content with no trace. Fail the build loudly instead,
 * matching rehypeInlineSvg's stance. HTML comments stay allowed: they are
 * the sanctioned way to annotate a draft without shipping anything.
 */
function remarkNoRawHtml() {
  return (tree: MdastRoot) => {
    const walk = (node: MdastContent | MdastRoot) => {
      if (node.type === "html" && !node.value.trimStart().startsWith("<!--")) {
        const where = node.position
          ? ` at line ${node.position.start.line}`
          : "";
        throw new Error(
          `markdown: raw HTML is not rendered and would be dropped${where}: ` +
            `"${node.value.slice(0, 60)}" — escape the angle brackets or use backticks`,
        );
      }
      if ("children" in node) {
        for (const child of (node as MdastParent).children) walk(child);
      }
    };
    walk(tree);
  };
}

/**
 * Markdown → HTML at build time. Headings get ids (deep-linkable, and the
 * anchors article cross-links rely on); code blocks are highlighted by shiki;
 * site-local .svg images are inlined as dg-figure diagrams (rehypeInlineSvg);
 * raster images get intrinsic dimensions + lazy loading (rehypeRasterImages);
 * tables get a focusable scroll wrapper (rehypeTableScroll).
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkNoRawHtml)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeInlineSvg)
    .use(rehypeRasterImages)
    .use(rehypeTableScroll)
    // defaultLanguage keeps a forgotten language annotation from silently
    // skipping shiki (an unstyled light-on-light block).
    .use(rehypeShiki, { theme: dblnCodeTheme, defaultLanguage: "text" })
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
