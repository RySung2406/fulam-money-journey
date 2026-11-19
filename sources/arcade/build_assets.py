"""Embed selected assets; games stay self-contained and work offline."""
from pathlib import Path
import base64
import json
import re

ROOT = Path(__file__).resolve().parent

def arcade_style():
    css = (ROOT / 'journey.css').read_text(encoding='utf-8')
    image = (ROOT.parents[1] / 'site' / 'arcade' / 'campus-christmas.webp').read_bytes()
    return css.replace('../arcade/campus-christmas.webp', 'data:image/webp;base64,' + base64.b64encode(image).decode('ascii'))

def feedback_script():
    assets = {p.stem: base64.b64encode(p.read_bytes()).decode('ascii')
              for p in sorted((ROOT / 'audio').glob('*.mp3'))}
    return 'window.FuLamArcadeAssets=' + json.dumps(assets) + ';\n' + (ROOT / 'feedback.js').read_text(encoding='utf-8')

def icons(page):
    def replace(match):
        name = match.group(1)
        svg = (ROOT / 'icons' / (name + '.svg')).read_text(encoding='utf-8')
        return svg.replace('<svg', '<svg aria-hidden="true"', 1)
    return re.sub(r'<!-- ICON:([a-z0-9-]+) -->', replace, page)

def licences():
    return '\n\n'.join('\n'.join(line.rstrip() for line in p.read_text(encoding='utf-8').splitlines())
                       for p in sorted((ROOT / 'licenses').glob('*.txt')))
