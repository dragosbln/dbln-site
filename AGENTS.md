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

## Reveal: never swap a Reveal's className on a live instance

`Reveal` adds its `.in` class **imperatively** (`el.classList.add`), but React
owns `className`. So if React reuses a `Reveal` instance and its `className`
prop differs, React rewrites the attribute and silently wipes `.in` — and the
mount effect that would re-add it never re-runs (empty deps). The element
stays at `opacity: 0`: present in the DOM, correct styles, invisible.

This bites when two branches of a conditional render `Reveal` at the same
position with different classNames (React reconciles by type + position, so
it updates rather than remounts). Give each branch a distinct `key` (see
`BookingFlow`'s resting/confirmed fragments) so React mounts a fresh subtree.
Symptom to recognize: one Reveal lacks `in` while its siblings — whose
className props didn't change — still have it.

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
   inset frame, corner ticks, mono FIG label, ONE teal element). Then generate
   its raster twin for `og:image` (SVG isn't rendered by link scrapers):
   `npm run build && node scripts/render-cover-png.mts <slug>` — commit the
   resulting `public/blog/covers/<slug>.png` alongside the SVG.
4. Cross-link other articles with site-relative URLs (`/blog/<slug>`), never
   dev.to URLs — this site is the canonical home; dev.to cross-posts set
   `canonical_url` back to here.
5. Code blocks are highlighted at build by shiki using the `dbln-dark` theme
   defined in `src/lib/markdown.ts` (colors inlined at build, no client-side
   highlighting ever); the `.prose pre` container is styled in
   `src/styles/prose.css`.

## Contact booking (Cal.com)

The contact section (design: 3a in `../claude_websie/directions/brief.html`)
is a server shell (`Contact`) slotting the heading into one client leaf
(`BookingFlow`): format picker + optional note on the left, a paper card with
the Cal.com inline embed (`@calcom/embed-react`) on the right.

The Cal side is configuration the code depends on — breaking it fails
silently:
- Event: `dragosbln/30min` (30 min, Google Meet via the connected Google
  Calendar).
- Booking field on that event: select `format`, **optional + hidden**, with
  option values exactly `consultancy` / `hands-on` / `cto` / `not-sure`
  (mapped in `site.ts` `booking.formats[].value`). A required hidden field
  would deadlock the booking; the visitor answers on-site instead. The
  "What are you weighing?" question is a **visible** field inside Cal's own
  booking form, not asked on-site.

Interaction model (decided by Dragos, don't regress):
- **Click-to-load, and it is a privacy boundary — do not "optimize" it by
  preloading.** Nothing is requested from Cal until the visitor picks a
  format: no `embed.js`, no iframe, so scrolling past the section contacts
  no third party and stores nothing on the device. The pick is the visitor's
  explicit request for the booking service, which is what keeps this
  defensible under ePrivacy without a consent banner (the site's only
  analytics is Plausible — cookieless, nothing stored on the device, see
  "Analytics" below — and the site sets no first-party cookies; keep both
  true, or this calculus changes). The veil names Cal.com so the choice is
  informed.
- The booker renders veiled (blurred overlay + `inert`) until a format is
  picked; the veil pill asks for one. Picking the first format boots Cal and
  mounts the iframe with the prefill.
- The boot is latched to run **once** (`booted` ref): `cal("on", …)` adds
  window listeners that are never removed, so re-running on a later pick
  would double-register the booking handlers and fire them twice per event.
  Unpicking unmounts the iframe but leaves the boot latched, so re-picking
  is instant.
- Switching (or deselecting) the format after the visitor has clicked into
  the booker opens a native `<dialog>` confirming the restart — the remount
  throws away anything entered in Cal's form. A click inside the
  cross-origin iframe is detected as the parent window's `blur` with
  `document.activeElement` inside the embed wrapper.
- No "book directly on Cal.com" link-out; the email link is the fallback
  path.
- Reschedule/Cancel reset the whole flow back to its resting state (veiled
  picker, fresh embed, cleared storage) on click. Those flows happen in Cal's
  own tab and fire no embed events here, so a cancelled booking would
  otherwise leave a permanently false acknowledgement behind. Resetting
  unmounts the link mid-click, which is safe: per HTML, a disconnected `<a>`
  still navigates (the connectedness check in "cannot navigate" excludes
  `a` elements) — verified in-browser, don't "fix" it with a setTimeout.
- After a booking lands (design 5a): the left column swaps to the
  acknowledgement (`booking.confirmed` in `site.ts`, heading slotted from
  `Contact` like the resting one) and the card swaps to a **site-rendered
  scheduled card** — the iframe unmounts entirely. Cal's own success screen
  brings gutters, an inner scroll and a signup banner that cannot be styled
  from outside, so we render the details ourselves and keep Cal
  authoritative through links: `cal.com/reschedule/<uid>` and
  `cal.com/booking/<uid>?cancel=true` (both also live in the invite email).
- Confirmed-state data merges from both events, either order:
  `bookingSuccessfulV2` (documented) carries uid + start/end; the deprecated
  v1 `bookingSuccessful` carries the booking object. Real payloads are
  messier than the types: response values can be strings, `{value,label}`
  (selects) or `{firstName,lastName}` (name); notes may live in
  `responses.notes` OR `booking.description`; the attendee in
  `responses.name` OR `attendees[0].name`; times on the booking object OR
  derived from the event root's `date`+`duration`. `asString`/
  `extractBooking` in BookingFlow normalize all of these — extend them,
  don't bypass them. The Focus echo falls back through Cal's record →
  picker ref → `sessionStorage["dbln:booking-format"]` (written on every
  pick, so it survives client-side navigation between pages). Both handlers
  `console.debug("[dbln booking]", …)` the raw payload on purpose — a real
  booking is diagnosable from the visitor console when Cal's shape drifts
  again. Rows render only when their data arrived. State is per-session;
  reload resets. To test without a real booking, dispatch the namespaced
  CustomEvent (`CAL:booking:bookingSuccessfulV2` / `…:bookingSuccessful`)
  on `window` — that is exactly how embed-core delivers them. Pick a format
  first, or the handlers aren't registered yet and the events go nowhere.

Embed facts learned from the package source (do not "simplify" these away):
- The embed reads `config` once at iframe creation and ignores prop changes,
  so a format change remounts `<Cal>` via `key`.
- `cal("ui", …)` (cssVarsPerTheme, hideEventTypeDetails) is a one-shot
  postMessage, lost on remount — `BookingFlow` re-applies it on every
  `linkReady` event.
- Theming is **colors only** (`cssVarsPerTheme`); the booker's fonts are
  Cal's and will not match the site. The card header (event title, meta,
  format chip) is site-authored because `hideEventTypeDetails` removes
  Cal's own.
- A skeleton holds the card's min-height while the picked booker loads, so
  the card never collapses or shifts. (The old IntersectionObserver lazy
  mount was removed when click-to-load landed: a pick already implies the
  section is on screen, so the observer was dead weight.)

## Analytics (Plausible)

Traffic stats come from Plausible Cloud (EU-hosted) via the official
`@plausible-analytics/tracker` npm package — no snippet, no cookies, nothing
stored on the visitor's device. That last part is load-bearing: it is why
the Cal.com calculus above survives analytics being present. Never replace
this with a tool that sets cookies or touches device storage without adding
a consent banner first.

- `src/lib/analytics.ts` owns the integration: `initAnalytics()` (called
  once by the `Analytics` client leaf in the root layout) and
  `track(name, props)`, a safe no-op wherever the tracker didn't boot. The
  package reads `location` at module scope, so it is dynamic-imported at
  runtime — a static import crashes the prerender in `next build`.
- Hostname gate: the tracker boots on the canonical host (+ `www`) and on
  localhost, where it only logs "Ignoring Event" instead of sending
  (`captureOnLocalhost` stays false). Firebase preview channels
  (`*.web.app`) never boot it: preview traffic can't pollute the stats, and
  previews contact no third party.
- Pageviews (SPA navigations included), scroll depth, engagement time and
  outbound link clicks are automatic. Custom events: `Booking Format
  Picked` and `Booking Confirmed` (both carry a `format` prop) in
  `BookingFlow`; the confirmed one is latched per booking because Cal fires
  both the v1 and v2 success events for a single booking.
- Dashboard side: each custom event (plus `Outbound Link: Click`) needs a
  goal created once in Plausible under Site settings → Goals, or it won't
  surface there.
- Exclude your own visits with `localStorage.plausible_ignore = "true"` —
  the tracker ships in the site's own bundle, so an adblocker won't filter
  it for you.

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
