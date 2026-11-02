"""Build the self-contained, offline-playable fleet game without dependencies."""
from pathlib import Path
import html
root = Path(__file__).resolve().parent
target = root.parent.parent / 'site' / 'fleet'
target.mkdir(parents=True, exist_ok=True)
page = (root / 'shell.html').read_text()
for marker, filename in [('FLEET_STYLE', 'style.css'), ('FLEET_CORE', 'core.js'), ('FLEET_APP', 'app.js')]:
    page = page.replace('/* ' + marker + ' */', (root / filename).read_text())
licence = (root / 'LICENSE.txt').read_text()
page = page.replace('/* FLEET_LICENSE */', html.escape(licence))
(target / 'index.html').write_text(page)
(target / 'LICENSE.txt').write_text(licence)
print(f'Built {target / "index.html"}: {len(page.encode()):,} bytes')
