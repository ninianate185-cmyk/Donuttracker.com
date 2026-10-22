# Donuttracker.com

Donut SMP market tracker. Six views: overview, item catalog, flips (crafting, order and auction planners), spawner calculator, investments, and watchlist.

## Stack

React 19 + Vite + Tailwind CSS 4, with [shadcn/ui](https://ui.shadcn.com) primitives (`src/components/ui/`), animation by [motion](https://motion.dev), and two [Watermelon UI](https://ui.watermelon.sh) components (`continuous-tabs`, `pagination`) adapted to the theme. Install more from either registry with `npx shadcn@latest add <name>` or `npx shadcn@latest add @watermelon/<name>`.

The visual direction ("Night market") lives in the tokens at the top of `src/index.css`: warm charcoal, frosting-pink primary, ember amber, Pixelify Sans display headings over Geist and Geist Mono.

## Run

```bash
npm install
npm run dev        # http://127.0.0.1:4173 with hot reload
npm run build      # typecheck, build into dist/, then run the checks against it
npm run preview    # serve the built dist/
```

## Checks

`npm run check` (`node scripts/check.mjs`) verifies catalog integrity and provenance, missing-price handling, number formatting, recipe output quantities and quote grades, CSV import, spawner math, and that every item image exists. It imports the typed modules in `src/lib/` directly (Node 24 strips types). `npm run build` also runs it with `--dist` to check the built site.

## Data

- All 1,505 Minecraft Java 26.1 registry items (the registry's `air` entry is excluded), plus identified server items and source variants: 1,595 searchable entries total.
- 1,404 rounded public market quotes from https://donutsmpterminal.com/all_items, published October 21, 2026 at 17:49 UTC. This is a snapshot, not a live feed.
- 25 alternate displayed values from https://donut.auction retained separately with source links. Its transaction history may be stale or incomplete.
- Catalog and recipes: https://github.com/PrismarineJS/minecraft-data.
- No verified October transaction dataset is included. Missing monthly averages and missing prices remain unavailable; no fake history is generated.
- Import a CSV through Sources & coverage to calculate October volume-weighted sample means. Required columns: item,unitPrice,quantity,timestamp. Use timezone-qualified ISO dates. The imported sample does not establish complete server-wide coverage.
- Official API documentation: https://api.donutsmp.net. Authorized credentials must stay on a backend; no keys are included or harvested from other sites.

## Update the snapshot

Edit the attributed files in `data/`, then run `npm run catalog` (`python scripts/build-catalog.py`). It regenerates `src/data/catalog.json`. Item images live in `public/assets/`; refresh them with `python scripts/download-renders.py` (native renders) or `python scripts/download-icons.py` (fallback textures), then rebuild. Never fill missing observations with zero or generated estimates.

## Persistence and calculations

Watchlists, imported sales samples, trade plans and spawner inputs are stored in browser localStorage, under the same keys the previous version used, so existing saves carry over. No trades are executed. Recipe costs normalize ingredient cost by the recipe output count.

## Flips

Crafting flips hide recipes whose output or any ingredient quote is graded C or D by the source, since thin listings produce spreads of thousands of percent. The Quote grade filter widens this. Order flips plan a buy order against a selling target. Auction flips plan an auction-house listing against a resale target, with an optional user-entered selling fee.

## Spawner calculator

Skeleton, Zombie, Spider, Creeper, Pig, Cow, Blaze, Zombified Piglin, and Iron Golem spawners; types, drops and references are in `data/spawners.json`. Each type keeps its own count, hours, purchase price, drop rates and selling prices; Reset clears only the selected type.

Production rates are always user measured. Every included drop needs a rate and a price; a rate of zero excludes a drop, and missing observations never become zero. Payback needs positive income and a purchase price. No spawner purchase price is fabricated.

## Motion and accessibility

Motion is purposeful: sliding nav and tab pills, rolling page numbers, counting KPIs, spring tilt and click-for-embers on the spawner, row re-ordering, and sheet/dialog transitions. `MotionConfig reducedMotion="user"` plus CSS guards turn ambient motion off for reduced-motion users. Keyboard: `⌘K`/`Ctrl K` or `/` opens search, `C` toggles compare on Investments, arrow keys tilt the spawner.

## Hosting

`.openai/hosting.json` points the Sites deployment at `dist/`. The build uses relative URLs and hash routes, so `dist/` works on any static host. Commit `dist/` after `npm run build` if the host deploys straight from the repository. GitHub repository: https://github.com/ninianate185-cmyk/Donuttracker.com.
