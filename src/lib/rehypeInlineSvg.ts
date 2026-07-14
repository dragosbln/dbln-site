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
 * build loudly on purpose — as does an inlinable SVG in a position where a
 * <figure> would be invalid HTML (mid-paragraph, inside a link).
 *
 * Every id inside an inlined SVG is suffixed per figure (build-time port of
 * src/lib/svgIds.ts) so articles with several diagrams don't ship duplicate
 * DOM ids.
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

/**
 * Suffix every id inside the SVG and every reference to one — url(#…),
 * href="#…", and SMIL begin/end event targets like "e1.end" — so a page
 * inlining several diagrams (or the same diagram twice) stays valid HTML.
 * Only ids actually defined in this SVG are rewritten.
 */
function suffixIds(svg: Element, suffix: string): void {
  const ids = new Set<string>();
  const collect = (el: Element) => {
    if (typeof el.properties?.id === "string") ids.add(el.properties.id);
    for (const child of el.children) {
      if (child.type === "element") collect(child);
    }
  };
  collect(svg);
  if (ids.size === 0) return;

  const rewrite = (el: Element) => {
    const props = el.properties ?? {};
    for (const [key, value] of Object.entries(props)) {
      if (typeof value !== "string") continue;
      if (key === "id" && ids.has(value)) {
        props[key] = `${value}${suffix}`;
      } else if (
        (key === "href" || key === "xLinkHref") &&
        value.startsWith("#") &&
        ids.has(value.slice(1))
      ) {
        props[key] = `#${value.slice(1)}${suffix}`;
      } else if (key === "begin" || key === "end") {
        props[key] = value.replace(
          /([A-Za-z_][\w-]*)\.(begin|end|click|repeat)/g,
          (match, id, event) => (ids.has(id) ? `${id}${suffix}.${event}` : match),
        );
      } else if (value.includes("url(#")) {
        props[key] = value.replace(/url\(#([^)]+)\)/g, (match, id) =>
          ids.has(id) ? `url(#${id}${suffix})` : match,
        );
      }
    }
    for (const child of el.children) {
      if (child.type === "element") rewrite(child);
    }
  };
  rewrite(svg);
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

/** Landscape when the viewBox is wider than tall. */
function isWide(svg: Element): boolean {
  const viewBox = svg.properties?.viewBox;
  if (typeof viewBox !== "string") return false;
  const [, , width, height] = viewBox.split(/\s+/).map(Number);
  return width > height;
}

function buildFigure(
  img: Element,
  cache: Map<string, Element>,
  suffix: string,
): Element {
  const src = img.properties.src as string;
  const alt = typeof img.properties.alt === "string" ? img.properties.alt : "";
  const svg = loadSvg(src, cache);
  suffixIds(svg, suffix);

  const children: ElementContent[] = [
    // horizontal scroller: on narrow screens, wide diagrams keep a legible
    // minimum width and pan instead of shrinking (diagram.css .dg-scroll)
    {
      type: "element",
      tagName: "div",
      properties: { className: ["dg-scroll"] },
      children: [svg],
    },
    // expand-to-lightbox control; hidden until DiagramLightbox wires it up,
    // so a no-JS page shows no dead button. aria-label names the figure so
    // several expand buttons on one page stay distinguishable.
    {
      type: "element",
      tagName: "button",
      properties: {
        type: "button",
        className: ["dg-expand"],
        hidden: true,
        ariaHasPopup: "dialog",
        ariaLabel: alt ? `Expand diagram: ${alt}` : "Expand diagram",
      },
      children: [{ type: "text", value: "expand ⤢" }],
    },
  ];
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
    properties: {
      className: isWide(svg) ? ["dg-figure", "dg-wide"] : ["dg-figure"],
    },
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

/** First inlinable SVG img anywhere under this node, or null. */
function findInlinable(node: Element): Element | null {
  for (const child of node.children) {
    if (child.type !== "element") continue;
    if (isInlinableImg(child)) return child;
    const found = findInlinable(child);
    if (found) return found;
  }
  return null;
}

export default function rehypeInlineSvg() {
  return (tree: Root) => {
    const cache = new Map<string, Element>();
    let figureCount = 0;

    const walk = (node: Root | Element) => {
      node.children = node.children.map((child) => {
        // <p><img …svg></p> → the figure replaces the paragraph
        // (a <figure> inside <p> is invalid HTML and would be re-parsed badly)
        if (isImgOnlyParagraph(child)) {
          const img = child.children.find(isInlinableImg);
          if (img) return buildFigure(img, cache, `-fg${++figureCount}`);
        }
        if (isInlinableImg(child)) return buildFigure(child, cache, `-fg${++figureCount}`);
        return child;
      }) as typeof node.children;

      for (const child of node.children) {
        if (child.type !== "element") continue;
        // Any inlinable SVG still inside a paragraph or link at this point is
        // mixed content — a figure there would be invalid HTML that browsers
        // re-parse into stray paragraphs. Fail the build with the fix.
        if (child.tagName === "p" || child.tagName === "a") {
          const stray = findInlinable(child);
          if (stray) {
            throw new Error(
              `rehypeInlineSvg: ${stray.properties.src} sits inside a <${child.tagName}> ` +
                `with other content — put the image in its own paragraph`,
            );
          }
          continue;
        }
        walk(child);
      }
    };

    walk(tree);
  };
}
