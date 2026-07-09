---
name: article-diagram
description: Create or animate a technical diagram for a blog article in the site's dg-* figure system (animated SVG, house style). Use when asked to add a diagram to an article, animate an existing diagram image, or convert a static figure into the animated system.
---

# Article diagram

One animated SVG figure in the house `dg-*` system (styled by
`src/styles/diagram.css`, validated by `scripts/validate.mjs`). Motion encodes
the argument, never decoration.

**Read `references/grammar.md` first, every time**, then imitate the closest
file in `references/exemplars/`.

**Be terse.** At each stop, show the figure and ask only the essential
question(s) — a sentence or two, not a recap of the plan.

## Two mandatory stops (non-negotiable)

Flow: brief → build static → 🛑 STOP 1 → add motion → 🛑 STOP 2 → deliver.

Hand control back and wait for a reply at both stops. No motion before STOP 1
is answered; no article edit before STOP 2 is answered. This overrides the
"act autonomously, don't ask" default — here, stopping *is* the task the user
asked for; treat it like a destructive-action confirmation.

Skip a stop only if the prompt explicitly waived review ("build it in one
shot", "no need to stop"). Ambiguity is not a waiver; when in doubt, stop.

## Modes

- **A — animate an image**: transcribe faithfully first (same components,
  topology, labels — invent nothing), confirm the match, then animate.
- **B — build from the article**: draft the brief (esp. ARGUMENT + THE MOTION)
  from the section and get it approved before drawing. A beautiful diagram of
  the wrong idea is the expensive failure.

## Procedure

Work on the SVG in the scratchpad; it enters `public/blog/` only at Deliver.

**1. Brief** — fill the `grammar.md` template; show it and wait (B), or show it
with your reading of the image (A).

**2. Static figure** — no motion classes; vocabulary only, stable ids (`n1`,
`e1`…), title/desc/aria-label, namespaced markers. Get composition right before
any motion. Open the workbench (see below).

**🛑 3. STOP 1** — end your turn. Ask: (1) does the composition read right?
(feedback by badge id), (2) where does the motion go, what does it do? Iterate
the static figure; add no motion until answered.

**4. Motion** — add the one directed idea; update the aria-label to narrate it;
regenerate the workbench; run `validate.mjs <svg>` (must pass — fix errors,
raise warnings as questions).

**🛑 5. STOP 2** — end your turn. Show it, get sign-off. Confirm: one idea,
readable in one loop, motion-off panel still complete. No article edit until
approved.

**6. Deliver** — move to `public/blog/<slug>/<figure>.svg`; reference it as
`![<figcaption>](/blog/<slug>/<figure>.svg)` (alt = caption; `rehypeInlineSvg`
inlines and styles it at build). Verify on the built page.

### Opening the workbench (both stops)

```
node .claude/skills/article-diagram/scripts/workbench.mjs <svg-path>
```

Writes gitignored `diagram-workbench.html` at the repo root (full width, 360px,
motion-off, id-badge toggle). **Open it in the preview panel, not as a link:**
`preview_start` the `workbench` config, then navigate the preview to
`/diagram-workbench.html` (reload it at STOP 2 — the file is regenerated in
place). Never hand the user a localhost URL to open themselves.

## Escalate, don't decide

- Which moment IS the figure (ambiguous brief).
- Image vs. figure: screenshots (evidence) and real sketches (artifacts) stay
  images.
- A second teal or second red idea — usually cut, but the user calls it.
- Portrait canvas — landscape is default; justify portrait in the brief.
