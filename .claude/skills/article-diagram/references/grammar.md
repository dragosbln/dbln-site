# The diagram grammar

Everything a figure may use. The stylesheet at `src/styles/diagram.css` is the
source of truth for values; this file is the source of truth for *meaning*.
The six files in `references/exemplars/` are canonical — when in doubt, imitate
them, not your training data.

## Canvas

- `viewBox="0 0 440 H"` — height as the composition needs. 440 is the mobile
  contract: at a 360px phone column the SVG renders ~296px wide (0.67 scale),
  and the text sizes below are tuned to survive exactly that.
- Prefer vertical composition (stack, don't spread). Generous negative space.
- Root element: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 H"
  role="img" aria-label="…">` followed by `<title>` and `<desc>`.
- The aria-label is a full paragraph narrating the diagram INCLUDING what the
  motion shows. A crawler or screen-reader user gets the whole argument.

## Palette (closed)

| token | hex | meaning |
|---|---|---|
| --paper | #f6f4ef | page background (figures sit on --paper-2) |
| --paper-2 | #efece4 | figure background, recessed fills |
| --ink | #17191c | structure, primary labels |
| --ink-soft | #4a4d52 | secondary text |
| --ink-faint | #6b6e73 | edges, notes, bands |
| --line | #d9d5cb | hairlines, plain node strokes, meter track |
| --teal | #0c7b72 | THE live/correct/load-bearing idea |
| --teal-deep | #0a5b55 | teal detail, step numbers, live bands |
| --accent-wash | #e4efec | pale fill behind teal subjects (dg-cell) |
| --red | #a83a2e | failure, violation, the moment it breaks |
| --red-deep | #7e2b21 | red detail |
| --red-wash | #f5e3de | pale fill behind a red subject |
| (literal) | #8a8c8f | arrowhead gray, markers only |

Rationing: at most ONE teal idea and ONE red idea per figure. Red only when
the figure's argument IS a failure; most figures use none. There is no green:
teal already means success/live. No other colors, no gradients, no shadows.

## State vocabulary (static — never animated)

| class | meaning |
|---|---|
| `dg-node` | plain component (rect + `.t` title + optional `.s` subtitle, both centered: set x to the rect's center) |
| `dg-node key` | the live / load-bearing part (teal stroke) |
| `dg-node legacy` | retired or deliberately not built (dashed, no fill) |
| `dg-node fail` | the failing / violated component (red stroke) |
| `dg-edge` | static connection; add `marker-end="url(#<fig>-ah)"` for direction |
| `dg-edge legacy` | retired connection |
| `dg-edge fail` | the failing connection (pair with a red arrowhead marker) |
| `dg-step` | numbered circle marker for ordered flows |
| `dg-band` / `dg-band live` | uppercase section caption inside the svg |
| `dg-note` | small annotation |
| `dg-cell` / `dg-cell ghost` | internal layer of a node / empty slot |
| `dg-chip` / `dg-chip plain` | small pill / muted pill |
| `dg-wire` | faint fan-in wiring |

## Motion grammar (one animated idea per figure)

| class | pattern | timing | exemplar |
|---|---|---|---|
| `dg-flow run` | flow — traffic streams along an edge (duplicate the edge's exact `d`) | 1s linear ∞ | m1-flow |
| `dg-seq` + `--i` | sequence — overlays lit in strict order | 5.2s = 4×1.1s stagger + rest | m2-sequence |
| `dg-appear`/`dg-recede` | transition — crossfade between superimposed states, with holds | 6s ease-in-out | m3-transition |
| `dg-pulse` + `--i` | failure — red overlay pulse; `--i` picks the beat so paths can alternate | 6s, one 3s beat per index | m4-failure |
| `dg-stall` + `dg-meter` | accumulation — flow freezes while a meter fills on the same clock | 6s linear | m5-accumulation |
| `dg-visit` + `--i --dx --dy` | movement — whole groups take turns occupying a slot | 9s = 3×3s beats | m6-movement |

Convergence (N inputs → 1 operation → N results, e.g. single-flight refresh)
needs no new class: it is `dg-flow run` on the single shared edge with the
N ghost alternatives as `dg-edge legacy`.

## Hard rules

1. **One animated idea.** Supporting context motion (e.g. m5's request-in flow)
   is allowed only when it cannot be mistaken for the subject.
2. **Defaults are the reduced-motion state.** Overlay classes default to
   `opacity: 0`; animation lives only inside the gate (already true in the
   stylesheet — do not inline animation styles in the SVG).
3. **Static-complete.** The reduced-motion frame carries ALL information:
   overlays may only duplicate existing elements for emphasis; in transitions,
   dashed remnants carry the "before".
4. Animate only opacity, transform, stroke-dashoffset. Move whole `<g>` groups.
5. Dash offsets in multiples of the dash period (5+11 = 16) for seamless loops.
6. Text: never animated, never smaller than the vocabulary sizes, mono only.
7. Marker ids are namespaced per figure: `<figure-prefix>-ah` (gray),
   `-ah-t` (teal), `-ah-r`/`-ah-rp` (red). All `url(#…)` refs must resolve.
8. `style=""` attributes may contain ONLY custom properties (`--i`, `--dx`,
   `--dy`). Everything else comes from classes; literal fill/stroke values are
   allowed only for palette hexes (the × mark, meter fills, boundary lines).
9. Addressable anatomy: give every node and edge a stable id (`n1…`, `e1…`) so
   feedback and edits can target elements precisely ("make e2 the flow").
   The workbench can display these as badges.

## SVG gotchas (paid for already — don't rediscover)

- Standalone `.svg` files need `xmlns="http://www.w3.org/2000/svg"`.
- Whitespace collapses in SVG text; use `xml:space="preserve"` for multi-space
  legend lines.
- `transform-box: fill-box; transform-origin: left center;` for scaleX meters.
- Class-styled SVG has NO styling as a bare `<img>` — these figures only work
  inlined into a page that loads `diagram.css` (the workbench does this; the
  article pipeline inlines at build).

## The brief (fill before drawing anything)

```
FIGURE      <article-slug>/<figure-name>
PATTERN     flow | sequence | transition | failure | accumulation | movement
SUBJECT     <the system/flow, in the article's own terms>
ARGUMENT    <one sentence the reader must conclude — this IS the figure>
THE MOTION  <the one animated idea, and which elements carry it>
STATES      <teal/live: … · dashed/retired: … · red/fail: … or "none">
LABELS      <node titles + the 1–2 captions, verbatim>
NARRATION   <the aria-label paragraph>
CAPTION     <the figcaption line, "fig. …">
```
