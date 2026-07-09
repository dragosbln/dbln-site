---
name: article-diagram
description: Create or animate a technical diagram for a blog article in the site's dg-* figure system (animated SVG, house style). Use when asked to add a diagram to an article, animate an existing diagram image, or convert a static figure into the animated system.
---

# Article diagram

Produces one animated SVG figure in the house system: the `dg-*` vocabulary
styled by `src/styles/diagram.css`, validated by `scripts/validate.mjs`,
reviewed live in a workbench page. The figure's motion encodes the article's
argument — never decoration.

**Read `references/grammar.md` first, every time.** Then open the exemplar in
`references/exemplars/` that matches the intended pattern and imitate its
conventions (geometry rhythm, label placement, overlay structure).

## Two entry modes

**Mode A — from an existing image** ("animate this diagram"):
transcribe first, animate second. Reproduce the image's content faithfully in
the vocabulary — same components, same topology, same labels; do NOT invent or
"improve" content. Checkpoint the static transcription with the user before
any motion: "does this match the original?"

**Mode B — from a description + the article** ("build the figure for section X"):
read the article section, draft the brief yourself (especially ARGUMENT and
THE MOTION), and show the brief for approval before drawing. The most
expensive failure is a beautiful diagram of the wrong idea; the brief is where
that gets caught for the price of a paragraph.

## Procedure

1. **Brief.** Fill the template from `grammar.md`. Mode B: show it and wait
   for approval. Mode A: show it alongside your reading of the image.
2. **Static figure.** Build the SVG with no motion classes: vocabulary
   elements only, stable ids on nodes/edges (`n1…`, `e1…`), title/desc/
   aria-label, marker defs namespaced. Render the workbench (step 4) and let
   the user react. Iterate here until the static frame is right — motion never
   fixes a bad composition.
3. **Motion.** Add the one animated idea from the brief (overlay groups or
   motion classes per `grammar.md`). Update the aria-label to narrate the
   motion.
4. **Workbench.** After every iteration run:
   `node .claude/skills/article-diagram/scripts/workbench.mjs <svg-path>`
   It writes `diagram-workbench.html` (gitignored) at the repo root showing
   the figure at full width, at 360px, and with motion disabled (the
   reduced-motion state), plus an id-badge toggle. The user reviews it in the
   preview panel and gives feedback by badge id ("move n3 down", "e2 should be
   the flow").
5. **Validate.**
   `node .claude/skills/article-diagram/scripts/validate.mjs <svg-path>`
   must pass before delivery. Fix errors; treat warnings as questions for the
   user, not noise.
6. **Deliver.** Place the file at `public/blog/<article-slug>/<figure-name>.svg`
   and reference it from the article markdown as an image whose ALT TEXT is
   the figcaption line:
   `![fig. tokens moved from JS-readable cookies to httpOnly.](/blog/<slug>/<figure>.svg)`
   At build, `src/lib/rehypeInlineSvg.ts` inlines the SVG into the page as a
   `<figure class="dg-figure">` with that alt as the visible figcaption, so
   the dg-* classes (loaded globally from `src/styles/diagram.css`) style and
   animate it. Verify on the built article page, not just the workbench.

## Working files

Keep in-progress SVGs in the session scratchpad, not the repo; only the
delivered figure enters `public/blog/`.

## Judgment calls to escalate, not decide

- Which moment of the section IS the figure (when the brief feels ambiguous).
- Whether an image should stay an image: screenshots are evidence and real
  sketches are artifacts — neither should be redrawn into the system.
- Any urge to use a second teal or second red idea. The answer is almost
  always to cut, but the user decides.
- Portrait canvas. Landscape is the default; choosing portrait is a
  composition call — name the reason in the brief and let the user confirm.
