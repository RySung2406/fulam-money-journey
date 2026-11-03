from pathlib import Path
import json
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "arcade"))
from build_assets import feedback_script, icons, licences
p = Path(__file__).resolve().parent
shell = (p / 'shell.html').read_text(encoding="utf-8")
shell = icons(shell).replace("/* COMPACT_STYLE */", (p / "compact.css").read_text(encoding="utf-8"))
shell = shell.replace("<!--ARCADE-->", "<script>" + feedback_script() + "</script>")
license_text = (p / 'upstream-license.txt').read_text(encoding="utf-8")
for name, filename in [('ART', 'art.js'), ('FORMATIONS', 'formations.js'), ('GAME', 'game.js')]:
    code = (p / filename).read_text(encoding="utf-8")
    if name == 'GAME':
        code = 'const ARCADE_LICENSE=' + json.dumps(licences(), ensure_ascii=False) + ';\n' + 'const UPSTREAM_LICENSE=' + json.dumps(license_text, ensure_ascii=False) + ';\n' + code
    shell = shell.replace('<!--' + name + '-->', '<script>\n' + code + '\n</script>')
output = p.parents[1] / 'site' / 'fishing' / 'index.html'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(shell, encoding="utf-8")
print('Built', output.relative_to(p.parents[1]))

(output.parent / "CREDITS.md").write_text((p.parent / "arcade" / "CREDITS.md").read_text(encoding="utf-8"), encoding="utf-8")
