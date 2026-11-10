"""Rewrite arcade scene SVGs as Christmas venues (original FuLam vectors)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Source of truth — `sources/arcade/build.py` copies these into site/arcade/scenes.
OUT = ROOT / 'sources' / 'arcade' / 'scenes'
SITE = ROOT / 'site' / 'arcade' / 'scenes'


def stars(n=36, seed=1, color='#fff4d2', op='.22'):
    parts = []
    x = seed * 97
    for _ in range(n):
        x = (x * 1664525 + 1013904223) & 0xffffffff
        cx, cy, r = x % 900, (x >> 9) % 1100, 1 + (x >> 3) % 3
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}" opacity="{op}"/>')
    return ''.join(parts)


def snow(n=40, seed=3):
    parts = []
    x = seed * 131
    for _ in range(n):
        x = (x * 1103515245 + 12345) & 0xffffffff
        cx, cy, r = x % 900, (x >> 8) % 1180, 1.2 + (x >> 4) % 3
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#ffffff" opacity=".28"/>')
    return ''.join(parts)


def tree(x, y, s=1, light='#edb579'):
    return (
        f'<g transform="translate({x} {y}) scale({s})">'
        '<path d="M0 0 L42 -110 L84 0 Z" fill="#1f5a3f"/>'
        '<path d="M10 -14 L42 -92 L74 -14 Z" fill="#2a6f4d"/>'
        '<path d="M18 -30 L42 -78 L66 -30 Z" fill="#34825a"/>'
        '<rect x="36" y="0" width="12" height="28" fill="#6b4423"/>'
        '<circle cx="26" cy="-36" r="6" fill="#c23b3b"/>'
        f'<circle cx="58" cy="-48" r="5.5" fill="{light}"/>'
        '<circle cx="42" cy="-66" r="5" fill="#fff2c8"/>'
        '<circle cx="30" cy="-20" r="4.5" fill="#edb579"/>'
        '<circle cx="54" cy="-24" r="4.5" fill="#c23b3b"/>'
        '<polygon points="42,-118 48,-104 36,-104" fill="#fff2c8"/>'
        '</g>'
    )


def snowman(x, y, s=1):
    return (
        f'<g transform="translate({x} {y}) scale({s})">'
        '<circle cx="0" cy="36" r="28" fill="#f4f7fb"/>'
        '<circle cx="0" cy="0" r="20" fill="#f4f7fb"/>'
        '<circle cx="0" cy="-28" r="14" fill="#f4f7fb"/>'
        '<circle cx="-5" cy="-30" r="2" fill="#17392b"/><circle cx="5" cy="-30" r="2" fill="#17392b"/>'
        '<path d="M-3 -24 L8 -22" stroke="#ed9858" stroke-width="3" stroke-linecap="round"/>'
        '<rect x="-16" y="-42" width="32" height="10" rx="2" fill="#c23b3b"/>'
        '<rect x="-10" y="-56" width="20" height="16" rx="2" fill="#c23b3b"/>'
        '<circle cx="0" cy="4" r="3" fill="#17392b"/><circle cx="0" cy="16" r="3" fill="#17392b"/>'
        '</g>'
    )


def garland(y=90):
    return (
        f'<path d="M40 {y} Q225 {y + 40} 450 {y} T860 {y}" fill="none" stroke="#c23b3b" stroke-width="6" opacity=".45"/>'
        f'<circle cx="120" cy="{y + 18}" r="5" fill="#edb579"/>'
        f'<circle cx="280" cy="{y + 8}" r="5" fill="#2f8f5b"/>'
        f'<circle cx="450" cy="{y + 18}" r="5" fill="#c23b3b"/>'
        f'<circle cx="620" cy="{y + 6}" r="5" fill="#edb579"/>'
        f'<circle cx="780" cy="{y + 16}" r="5" fill="#fff2c8"/>'
    )


def fishing_extra(i):
    seabed = (
        '<path d="M0 980Q180 900 360 990T720 970T900 1000V1200H0Z" fill="#0a2f3a"/>'
        '<path d="M0 1080Q220 1000 450 1100T900 1070V1200H0Z" fill="#12484f" opacity=".85"/>'
    )
    kelp = ''.join(
        f'<g stroke="#2f8f5b" stroke-width="{5 + k}" fill="none" opacity=".35" stroke-linecap="round">'
        f'<path d="M{80 + k * 95} 1200 Q{60 + k * 95} 1050 {90 + k * 95} 920"/></g>'
        for k in range(8)
    )
    colors = ('#c23b3b', '#2f8f5b', '#edb579')
    gifts = ''.join(
        f'<g transform="translate({110 + k * 160} 1080)">'
        f'<rect x="-22" y="-18" width="44" height="36" rx="4" fill="{colors[k % 3]}"/>'
        '<rect x="-22" y="-4" width="44" height="8" fill="#fff2c8" opacity=".7"/>'
        '<rect x="-4" y="-18" width="8" height="36" fill="#fff2c8" opacity=".7"/>'
        '</g>'
        for k in range(5)
    )
    return seabed + kelp + gifts + snow(28, 10 + i) + garland(160) + tree(70, 940, 1.35) + tree(760, 950, 1.55) + snowman(450, 1000, 0.9)


def fleet_extra(i):
    aurora = (
        '<path d="M-40 220 Q220 40 450 180 T980 120 L980 420 Q450 280 -40 360Z" fill="#2f8f5b" opacity=".16"/>'
        '<path d="M-20 280 Q260 120 500 250 T940 180 L940 460 Q480 340 -20 420Z" fill="#edb579" opacity=".10"/>'
    )
    moon = (
        '<circle cx="720" cy="160" r="54" fill="#fff4d2" opacity=".55"/>'
        '<circle cx="740" cy="145" r="54" fill="#0b1e36" opacity=".35"/>'
    )
    hills = (
        '<path d="M0 900 Q180 780 360 880 T720 820 T900 900 V1200H0Z" fill="#0f2a3a"/>'
        '<path d="M0 1000 Q250 900 500 1020 T900 980 V1200H0Z" fill="#163746"/>'
    )
    trees = tree(80, 880, 1.6) + tree(200, 900, 1.2) + tree(620, 885, 1.4) + tree(780, 895, 1.7)
    return aurora + moon + hills + trees + snowman(450, 860, 1.1) + snow(50, 20 + i) + garland(110)


def knife_extra(i):
    arch = (
        '<path d="M90 1200V320Q90 80 450 80T810 320v880" fill="none" stroke="#edb579" stroke-width="4" opacity=".28"/>'
        '<path d="M120 1200V340Q120 120 450 120T780 340v860" fill="none" stroke="#c23b3b" stroke-width="10" opacity=".08"/>'
    )
    wreath = (
        '<g transform="translate(450 220)">'
        '<circle r="70" fill="none" stroke="#2f8f5b" stroke-width="22" opacity=".85"/>'
        '<circle r="70" fill="none" stroke="#1f5a3f" stroke-width="8" opacity=".5"/>'
        '<circle cx="-45" cy="10" r="6" fill="#c23b3b"/>'
        '<circle cx="40" cy="-20" r="6" fill="#edb579"/>'
        '<circle cx="10" cy="45" r="6" fill="#fff2c8"/>'
        '<circle cx="-20" cy="-40" r="5" fill="#c23b3b"/>'
        '<circle cx="35" cy="30" r="5" fill="#edb579"/>'
        '<path d="M-14 55 Q0 85 14 55" fill="#c23b3b"/>'
        '</g>'
    )
    colors = ('#c23b3b', '#2f8f5b', '#edb579')
    stockings = ''.join(
        f'<g transform="translate({180 + k * 140} 980)">'
        f'<path d="M0 0 h28 v70 q0 18 -18 18 h-20 q-12 0 -12 -14 v-18 h22 z" fill="{colors[k % 3]}" opacity=".85"/>'
        '<rect x="0" y="0" width="28" height="12" fill="#fff2c8"/>'
        '</g>'
        for k in range(5)
    )
    floor = (
        '<path d="M0 1080h900v120H0Z" fill="#0a2433"/>'
        '<path d="M0 1080h900" stroke="#edb579" stroke-width="3" opacity=".25"/>'
    )
    return arch + wreath + stockings + floor + garland(70) + tree(120, 1000, 1.2) + tree(720, 1000, 1.3) + snowman(450, 980, 1) + snow(20, 30 + i)


THEMES = [
    ('#163a55', '#0a1f30', '#edb579'),
    ('#1a3f4a', '#0b2533', '#ffd29a'),
    ('#2a2048', '#120f28', '#c9a0ff'),
    ('#3a2430', '#1a121c', '#eab77f'),
    ('#24384f', '#161a2e', '#ffdbb6'),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    SITE.mkdir(parents=True, exist_ok=True)
    extras = {'fishing': fishing_extra, 'fleet': fleet_extra, 'knife': knife_extra}
    for game, extra_fn in extras.items():
        for i, (top, bot, glow) in enumerate(THEMES):
            svg = (
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice">'
                f'<defs><linearGradient id="sky" x2=".35" y2="1"><stop stop-color="{top}"/>'
                f'<stop offset="1" stop-color="{bot}"/></linearGradient>'
                f'<radialGradient id="glow"><stop stop-color="{glow}" stop-opacity=".28"/>'
                f'<stop offset="1" stop-color="{glow}" stop-opacity="0"/></radialGradient></defs>'
                f'<path fill="url(#sky)" d="M0 0h900v1200H0Z"/>'
                f'<ellipse cx="680" cy="90" rx="720" ry="880" fill="url(#glow)"/>'
                f'{stars(34, i * 7 + 3, glow)}{extra_fn(i)}'
                f'<path d="M0 0h900v1200H0Z" fill="#06131d" opacity=".12"/></svg>'
            )
            name = f'{game}-{i}.svg'
            (OUT / name).write_text(svg, encoding='utf-8')
            (SITE / name).write_text(svg, encoding='utf-8')
            print(f'wrote {name} ({len(svg)} bytes)')


if __name__ == '__main__':
    main()
