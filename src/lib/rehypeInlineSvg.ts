import fs from "node:fs";
import path from "node:path";
import rehypeParse from "rehype-parse";
import { unified } from "unified";
import type { Element, ElementContent, Root, RootContent } from "hast";

/**
 * Build-time rehype plugin: inlines site-local SVG diagrams into the page.
 *
 * `![caption](/blog/<slug>/<figure>.svg)` becomes
 * `<figure class="dg-figure"><svg …/><figcaption>caption</figcaption></figure>`
 * with the SVG file's actual markup in the DOM, so the diagram system's
 * classes (dg-*, styled globally by src/styles/diagram.css) apply — a bare
 * <img> cannot be styled by page CSS and would render unstyled.
 *
 * The image alt becomes the visible figcaption; the SVG's own
 * title/desc/aria-label carry the accessible narration. Raster images and
 * external SVGs are left untouched. A missing or non-SVG file fails the
 * build loudly on purpose.
 */

const svgParser = unified().use(rehypeParse, { fragment: true });

function loadSvg(src: string, cache: Map<string, Element>): Element {
  const cached = cache.get(src);
  if (cached) return structuredClone(cached);

  const file = path.join(process.cwd(), "public", src);
  if (!fs.existsSync(file)) {
    throw new Error(`rehypeInlineSvg: ${src} not found at ${file}`);
  }
  const tree = svgParser.parse(fs.readFileSync(file, "utf8"));
  const svg = tree.children.find(
    (node): node is Element => node.type === "element" && node.tagName === "svg",
  );
  if (!svg) {
    throw new Error(`rehypeInlineSvg: ${src} has no root <svg> element`);
  }
  cache.set(src, svg);
  return structuredClone(svg);
}

function isInlinableImg(node: RootContent | ElementContent): node is Element {
  return (
    node.type === "element" &&
    node.tagName === "img" &&
    typeof node.properties?.src === "string" &&
    node.properties.src.startsWith("/blog/") &&
    node.properties.src.endsWith(".svg")
  );
}

function buildFigure(img: Element, cache: Map<string, Element>): Element {
  const src = img.properties.src as string;
  const alt = typeof img.properties.alt === "string" ? img.properties.alt : "";
  const children: ElementContent[] = [loadSvg(src, cache)];
  if (alt) {
    children.push({
      type: "element",
      tagName: "figcaption",
      properties: {},
      children: [{ type: "text", value: alt }],
    });
  }
  return {
    type: "element",
    tagName: "figure",
    properties: { className: ["dg-figure"] },
    children,
  };
}

/** True when the paragraph holds only this image (and whitespace). */
function isImgOnlyParagraph(node: RootContent | ElementContent): node is Element {
  if (node.type !== "element" || node.tagName !== "p") return false;
  const meaningful = node.children.filter(
    (child) => !(child.type === "text" && child.value.trim() === ""),
  );
  return meaningful.length === 1 && isInlinableImg(meaningful[0]);
}

export default function rehypeInlineSvg() {
  return (tree: Root) => {
    const cache = new Map<string, Element>();

    const walk = (node: Root | Element) => {
      node.children = node.children.map((child) => {
        // <p><img …svg></p> → the figure replaces the paragraph
        // (a <figure> inside <p> is invalid HTML and would be re-parsed badly)
        if (isImgOnlyParagraph(child)) {
          const img = child.children.find(isInlinableImg);
          if (img) return buildFigure(img, cache);
        }
        if (isInlinableImg(child)) return buildFigure(child, cache);
        return child;
      }) as typeof node.children;

      for (const child of node.children) {
        if (child.type === "element") walk(child);
      }
    };

    walk(tree);
  };
}
