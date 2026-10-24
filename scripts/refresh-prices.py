"""Refresh public displayed quotes. No credentials or fabricated prices are used."""
import argparse
import collections
import datetime as dt
import hashlib
import html
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
TERMINAL = 'https://donutsmpterminal.com/all_items'
AUCTION = 'https://donut.auction'


def read_source(url, local):
    if local:
        path = Path(local)
        return path.read_bytes(), dt.datetime.fromtimestamp(path.stat().st_mtime, dt.timezone.utc)
    request = urllib.request.Request(url, headers={'User-Agent': 'DonutTracker public snapshot refresh'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read(), dt.datetime.now(dt.timezone.utc)


def iso(value):
    return value.replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def write_json(path, value):
    with path.open('w', encoding='utf-8', newline='\n') as output:
        output.write(json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def price(label):
    label = html.unescape(label).strip()
    if label == 'No data':
        return None
    match = re.fullmatch(r'\$?([\d,]+(?:\.\d+)?)([KMBT]?)', label)
    if not match:
        raise ValueError('Unrecognized price label: ' + label)
    value = float(match[1].replace(',', '')) * {'': 1, 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12}[match[2]]
    if value <= 0:
        raise ValueError('Nonpositive quote: ' + label)
    return value


def refresh(terminal_path=None, auction_path=None):
    # Parse both complete sources before writing anything. A markup/coverage failure
    # leaves the current snapshot intact.
    raw, retrieved = read_source(TERMINAL, terminal_path)
    page = raw.decode('utf-8')
    stamp = re.search(r'Data updated ([A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2} [AP]M UTC)', page)
    if not stamp:
        raise ValueError('Public source update timestamp missing')
    source_time = dt.datetime.strptime(str(retrieved.year) + ' ' + stamp[1], '%Y %b %d, %I:%M %p UTC').replace(tzinfo=dt.timezone.utc)
    if source_time > retrieved + dt.timedelta(days=1):
        source_time = source_time.replace(year=source_time.year - 1)
    if source_time > retrieved + dt.timedelta(minutes=5):
        raise ValueError('Source timestamp is in the future')
    rows = re.findall(r'<div class="data-row">(.*?)</div>', page, re.S)
    count = re.search(r'class="recipe-count">([\d,]+)(?:<!-- -->)? shown', page)
    if not count or len(rows) != int(count[1].replace(',', '')) or len(rows) < 1300:
        raise ValueError('Incomplete public catalog: row count does not match coverage')

    manifest_path = DATA / 'market-snapshot.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'quotesFile': 'quotes-2026-10-21.json'}
    old = json.loads((DATA / previous['quotesFile']).read_text())
    references = collections.defaultdict(list)
    for quote in sorted(old, key=lambda q: int(q['ref'])):
        references[quote['name']].append(quote['ref'])
    next_ref = max(int(q['ref']) for q in old) + 1
    occurrences = collections.Counter()
    quotes = []
    for row in rows:
        name = html.unescape(re.search(r'<strong>(.*?)</strong>', row)[1])
        label = re.search(r'<span class="inline-price static" aria-label="([^"]+)">(.*?)</span>', row)
        grade = re.search(r'class="via-chip via-[^"]+"[^>]*>([SABCD])</span>', row)
        change = re.search(r'<span class="(?:pos|neg)">(.*?)</span>', row)
        if not label or not grade or not change:
            raise ValueError('Missing quote fields: ' + name)
        change_text = html.unescape(change[1])
        if change_text != 'No data' and not re.fullmatch(r'[+-]?[\d,.]+%', change_text):
            raise ValueError('Unrecognized change: ' + name)
        occurrence = occurrences[name]
        occurrences[name] += 1
        # Retain existing watchlist IDs; duplicate names remain separate source
        # variants and are never assigned to the vanilla item by the builder.
        if occurrence < len(references[name]):
            ref = references[name][occurrence]
        else:
            ref = str(next_ref)
            next_ref += 1
        quotes.append({'ref': ref, 'name': name, 'price': price(label[2]),
                       'change': None if change_text == 'No data' else float(change_text[:-1].replace(',', '')),
                       'grade': grade[1], 'source': TERMINAL, 'sourceTime': iso(source_time),
                       'priceType': 'Buy order' if 'buy order price' in label[1] else 'Auction house',
                       'rounded': True})

    auction_raw, auction_retrieved = read_source(AUCTION, auction_path)
    auction_page = auction_raw.decode('utf-8')
    alternates = {}
    vanilla = {i['displayName']: i['name'] for i in json.loads((DATA / 'items-26.1.json').read_text())}
    for href, card in re.findall(r'<a [^>]*href="(/item/[^\"]+)"[^>]*>(.*?)</a>', auction_page, re.S):
        name = re.search(r'<h3[^>]*>(.*?)</h3>', card)
        value = re.search(r'<p class="[^"]*text-green-400[^"]*">(\$[\d,.]+)</p>', card)
        if not name or not value or html.unescape(name[1]) not in vanilla:
            raise ValueError('Unrecognized Donut.Auction item card')
        item_id = vanilla[html.unescape(name[1])]
        if item_id in alternates:
            raise ValueError('Duplicate alternate item: ' + item_id)
        alternates[item_id] = {'price': price(value[1]), 'source': AUCTION + href,
                               'observedOn': auction_retrieved.date().isoformat(), 'rounded': True,
                               'kind': 'Displayed value; source update time unknown'}
    if len(alternates) < 25:
        raise ValueError('Incomplete Donut.Auction observations')

    day = retrieved.date().isoformat()
    manifest = {'quotesFile': 'quotes-' + day + '.json',
                'alternatesFile': 'auction-observations-' + day + '.json',
                'source': TERMINAL, 'sourceTime': iso(source_time), 'retrievedOn': day,
                'retrievedAt': iso(retrieved), 'quoteRows': len(quotes),
                'priceCount': sum(q['price'] is not None for q in quotes),
                'alternateCount': len(alternates),
                'sources': [{'url': TERMINAL, 'retrievedAt': iso(retrieved), 'sha256': hashlib.sha256(raw).hexdigest()},
                            {'url': AUCTION, 'retrievedAt': iso(auction_retrieved), 'sha256': hashlib.sha256(auction_raw).hexdigest()}]}
    write_json(DATA / manifest['quotesFile'], quotes)
    write_json(DATA / manifest['alternatesFile'], alternates)
    write_json(manifest_path, manifest)
    print(json.dumps({key: manifest[key] for key in ['sourceTime', 'retrievedAt', 'quoteRows', 'priceCount', 'alternateCount']}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--terminal-html', help='Previously fetched public HTML; use its retrieval mtime')
    parser.add_argument('--auction-html', help='Previously fetched public HTML; use its retrieval mtime')
    args = parser.parse_args()
    refresh(args.terminal_html, args.auction_html)
