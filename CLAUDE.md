# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check (tsc -b) then build to dist/
npm run preview   # Preview the production build locally
npm run deploy    # Build + restart Caddy container to serve updated dist/
```

No lint or test scripts are configured.

## Architecture

Single-page React app (no backend) that anonymizes/deanonymizes text using user-defined word pair substitutions. Data is persisted in `localStorage` under the key `anonymizer_pairs`.

**State & routing** live entirely in `src/App.tsx` — it holds the `WordPair[]` array, syncs it to localStorage, and switches between three page components based on the active tab.

**Core logic** is in `src/utils/replacer.ts`. The `replace(text, pairs, reverse?)` function does a single-pass regex substitution, sorting pairs by source length descending to handle overlapping matches. Word boundaries use a custom pattern (`(?<![a-zA-Z0-9_$])...(?![a-zA-Z0-9_$])`) that also handles PHP `$variable` syntax.

**Pages** (`src/pages/`):
- `AnonymizePage` / `DeanonymizePage` — textarea → button → output with clipboard copy; differ only in the `reverse` flag passed to `replace()`
- `WordListPage` — CRUD for word pairs with JSON export/import (import merges, skipping duplicates)

All styling is in `src/App.css` using CSS custom properties (dark theme, GitHub-inspired).

## Deployment

Built files go to `dist/`, which is bind-mounted into the Caddy container at `/srv/anonymizer` (configured in `/home/www/docker-gfcj/docker-compose.yml`). `npm run deploy` handles build + container restart. If the Caddy container was recreated, the mount must exist first (`docker compose up -d --no-deps caddy`).
