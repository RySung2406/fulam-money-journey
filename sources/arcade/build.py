from pathlib import Path
root = Path(__file__).resolve().parent
target = root.parent.parent / 'site' / 'arcade'
target.mkdir(exist_ok=True)
for name in ['journey.js', 'journey.css']:
    (target / name).write_text((root / name).read_text(encoding='utf-8'), encoding='utf-8')
print('Built shared arcade progression')
