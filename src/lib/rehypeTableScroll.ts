import type { Element, Root } from "hast";

/**
 * Build-time rehype plugin: wraps prose tables in a focusable scroll region.
 * `display: block; overflow-x: auto` directly on <table> (the usual fix for
 * wide GFM tables) strips the implicit table ARIA roles and creates a
 * scroller keyboard users can't reach — a wrapper div carries the scrolling
 * instead, so the table keeps `display: table` and its semantics.
 */
export default function rehypeTableScroll() {
  return (tree: Root) => {
    const walk = (node: Root | Element) => {
      // Recurse before wrapping, so the walk never descends into a wrapper
      // it just created (GFM cannot nest tables, so skipping them is safe).
      for (const child of node.children) {
        if (child.type === "element" && child.tagName !== "table") walk(child);
      }
      node.children = node.children.map((child) => {
        if (child.type === "element" && child.tagName === "table") {
          const wrapper: Element = {
            type: "element",
            tagName: "div",
            properties: {
              className: ["table-scroll"],
              tabIndex: 0,
              role: "region",
              ariaLabel: "Scrollable table",
            },
            children: [child],
          };
          return wrapper;
        }
        return child;
      }) as typeof node.children;
    };
    walk(tree);
  };
}
