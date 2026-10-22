// Data + logic checks. `--dist` also checks a finished `vite build`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fmt, pct } from '../src/lib/format.ts';
import { craft, craftable, passesGrade } from '../src/lib/market.ts';
import { spawnerEstimate } from '../src/lib/spawner.ts';
import { parseCSV, aggregateSales } from '../src/lib/csv.ts';

const data = JSON.parse(fs.readFileSync('src/data/catalog.json', 'utf8'));
const byId = new Map(data.items.map((d) => [d.id, d]));

// Catalog integrity and provenance
assert.equal(data.meta.catalogCount, 1505, 'Java 26.1 registry minus Air');
assert(!byId.has('air'), 'Air is not a tradeable item');
assert.equal(data.items.length, byId.size, 'IDs must be unique');
assert.equal(data.items.filter((d) => Number.isFinite(d.price)).length, 1404);
assert(data.items.every((d) => d.price === null || d.price > 0));
assert(data.items.filter((d) => d.price !== null).every((d) => d.source && d.sourceTime), 'Every quote must retain provenance');
assert(data.items.every((d) => d.monthlyAverage === null), 'No monthly average can be invented from a current quote');
for (const d of data.items) if (d.icon) assert(fs.existsSync('public/assets/' + d.icon), `Missing icon: ${d.icon}`);
assert.equal(data.items.filter((d) => d.rendered).length, 1505, 'Every vanilla registry entry must have its native inventory render');
for (const id of ['dragon_head', 'piglin_head', 'player_head', 'zombie_head', 'creeper_head', 'skeleton_skull', 'wither_skeleton_skull', 'bone_block']) {
  const d = byId.get(id);
  assert.equal(d.icon, `renders/${id}.png`, 'Heads and Bone Block must use native inventory models');
  assert.equal(d.flat, false);
}
assert.equal(byId.get('elytra').flat, true);
assert(fs.existsSync('public/assets/spawner.png') && fs.existsSync('public/assets/renders/spawner.png'));

// Formatting
assert.equal(fmt(null), '—');
for (const [n, out] of [[0, '0'], [417, '417'], [46860, '46.9K'], [30500, '30.5K'], [48070000, '48.1M'], [8800000, '8.8M'], [999600, '1M'], [-1234, '-1.23K']]) assert.equal(fmt(n), out, `fmt(${n})`);
assert.equal(pct(157604.9), '157,605%');

// Recipes: yield normalization and quote grades
const rocket = craft(byId.get('firework_rocket'), data.recipes, byId);
assert(rocket && rocket.yield === 3, 'Rocket ingredients must be normalized by the three-item recipe yield');
assert(Math.abs(rocket.cost - rocket.lines.reduce((s, l) => s + l.count * l.price, 0) / rocket.yield) < 1e-8);
assert.equal(craft(byId.get('donut_skeleton_spawner'), data.recipes, byId), null);
const flips = craftable(data.items, data.recipes, byId);
const reliable = flips.filter((d) => passesGrade(d.recipe.grade, 'B'));
assert(reliable.length > 0 && reliable.every((d) => ['S', 'A', 'B'].includes(d.recipe.grade)), 'Default flips exclude C/D-grade quotes');
assert(!reliable.some((d) => d.id === 'waxed_exposed_copper_chest'));
assert(flips.length > reliable.length);

// CSV import
const parsed = parseCSV('item,unitPrice,quantity,timestamp\n"diamond",100,2,2026-10-10T12:00:00Z\n"stone",50,4,2026-10-11T12:00:00Z\nstone,10,1,2026-09-30T12:00:00Z');
assert.equal(parsed.length, 3); assert.equal(parsed[0].item, 'diamond'); assert.equal(parsed[1].quantity, '4');
const sales = aggregateSales(parsed, (raw) => byId.get(raw));
assert.equal(sales.invalid, 1, 'Sales outside Oct 1–21 are skipped');
assert.equal(sales.samples.diamond.average, 100);

// Spawners
assert.equal(data.spawners.types.length, 9);
const drops = (id) => data.spawners.types.find((t) => t.id === id).drops;
assert.deepEqual(drops('blaze'), ['blaze_powder']);
assert.deepEqual(drops('cow'), ['beef']);
assert.deepEqual(drops('zombified_piglin'), ['gold_nugget']);
assert.deepEqual(drops('skeleton'), ['bone', 'arrow']);
assert.deepEqual(drops('spider'), ['string', 'spider_eye']);
for (const t of data.spawners.types) {
  assert(byId.has(t.icon));
  for (const id of t.drops) assert(byId.has(id));
  assert(byId.get('donut_' + t.id + '_spawner')?.price === null);
}
const estimate = spawnerEstimate(10, 6, 1000000, [{ id: 'bone', rate: 100, price: 2 }, { id: 'arrow', rate: 50, price: 1 }]);
assert.equal(estimate.income, 15000); assert.equal(estimate.hourly, 2500); assert.equal(estimate.payback, 10000000 / 15000);
assert.equal(spawnerEstimate(10, 6, 1000000, [{ rate: 100, price: 2 }, { rate: '', price: 1 }]).income, null, 'Missing secondary rates must not become zero');
assert.equal(spawnerEstimate(10, 6, 1000000, [{ rate: 100, price: 2 }, { rate: 0, price: '' }]).income, 12000, 'Explicit zero rates exclude a drop');
assert.equal(spawnerEstimate(10, 6, '', [{ rate: 100, price: 2 }]).payback, null);
assert.equal(spawnerEstimate(10, 6, 1000000, [{ rate: 0, price: 2 }]).payback, null);
assert.equal(spawnerEstimate(1.5, 6, 1000000, [{ rate: 100, price: 2 }]).income, null);

// Built site
if (process.argv.includes('--dist')) {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  assert(!/src="\/|href="\/(?!\/)/.test(html), 'Built entry must use relative URLs for static hosting');
  for (const ref of html.match(/assets\/build\/[^"]+/g) ?? []) assert(fs.existsSync('dist/' + ref), `Missing built file: ${ref}`);
  assert(fs.existsSync('dist/assets/renders/elytra.png') && fs.existsSync('dist/assets/spawner.png'), 'Public assets must be copied into dist');
}

console.log(`PASS: catalog/provenance, formatting, recipe yield + grades, CSV import, spawner math, ${data.items.filter((d) => d.icon).length} local icons${process.argv.includes('--dist') ? ', built site' : ''}.`);
