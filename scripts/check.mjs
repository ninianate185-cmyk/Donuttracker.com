// Data + logic checks. `--dist` also checks a finished `vite build`.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseStats, validUsername, playtime, killDeath } from '../src/lib/players.ts';
import { timestamp, timeAgo } from '../src/lib/time.ts';
import { handlePlayerRequest } from '../server/player-api.mjs';
import { fmt, pct } from '../src/lib/format.ts';
import { craft, craftable, passesGrade } from '../src/lib/market.ts';
import { spawnerEstimate } from '../src/lib/spawner.ts';
import { parseCSV, aggregateSales } from '../src/lib/csv.ts';
import { TIP_USERNAME, TIP_PRESETS, tipCommand } from '../src/lib/tips.ts';

const data = JSON.parse(fs.readFileSync('src/data/catalog.json', 'utf8'));
const snapshot = JSON.parse(fs.readFileSync('data/market-snapshot.json', 'utf8'));
const quotes = JSON.parse(fs.readFileSync('data/' + snapshot.quotesFile, 'utf8'));
const byId = new Map(data.items.map((d) => [d.id, d]));

// In-game tips are a fixed recipient and a validated amount, never an executed payment.
assert.equal(TIP_USERNAME, 'ninianate');
for (const value of TIP_PRESETS) assert.equal(tipCommand(String(value)), `/pay ninianate ${value}`);
assert.equal(tipCommand(' 00042 '), '/pay ninianate 42');
for (const value of ['', '0', '-5', '1.5', '1e6', '100k', 'NaN', 'Infinity', '9007199254740992', '100\n/pay someone 100', '10;op']) assert.equal(tipCommand(value), null, `Reject malformed tip amount: ${value}`);

// Catalog integrity and provenance
assert.equal(data.meta.catalogCount, 1505, 'Java 26.1 registry minus Air');
assert(!byId.has('air'), 'Air is not a tradeable item');
assert.equal(data.items.length, byId.size, 'IDs must be unique');
assert.equal(quotes.length, snapshot.quoteRows, 'Complete source row coverage');
assert.equal(new Set(quotes.map((q) => q.ref)).size, quotes.length, 'Unique source variant references');
assert.equal(data.items.filter((d) => Number.isFinite(d.price)).length, snapshot.priceCount);
assert.equal(snapshot.priceCount, quotes.filter((q) => Number.isFinite(q.price)).length);
assert.equal(data.meta.priceCount, snapshot.priceCount);
assert.equal(data.meta.sourceTime, snapshot.sourceTime);
assert.equal(data.meta.retrievedAt, snapshot.retrievedAt);
assert(Date.parse(snapshot.sourceTime) <= Date.parse(snapshot.retrievedAt), 'Retrieval is not the source update time');
assert(data.items.filter((d) => d.price !== null).every((d) => d.sourceTime === snapshot.sourceTime), 'All quotes use the current snapshot');
for (const q of quotes) {
  const match = data.items.find((d) => d.id === `tracked_${q.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${q.ref}`)
    ?? data.items.find((d) => d.name === q.name && d.category !== 'Server variants');
  assert(match, `Missing source row: ${q.name}`);
  assert.equal(match.price, q.price, `Quote mismatch: ${q.name}`);
  assert.equal(match.change, q.change, `Change mismatch: ${q.name}`);
  assert.equal(match.priceType, q.priceType, `Quote type mismatch: ${q.name}`);
}
assert.equal(Object.keys(data.alternates).length, snapshot.alternateCount);
assert(Object.values(data.alternates).every((q) => q.observedOn === snapshot.retrievedOn));
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
assert(fs.existsSync('public/assets/entity/spawner_block.png') && fs.existsSync('public/assets/renders/spawner.png'));

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
assert(flips.filter((d) => !passesGrade(d.recipe.grade, 'B')).every((d) => !reliable.includes(d)));
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
  assert(fs.existsSync('dist/assets/renders/elytra.png') && fs.existsSync('dist/assets/entity/spawner_block.png'), 'Public assets must be copied into dist');
}

console.log(`PASS: catalog/provenance, formatting, recipe yield + grades, CSV import, spawner math, ${data.items.filter((d) => d.icon).length} local icons${process.argv.includes('--dist') ? ', built site' : ''}.`);

// Freshness labels must follow the source timestamp, not the page load time.
assert(timestamp('2026-10-21T17:49:00Z').includes('2026'));
assert(timestamp('2026-10-21T17:49:00Z').includes('PDT'));
assert.equal(timeAgo('2026-10-21T17:49:00Z', Date.parse('2026-10-23T17:49:00Z')), '2 days ago');
assert.equal(timeAgo('invalid'), 'Time unavailable');
// Official stats: unknown values remain missing, and zero deaths are handled explicitly.
assert(validUsername('DrDonut') && validUsername('.Player_1'));
assert(!validUsername('../secret') && !validUsername('a') && !validUsername('bad name'));
const stats = parseStats({ money: '1234567', kills: '20', deaths: '0', shards: '', playtime: '90000000' });
assert.equal(stats.money, 1234567); assert.equal(stats.shards, null); assert.equal(stats.broken_blocks, null);
assert.equal(killDeath(stats), 'No deaths'); assert.equal(playtime(stats.playtime), '1d 1h');
assert.throws(() => parseStats({ money: 'NaN', deaths: -1 }));
const request = new Request('https://stats.example/?username=DrDonut', { headers: { Origin: 'https://donut-tracker-nathan.ninianate185.chatgpt.site' } });
assert.equal((await handlePlayerRequest(request, {})).status, 503);
const api = await handlePlayerRequest(request, { DONUTSMP_API_KEY: 'test-only' }, async (url, init) => {
  assert.equal(url, 'https://api.donutsmp.net/v1/stats/DrDonut');
  assert.equal(init.headers.Authorization, 'Bearer test-only');
  return Response.json({ status: 200, result: { money: '5', kills: '0' } });
});
const payload = await api.json();
assert.equal(api.status, 200); assert.equal(payload.stats.money, '5'); assert.equal(payload.stats.shards, null);
assert(!JSON.stringify(payload).includes('test-only'));
assert.equal((await handlePlayerRequest(request, { DONUTSMP_API_KEY: 'test-only' }, async () => new Response('', { status: 429 }))).status, 429);
console.log('PASS: source update timestamps, player input + missing stats, private-key proxy and API errors.');
