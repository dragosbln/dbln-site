# dbln-site

Personal site of Dragos Bilaniuc. Next.js (App Router, static export) deployed to Firebase Hosting.

## Stack

- **Next.js 16** with `output: "export"` — the whole site is prerendered to static HTML at build time; no server, no Cloud Functions.
- **TypeScript**, strict.
- **CSS Modules** per component, design tokens in `src/app/globals.css`.
- **Fonts** self-hosted via `next/font/google` (Newsreader, Hanken Grotesk, Spline Sans Mono).
- **Firebase Hosting**, project `dbln-b56ec`, serving `out/`.
- **Plausible** (cloud) for analytics — cookieless, loaded via the official
  npm tracker; boots only on the canonical host and stays off preview
  channels (see AGENTS.md, "Analytics").

## Development

```bash
npm install
npm run dev      # dev server on http://localhost:3000
npm run lint
npm run build    # static export into out/
```

Preview the production build locally:

```bash
npx serve out
```

## Deployment

GitHub Actions handles both channels:

- **Push to `main`** → build + deploy to the live channel (`.github/workflows/deploy-live.yml`).
- **Pull request** → build + deploy to a temporary preview channel, URL commented on the PR (`.github/workflows/deploy-preview.yml`).

Both need the repo secret `FIREBASE_SERVICE_ACCOUNT_DBLN_B56EC` (a Firebase service-account JSON with Hosting deploy rights; generate via `firebase init hosting:github` or the Firebase console).

Manual deploy, if ever needed:

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## SEO / machine-readable surfaces

Generated from `src/content/site.ts` so they never drift from page content:

- `src/app/robots.ts` → `/robots.txt` (explicitly allows AI/answer-engine crawlers)
- `src/app/sitemap.ts` → `/sitemap.xml`
- `src/app/llms.txt/route.ts` → `/llms.txt` ([llmstxt.org](https://llmstxt.org)) — curated site summary for LLM agents
- `src/lib/schema.ts` → JSON-LD (`Person`, `WebSite`) injected in the root layout

## Structure

```
src/
  app/          # routes, layout, global styles, metadata routes
  components/   # one folder per component: <Name>.tsx + <Name>.module.css + index.ts
  content/      # site.ts — single source of truth for copy and identity
  lib/          # schema.ts and other helpers
```
