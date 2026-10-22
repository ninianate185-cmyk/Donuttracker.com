# Donuttracker.com

Donut Tracker market prototype.

Desktop-first, buildless Donut SMP market prototype. Six views: overview, item catalog, crafting and manual flip plans, spawner calculator, investments, and watchlist.

## Run

Serve `dist/` with `python3 -m http.server 4173 --directory dist`, then open http://127.0.0.1:4173.

## Checks

Run `node scripts/check.mjs` to verify catalog integrity, source coverage, price handling, recipe output quantities, CSV parsing, and required assets.

After changing catalog or UI sources, run `python3 scripts/version-assets.py` before checks and deployment. It gives each release's JavaScript and CSS content-addressed filenames, preventing cached pages from mixing older stand-in artwork with a newer UI.

## Data

- All 1,506 Minecraft Java 26.1 registry entries, plus identified server items and source variants: 1,588 searchable entries total.
- 1,404 rounded public market quotes from https://donutsmpterminal.com/all_items, published October 21, 2026 at 17:49 UTC. This is a snapshot, not a live feed.
- 25 alternate displayed values from https://donut.auction retained separately with source links. Its transaction history may be stale or incomplete.
- Catalog and recipes: https://github.com/PrismarineJS/minecraft-data.
- No verified October transaction dataset is included. Missing monthly averages and missing prices remain unavailable; no fake history is generated.
- Import a CSV through Sources & coverage to calculate October volume-weighted sample means. Required columns: item,unitPrice,quantity,timestamp. Use timezone-qualified ISO dates. The imported sample does not establish complete server-wide coverage.
- Official API documentation: https://api.donutsmp.net. Authorized credentials must stay on a backend; no keys are included or harvested from other sites.

## Persistence and calculations

Watchlists, optional profile names, imported sales samples, and manual plans are stored in browser localStorage. No trades are executed. Recipe costs normalize the ingredient cost by the recipe output count. Spawner returns require the user’s measured rates and purchase price.

## Update the snapshot

Edit the attributed files in `data/`, then run `python3 scripts/build-catalog.py`. The tool regenerates `dist/catalog.js`. Download optional thumbnails using `python3 scripts/download-icons.py`, then rebuild. Never fill missing observations with zero or generated estimates.

## Item artwork and interactions

All 1,506 vanilla catalog items use locally hosted, native Minecraft inventory renders from https://github.com/Owen1212055/mc-assets. The pinned source commit and asset list are retained in `data/native-render-source.json`. Run `python3 scripts/download-renders.py` and rebuild the catalog to refresh them.

Investment cards respond to pointer position and include an item viewer with drag/arrow-key tilt, zoom, and reset controls. The skeleton spawner supports drag/arrow-key tilt, click/Enter ember bursts, ambient embers, pause/resume, and reset. Navigation, watchlist stars, buttons, and page changes include restrained motion. Reduced-motion preferences disable ambient motion and effects; deliberate viewer controls remain available. Visual motion never changes the market data.

The Investments page now choreographs Elytra, Dragon Head, and Piglin Head into their cards on entry, with a replay control. This sequence never runs in the overview. Comparison mode accepts 2–3 items, shows a removable selection dock, and opens a side-by-side table of sourced quotes, seven-day changes, monthly coverage, and stack sizes.

The interface includes more than two dozen interactions and motion details: investment arrivals and landing rings; replay feedback; pointer card tilt and lighting; floating item art and shadows; comparison selection and removal; an animated comparison dock; comparison artwork inspection; arrow-key card navigation; watchlist save flights and star bursts; item-to-drawer transitions; drag and arrow-key item tilt; slider and scroll zoom; viewer rotation and double-click reset; sliding navigation and category indicators; page transitions; filtered-row entrances and sorting movement; search focus feedback, staggered suggestions, keyboard suggestion navigation, and clear/Escape shortcuts; recipe ingredient drill-down; slider fills and thumb feedback; calculator output feedback; expanding assumptions; pagination feedback; button magnetism and ripples; toast timers; and the spawner controls described above. Press C on Investments to toggle comparison, or / to focus search.

## Hosting

`.openai/hosting.json` identifies the private Sites deployment. The static entry is `dist/index.html`; hash routes work on ordinary static hosting. GitHub repository: https://github.com/ninianate185-cmyk/Donuttracker.com.
