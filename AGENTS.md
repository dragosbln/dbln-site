<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

- **Static export.** `next.config.ts` sets `output: "export"`. Nothing may rely on a server at runtime: no dynamic route handlers, no `cookies()`/`headers()`, no middleware. Route handlers must be `force-static` GET.
- **Components.** One folder per component: `src/components/<Name>/` containing `<Name>.tsx`, `<Name>.module.css` (if styled), and an `index.ts` barrel (`export { default } from "./<Name>";`). Import other components via `@/components/<Name>`; import a component's own CSS relatively (`./<Name>.module.css`).
- **Styling.** CSS Modules only — no inline `style={{}}`, no styled-jsx, no Tailwind. `src/app/globals.css` holds only design tokens, the reset, and the `.wrap` / `.section` / `.reveal` utilities. Everything else lives in the owning component's module.
- **Content.** All copy, links, and identity data live in `src/content/site.ts`. Components render content; they don't contain it.
- **Server-first.** Components are React Server Components by default. Add `"use client"` only at interactive leaves (e.g. scroll reveal), never on whole sections.
- **SEO surfaces.** When adding a route, update `src/app/sitemap.ts` and the Pages list in `src/app/llms.txt/route.ts`, and give the page its own `metadata` export with a canonical. Keep JSON-LD in `src/lib/schema.ts` in sync with content changes.
- **Copy voice.** Outward-facing copy is written by Dragos's rules: short declarative sentences, no em-dash asides, no "not X but Y" constructions, no overexplaining. Never invent or rewrite copy on your own — take it verbatim from `src/content/` or from the prototypes in `../claude_websie/`. Real testimonial quotes are verbatim, always.

# Recipes

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

## Adding a page (`/work`, `/blog`, …)

1. Content: a new typed file in `src/content/` (e.g. `posts.ts`). The blog
   article sources live in `../claude_websie/blog/posts/*.md` with manifest
   `posts.js`; the case-study content in `../claude_websie/work/`.
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
6. Resolve the `TODO(blog)` markers in `src/content/site.ts` and
   `src/components/Writing/Writing.tsx` — they link the landing page to the
   new routes. (`/work` is done; use it as the reference: PageHero + CaseNav +
   CaseArticle + Contact-with-content, diagrams in the CaseDiagram registry.)

## Future chatbot ("Ask Dragos")

Static export means no API routes in this repo. The chatbot UI is a client
component (an interactive leaf — do not convert pages or sections to client
components for it) calling an external HTTPS endpoint (e.g. Cloud Run /
Cloud Functions). Prototype: `../claude_websie/assistant/assistant.js`.
