"""Use content-addressed entry assets so releases cannot reuse stale catalog/UI files."""
import hashlib
import pathlib
import re

dist = pathlib.Path(__file__).resolve().parent.parent / 'dist'
target = dist / 'assets' / 'build'
target.mkdir(parents=True, exist_ok=True)
html = (dist / 'index.html').read_text(encoding='utf-8')
current = set()
for name in ['styles.css', 'catalog.js', 'motion.js', 'app.js']:
    source = dist / name
    digest = hashlib.sha256(source.read_bytes()).hexdigest()[:16]
    versioned = f'{source.stem}-{digest}{source.suffix}'
    (target / versioned).write_bytes(source.read_bytes())
    current.add(versioned)
    pattern = rf'(["\'])(?:assets/build/)?{source.stem}(?:-[a-f0-9]{{16}})?\.{source.suffix[1:]}(?:\?[^"\']*)?\1'
    html, count = re.subn(pattern, f'"assets/build/{versioned}"', html)
    if count != 1:
        raise RuntimeError(f'Expected one entry reference for {name}; found {count}')
with (dist / 'index.html').open('w', encoding='utf-8', newline='\n') as output:
    output.write(html)
# Drop superseded release copies so the deployment only ships what index.html loads.
for old in target.iterdir():
    if old.name not in current and re.fullmatch(r'(styles|catalog|motion|app)-[a-f0-9]{16}\.(css|js)', old.name):
        old.unlink()
print('Versioned stylesheet, catalog, motion, and application assets.')
