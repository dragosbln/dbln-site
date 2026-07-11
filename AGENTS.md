<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

- **Static export.** `next.config.ts` sets `output: "export"`. Nothing may rely on a server at runtime: no dynamic route handlers, no `cookies()`/`headers()`, no middleware. Route handlers must be `force-static` GET.
- **Components.** One folder per component: `src/components/<Name>/` containing `<Name>.tsx`, `<Name>.module.css` (if styled), and an `index.ts` barrel (`export { default } from "./<Name>";`). Import other components via `@/components/<Name>`; import a component's own CSS relatively (`./<Name>.module.css`).
- **Styling.** CSS Modules only — no inline `style={{}}`, no styled-jsx, no Tailwind. `src/app/globals.css` holds only design tokens, the reset, and the `.wrap` / `.section` / `.reveal` utilities. Everything else lives in the owning component's module. Two exceptions, both global because the markup is generated from markdown at build and can't carry hashed module classes: `src/styles/prose.css` (`.prose`, plus the `.prose--peek` compact variant) and `src/styles/diagram.css` (`dg-*`).
- **Content.** All copy, links, and identity data live in `src/content/site.ts`. Components render content; they don't contain it.
- **Server-first.** Components are React Server Components by default. Add `"use client"` only at interactive leaves (e.g. scroll reveal), never on whole sections.
- **SEO surfaces.** When adding a route, update `src/app/sitemap.ts` and the Pages list in `src/app/llms.txt/route.ts`, and give the page its own `metadata` export with a canonical. Keep JSON-LD in `src/lib/schema.ts` in sync with content changes.
- **Copy voice.** Outward-facing copy is written by Dragos's rules: short declarative sentences, no em-dash asides, no "not X but Y" constructions, no overexplaining. Never invent or rewrite copy on your own — take it verbatim from `src/content/` or from the prototypes in `../claude_websie/`. Real testimonial quotes are verbatim, always.

# Recipes

## Article diagrams (animated figures)

Never draw article diagrams freehand — use the `article-diagram` skill
(`.claude/skills/article-diagram/`). It carries the dg-* grammar
(`src/styles/diagram.css` + `references/grammar.md`), six canonical exemplars,
a validator and a live workbench. Brief → static → motion → validate, with a
user checkpoint at each stage.

Follow these exactly — they encode decisions already made. The reference
implementation for all of them is the landing page.

## Adding a section to a page

1. Add the copy to `src/content/site.ts`, typed with a shape from
   `src/content/types.ts` (extend `types.ts` if needed). No copy in components.
2. Create `src/components/<Name>/` with `<Name>.tsx`, `<Name>.module.css`,
   `index.ts` barrel.
3. The component is a server component. It imports its own content directly
   from `@/content/site`. Markup pattern (see `Work/Work.tsx`):
   `<section id="…" className="section" aria-labelledby="<id>-title">` →
   `<div className="wrap">` → `<SectionHead num title id aside>` → content.
4. Wrap each animated block in `<Reveal>` (`as="li"` inside lists to keep
   semantics). Inline stat/em emphasis in content strings renders via
   `richText()` from `@/lib/richText`.
5. Compose the section in the page's `<main>`.

## Adding a page

1. Content: a new typed file in `src/content/`.
2. Route: `src/app/<route>/page.tsx` exporting `metadata` with `title`,
   `description`, and `alternates.canonical`. For per-slug pages use
   `generateStaticParams` (static export requires it).
3. The page renders `<main id="main">` (skip-link target). Header/Footer come
   from the root layout — never re-add them.
4. Register the route in `src/app/sitemap.ts` and in the Pages list of
   `src/app/llms.txt/route.ts`.
5. Structured data: add the matching schema.org object (e.g. `Article`,
   `BreadcrumbList`) in `src/lib/schema.ts`, rendered with `<JsonLd>` from
   that page.
6. References: `/work` (PageHero + CaseNav + CaseArticle + Contact-with-content,
   diagrams in the CaseDiagram registry) and `/blog` (posts pipeline below).

## Publishing an article

Articles are markdown files in `src/content/posts/<slug>.md` with frontmatter
(`title`, `date`, `tags`, `excerpt`, `cover`, `coverAlt`, optional `devto`).
Everything downstream is automatic — the pages, the landing Writing cards,
`sitemap.ts`, `llms.txt`, `/feed.xml`, and the raw-markdown twin at
`/blog/<slug>.md` (copied to `public/blog/` by `scripts/export-post-markdown.mjs`
via the predev/prebuild hooks). Read time is computed from word count.

To publish:
1. Drop the `.md` in `src/content/posts/`. Body is pure markdown, no h1 —
   the frontmatter `title` renders as the page h1; sections start at `##`.
   The filename is the slug: phrase it as the search query the article
   answers (`software-architecture-in-unpredictable-projects`), never as the
   title's wordplay (`sketching-out-the-extremes`). Keep slug, image folder
   and cover filename identical.
2. Put article images in `public/blog/<slug>/` and reference them with
   absolute paths (`/blog/<slug>/name.png`). Never hotlink external hosts.
3. Create a cover at `public/blog/covers/<slug>.svg` following the cover-art
   system in `../claude_websie/blog-social/style-deck/` (1200×630, paper grid,
   inset frame, corner ticks, mono FIG label, ONE teal element).
4. Cross-link other articles with site-relative URLs (`/blog/<slug>`), never
   dev.to URLs — this site is the canonical home; dev.to cross-posts set
   `canonical_url` back to here.
5. Code blocks are highlighted at build (shiki, css-variables theme mapped in
   `ArticleView.module.css`) — no client-side highlighting, ever.

## Heading anchors (copy deep link)

Every article heading gets a hover "copy link" button — `HeadingAnchors`
(portals a `HeadingLink` into each `.prose h2/h3/h4[id]`; ids come from
rehypeSlug at build, so deep links work with no JS). Copies the clean URL
(strips a preview-only `.html`) and updates the address bar via
`history.replaceState` (no scroll). Shared primitives: `useCopyToClipboard`
hook + `LinkIcon`/`CheckIcon` — reused by the peek's "copy link to this
section" button. Styles are global in `prose.css` (injected into prose).

## Article cross-reference peeks

Internal prose links (`/blog/<slug>` ± `#fragment`) show a hover popover with
the referenced part of the target article — `src/components/ArticlePeek`.
Rules if you touch it:
- Progressive enhancement: the links stay real `<a href>`; **click always
  navigates**. Hover (400ms intent) or keyboard focus opens the peek; the
  pointer may cross into the panel (300ms grace). Not wired on touch
  (`hover: none`) — links just navigate.
- Content comes from fetching the target's own prerendered page and slicing it
  (anchored heading + its section, or the intro when there's no fragment).
  Never build a parallel excerpt store: the built HTML is the source of truth,
  so a peek can't drift from the article.
- The excerpt ends in an ellipsis when the article continues past it, and the
  panel's footer CTA ("Read the full article") opens the full piece in a new
  tab — one action, not duplicated in the header.
- Cloned fragments are sanitized: ids stripped (SVG ids suffixed via
  `src/lib/svgIds.ts`), `.dg-expand` removed, inner links forced to a new tab.

## Future chatbot ("Ask Dragos")

Static export means no API routes in this repo. The chatbot UI is a client
component (an interactive leaf — do not convert pages or sections to client
components for it) calling an external HTTPS endpoint (e.g. Cloud Run /
Cloud Functions). Prototype: `../claude_websie/assistant/assistant.js`.
