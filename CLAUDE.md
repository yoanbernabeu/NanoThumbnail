# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NanoThumbnail is a free, open-source, local-first studio to generate, edit and test YouTube thumbnails with Google's Nano Banana models (Pro / 2), BYOK via Replicate or Google Gemini.

**Stack**: Astro 7 (static), React 19 island for `/app`, shadcn/ui + Radix + Tailwind v4, Zustand, IndexedDB (`idb`), Vitest. Deployed on Netlify.

## Commands

```bash
npm run dev        # http://localhost:4321 (Gemini works; Replicate needs `netlify dev` for the proxy)
npm run build      # → dist/
npm test           # Vitest
npm run typecheck  # tsc --noEmit (src + netlify)
npm run check      # typecheck + test + build (CI)
```

## Architecture

- `src/app/` — the studio, a single React island (`<App client:only="react" />` in `src/pages/app.astro`).
  - `stores/workspace.ts` — core state & actions: projects, generations (with `parentId` lineage), jobs (abortable), brief, refs, personas, brand kit, edit/region-edit, score/rank.
  - `stores/settings.ts` — provider, keys (localStorage or sessionStorage), output params, theme, lang. Keys: `nt_prefs`, `nt_key_<provider>`, `nano_lang`.
  - `lib/providers.ts` — Replicate (via proxy, `Prefer: wait`, backoff polling, cancel on abort) and Gemini (direct, `x-goog-api-key`). `generateImage`, `generateText`, `generateJSON`.
  - `lib/prompt.ts` — prompt builder following Google's Nano Banana guidance (declared image roles, identity lock, "change only X" edits). Covered by tests.
  - `lib/ai.ts` — critique, ranking, concepts, channel style analysis (Gemini 3 Flash).
  - `lib/images.ts` — canvas helpers: reference downscaling, YouTube export (1280×720 ≤ 2 MB), mask highlight/merge for region edits.
  - `lib/db.ts` — IndexedDB `NanoThumbnail` (stores Blobs). `lib/migrate.ts` imports v1 data (`NanoThumbnailDB`) once.
  - `lib/styles.ts` — 14 style presets.
  - `i18n/` — typed dictionaries; `useT()` in components, `t()` elsewhere. `fr.ts` must satisfy the `en.ts` shape.
  - `components/ui/` — shadcn components (generated; `cn` comes from `@/app/lib/utils`).
- `src/components/site/Landing.astro` + `src/site/i18n.ts` — static landing, pre-rendered in fr (`/`) and en (`/en/`), no client JS. Images live in `src/assets/` and go through `<Image>` (responsive srcset). The style gallery (`src/assets/gallery/`) holds one thumbnail per preset in `lib/styles.ts`, generated in the studio: `<id>.webp` (FR or language-neutral text) and `<id>-en.webp` when the text differs in English. Styles: `src/styles/site.css` (scans only the site, inlined) vs `tailwind.css` (studio); shared tokens in `tokens.css`.
- SEO/GEO: `SiteLayout.astro` (Open Graph per language `public/og-{fr,en}.jpg`, hreflang, JSON-LD WebApplication + FAQPage), `src/pages/sitemap.xml.ts`, `src/pages/llms.txt.ts` and `llms-full.txt.ts` (generated from `src/site/i18n.ts` via `src/site/llms.ts`), `public/robots.txt` (AI crawlers allowed). Landing currently scores 100/100/100/100 on Lighthouse (mobile and desktop).
- `netlify/functions/replicate-proxy.ts` — relays only create/poll/cancel Replicate routes, only for the site origin (`netlify/lib/origin.ts`). Tested.
- `public/sw.js` — service worker (network-first pages, cache-first hashed assets). Bump `VERSION` when changing its logic.

## Conventions

- Adding UI text: add the key to both `src/app/i18n/en.ts` and `fr.ts` (typecheck enforces parity).
- New shadcn components: `npx shadcn@latest add <name>`; check the import of `cn` afterwards, and note that a stale `deno.lock` in the repo makes the CLI try to use Deno.
- CSP is emitted by Astro (`security.csp` in `astro.config.mjs`). Any new external origin (image CDN, API) must be added to `img-src`/`connect-src` there.
- Don't put API keys in URLs; don't cache anything under `/.netlify/` in the service worker.
