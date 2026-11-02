from pathlib import Path
import json
p = Path(__file__).resolve().parent
shell = (p / 'shell.html').read_text()
license_text = (p / 'upstream-license.txt').read_text()
for name, filename in [('ART', 'art.js'), ('FORMATIONS', 'formations.js'), ('GAME', 'game.js')]:
    code = (p / filename).read_text()
    if name == 'GAME':
        code = 'const UPSTREAM_LICENSE=' + json.dumps(license_text, ensure_ascii=False) + ';\n' + code
    shell = shell.replace('<!--' + name + '-->', '<script>\n' + code + '\n</script>')
output = p.parents[1] / 'site' / 'fishing' / 'index.html'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(shell)
print('Built', output.relative_to(p.parents[1]))
