# Catch and Wings: four-round balance update

This update follows the four-round, two-minute Booth version at `ad8c6c3`.
It also compares the earlier aircraft patterns at `b782ffb`, before Booth
multiplied the enemy count, volley size and firing frequency together.
Existing licensed art/audio are reused; no new third-party assets are added.

## Catch

- The four buttons, keyboard handlers, guide and accessible labels agree:
  Q/1 Freeze (R1), W/2 Rapid (R2), E/3 Bomb (R3), R/4 Lure (R4).
  Upgrade-dialog number keys select upgrades only. Touch buttons remain usable
  while a separate pointer aims and fires.
- The R4 blast radius grows from 32 to 84 pixels on narrow arenas and 112 on
  wider arenas. The amber double ripple displays that radius; neighbouring fish
  receive 60% damage once per projectile. Normal hits, piercing R3 shots and
  blasts remain visually distinct. Effects use the existing bounded particle
  system and reduced-motion setting.
- A shark enters eight active seconds into R1. R2 introduces a whale, R3 a shark
  and R4 a whale. Only one live boss is scheduled at a time; replacements can
  arrive after 14 seconds. Bosses patrol the visible arena instead of dashing
  off a narrow phone screen. Ordinary random spawns no longer add extra sharks.
- Bosses have visible armour in R1–2, reducing incoming damage by half. R3–4
  bosses are unarmoured. Their base health is 2.5 times the species health, with
  8% growth per opening round, so weapon growth overtakes boss durability.
  On Booth, before rapid-fire/spread/bombs, ideal continuous direct hits need
  about 19/11/6/5 seconds for a shark and 29/17/9/7 seconds for a whale in R1–4.
  These are aiming-model estimates, not measured participant completion times.
- Phones use two rows of two skills. The guide button says “Guide / 玩法”; weapon
  names on round choices now match the actual bullets, twin laser, piercing shot
  and blast shot.

## Wings

- Arcade enemy attacks show a 0.7-second wind-up (0.95 seconds for bosses).
  Shot angles lock when the warning begins; hostile projectiles do not home.
  Enemies cannot begin or finish a volley within 160 game pixels of the hero,
  or when behind the hero. Warning starts are staggered by at least 0.22 seconds.
- Ordinary enemies fire one shot; inflation and elite enemies fire three.
  Bosses fire six, then eight below half health, with an open central gap.
  Bullet speed caps at 145 game pixels/second. Live hostile bullets plus queued
  volleys are limited to 30/36/42/48 in R1–4. Enemy counts cap at 5/6/7/8.
- The hero has an eight-pixel collision radius, shown by the white centre disc.
  Enemy bullets and that disc draw above friendly effects, keeping hazards
  readable during explosions. Bombs now have an impact burst.
- The short-landscape start guide is raised above the shield/footer so its Start
  button can actually receive clicks.
- Booth enemy health uses a 1.2 multiplier instead of 1.7; player direct damage
  uses 80% of the shared profile instead of 50%. Opening bosses use a 1.35 health
  factor. Spawn and attack intervals are paced separately from projectile count.
- Legacy non-arcade naval movement/combat keeps its prior collision radius and
  targeting. Four stages, round choices, shields and the two-minute wall clock
  remain in place.

Catch and Wings store new scores under `booth-v9-combat2` partitions. Existing
records are retained. One Slice keeps its existing record keys and gameplay.

## Verification

- `node --test tests/*.test.mjs`: 142 passing tests.
- `npm run check`, `npm run bundle`, source syntax and `git diff --check` pass.
- Added behaviour checks for real blast damage/radius, early/late boss armour,
  boss scheduling and patrol, warning duration, locked aim, point-blank
  cancellation, centre gaps and capped hostile density.
- Three seeded 120-second aircraft simulations complete all four stages with
  paced keyboard movement, without shields or extra healing beyond round
  supplies. A controller samples visible trajectories every 150ms; this checks
  feasible routes, not human difficulty or a guarantee against every overlap.

Build the deliverables with `python sources/arcade/build.py`,
`python sources/fishing/build.py` and `python sources/fleet/build.py`.
Headless Chromium checked real Start/guide clicks and unclipped controls at
320×568, 390×844, 740×320 and 1280×900, in both Traditional Chinese and English
for both games (16 combinations; no page JavaScript errors). Normal mouse and
keyboard inputs with an accelerated animation clock reached R4 in both games.
Catch's Q/W/E/R and 1/2/3/4 activated the corresponding unlocked skills;
Wings used paced direction keys to avoid incoming shots through R3 into R4.
The landscape guide fix was rechecked in both languages. These are browser
checks, not an on-device touchscreen, speaker or participant difficulty study.
