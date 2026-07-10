/**
 * Suffix every id inside an SVG (and rewrite the url(#…) references that
 * point at them) so a cloned diagram can coexist with the original on the
 * same page without marker/gradient definitions colliding.
 * Client-side DOM utility — used by DiagramLightbox (modal clones) and
 * ArticlePeek (diagrams inside fetched article fragments).
 */
export function suffixSvgIds(svg: SVGSVGElement, suffix: string): void {
  svg.querySelectorAll("[id]").forEach((el) => {
    el.id = `${el.id}${suffix}`;
  });
  svg.querySelectorAll("*").forEach((el) => {
    for (const name of el.getAttributeNames()) {
      const value = el.getAttribute(name);
      if (value && value.includes("url(#")) {
        el.setAttribute(
          name,
          value.replace(/url\(#([^)]+)\)/g, `url(#$1${suffix})`),
        );
      }
    }
  });
}
