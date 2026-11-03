"""Build the self-contained, offline-playable fleet game without dependencies."""
from pathlib import Path
import html
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "arcade"))
from build_assets import feedback_script, icons, licences
root = Path(__file__).resolve().parent
target = root.parent.parent / 'site' / 'fleet'
target.mkdir(parents=True, exist_ok=True)
page = (root / 'shell.html').read_text(encoding="utf-8")
for marker, filename in [('FLEET_STYLE', 'style.css'), ('FLEET_CORE', 'core.js'), ('FLEET_APP', 'app.js')]:
    code = (root / filename).read_text(encoding="utf-8")
    if marker == 'FLEET_APP':
        code = (root.parent / 'arcade' / 'journey.js').read_text(encoding='utf-8') + '\n' + code
    page = page.replace('/* ' + marker + ' */', code)
page = icons(page).replace("/* ARCADE_FEEDBACK */", feedback_script())
page = page.replace('</style>', (root.parent / 'arcade' / 'journey.css').read_text(encoding='utf-8') + '</style>')
licence = (root / 'LICENSE.txt').read_text(encoding="utf-8")
page = page.replace('/* FLEET_LICENSE */', html.escape(licence + "\n\n" + licences()))
(target / 'index.html').write_text(page, encoding="utf-8")
(target / 'LICENSE.txt').write_text(licence, encoding="utf-8")
print(f'Built {target / "index.html"}: {len(page.encode()):,} bytes')

(target / "CREDITS.md").write_text((root.parent / "arcade" / "CREDITS.md").read_text(encoding="utf-8"), encoding="utf-8")
