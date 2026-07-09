---
name: article-diagram
description: Create or animate a technical diagram for a blog article in the site's dg-* figure system (animated SVG, house style). Use when asked to add a diagram to an article, animate an existing diagram image, or convert a static figure into the animated system.
---

# Article diagram

Produces one animated SVG figure in the house system: the `dg-*` vocabulary
styled by `src/styles/diagram.css`, validated by `scripts/validate.mjs`,
reviewed live in a workbench page. The figure's motion encodes the article's
argument — never decoration.

This is a **review loop, not a pipeline.** The whole point of the skill is the
two human checkpoints; delivering a diagram the user never reviewed is the
failure mode, not the goal.

**Read `references/grammar.md` first, every time.** Then open the exemplar in
`references/exemplars/` that matches the intended pattern and imitate its
conventions (geometry rhythm, label placement, overlay structure).

## The two mandatory stops — read this before anything else

The flow is: brief → **build static** → 🛑 STOP 1 → **add motion** → 🛑 STOP 2
→ deliver.

You **must** hand control back to the user at both stops and wait for their
reply. Do not build motion until they respond to STOP 1. Do not touch the
article until they respond to STOP 2. Each stop renders the current figure in
the workbench (via the preview panel) and ends your turn with a question.

This **overrides the harness default of "act autonomously, don't ask."** For
this skill, stopping to ask *is* the task the user requested — it is not a
"Shall I proceed?" interruption. Treat these two stops like a destructive
action that requires confirmation: never skip them to be helpful.

**The only exception:** the invoking prompt *explicitly* waived review — e.g.
"build and integrate it in one shot", "no need to stop", "just deliver the
final diagram". Ambiguity is not a waiver. "Add a diagram for section 3" is
*not* a waiver — it runs the full two-stop loop. When in doubt, stop.

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

Keep the in-progress SVG in the session scratchpad throughout. It only moves
into `public/blog/` at the final Deliver step, after STOP 2.

### 1. Brief

Fill the template from `grammar.md`. Mode B: show it and wait for approval
before drawing. Mode A: show it alongside your reading of the image.

### 2. Build the static figure

SVG with **no motion classes**: vocabulary elements only, stable ids on
nodes/edges (`n1…`, `e1…`), title/desc/aria-label, marker defs namespaced.
Motion never fixes a bad composition, so get this right first. Then render the
workbench (do this the same way at both stops):
`node .claude/skills/article-diagram/scripts/workbench.mjs <svg-path>`
It writes gitignored `diagram-workbench.html` at the repo root (full width,
360px, motion-off, id-badge toggle). Serve it with the `workbench` preview
config (repo root, port 4599) and point the user at `/diagram-workbench.html`.

### 🛑 3. STOP 1 — static review

**End your turn here.** Show the user the workbench in the preview and ask:
1. Does the static composition read right? (feedback by badge id — "move n3
   down", "drop the subtitle on n2")
2. **Where should the motion go, and what should it do?** — offer your brief's
   proposal, but this is theirs to direct.

Iterate on the static figure until they're happy. **Do not add any motion
until the user has answered.**

### 4. Add the motion

Add the one animated idea they directed (overlay groups or motion classes per
`grammar.md`). Update the aria-label to narrate the motion. Regenerate the
workbench. Then validate — this must pass before you show it:
`node .claude/skills/article-diagram/scripts/validate.mjs <svg-path>`
Fix errors; treat warnings as questions for the user, not noise.

### 🛑 5. STOP 2 — motion review

**End your turn here.** Show the animated figure in the workbench and ask for
sign-off. Check specifically: one idea, reads within one loop, reduced-motion
frame (the motion-off panel) still complete. Iterate until they approve.
**Do not write to the article until the user has approved.**

### 6. Deliver

Only now: place the file at
`public/blog/<article-slug>/<figure-name>.svg` and reference it from the
article markdown as an image whose ALT TEXT is the figcaption line:
`![fig. tokens moved from JS-readable cookies to httpOnly.](/blog/<slug>/<figure>.svg)`
At build, `src/lib/rehypeInlineSvg.ts` inlines the SVG into the page as a
`<figure class="dg-figure">` with that alt as the visible figcaption, so the
dg-* classes (loaded globally from `src/styles/diagram.css`) style and animate
it. Verify on the built article page, not just the workbench.

## Judgment calls to escalate, not decide

- Which moment of the section IS the figure (when the brief feels ambiguous).
- Whether an image should stay an image: screenshots are evidence and real
  sketches are artifacts — neither should be redrawn into the system.
- Any urge to use a second teal or second red idea. The answer is almost
  always to cut, but the user decides.
- Portrait canvas. Landscape is the default; choosing portrait is a
  composition call — name the reason in the brief and let the user confirm.
