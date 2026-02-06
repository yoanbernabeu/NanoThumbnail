# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NanoThumbnail is a free, open-source web application for creating YouTube thumbnails using AI. It uses Google's Nano Banana Pro model via Replicate API with a BYOK (Bring Your Own Key) model - users provide their own API key.

**Stack**: Astro 5.0 (static site generation), TypeScript 5.3, deployed on Netlify.

## Development Commands

```bash
npm run dev      # Start dev server on http://localhost:4321
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Architecture

### Key Directories

- `src/components/app/` - Main application UI (Sidebar, MainArea, HistoryPanel, ReferenceLibraryPanel, SettingsModal)
- `src/components/landing/` - Landing page sections (Hero, Features, Pricing, FAQ, etc.)
- `src/scripts/` - Client-side TypeScript logic
- `src/pages/` - Astro pages (index.astro = landing, app.astro = main app)

### Core Scripts (`src/scripts/`)

| File | Purpose |
|------|---------|
| `api.ts` | Replicate API integration, polling logic, generation flow |
| `state.ts` | State interfaces (AppState, HistoryItem, GenerationParameters) |
| `storage.ts` | IndexedDB wrapper for local image persistence |
| `ui.ts` | DOM manipulation, panel management, event handlers (729 lines) |
| `i18n/index.ts` | i18n system with auto-detection and language switching |

### API Integration Flow

1. User provides Replicate API key (stored in localStorage as `nano_api_key`)
2. Generation request goes through CORS proxy (`corsproxy.io`) to Replicate
3. Polling loop checks prediction status every 1 second until complete
4. Results stored in history (localStorage + optional IndexedDB for images)

### State & Storage

- **localStorage keys**: `nano_api_key`, `nano_lang`, `nano_save_locally`, `nano_history`
- **IndexedDB**: `NanoThumbnailDB` database, `images` store (when "Save Locally" enabled)

### Internationalization

- Supported: English (en), French (fr)
- Translation files: `src/scripts/i18n/en.ts`, `src/scripts/i18n/fr.ts`
- Usage: `t('app.status_working')` or `data-i18n` attribute on DOM elements
- Detection priority: URL param → localStorage → browser lang → default (en)

To add a new language: create `src/scripts/i18n/{lang}.ts`, import in `index.ts`, add to supported languages array.

### Path Aliases (tsconfig.json)

```
@/* → src/*
@components/* → src/components/*
@scripts/* → src/scripts/*
```

## Important Patterns

- **No backend**: All API calls are client-side through CORS proxy
- **Glassmorphism UI**: CSS variables defined in `src/styles/global.css`
- **Error handling**: Custom modal with JSON syntax highlighting via PrismJS
- **Landing pages**: Pure Astro components (no client-side JS)
- **App page**: Astro + client-side TypeScript for interactivity

## Deployment

- **Platform**: Netlify
- **Config**: `netlify.toml` (Node.js v20, aggressive caching for static assets)
- **Base path**: `/` for Netlify, `/NanoThumbnail/` for GitHub Pages (configurable in `astro.config.mjs`)
