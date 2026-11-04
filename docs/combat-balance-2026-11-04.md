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
- Booth's base energy drain is 0.95/second. Catches and the 12-energy round
  supply let a new player learn the controls before the final round. Scoring
  still rewards aiming, consecutive catches, skill timing and bosses.

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
- Booth incoming damage is 65% / 80% / 90% / 100% across R1–4. Round supplies
  restore 20 armour, capped at maximum armour. After a hit, arcade players get
  1.2 seconds of immunity; hits still break the combo. The final round retains
  full damage, so reaching it and achieving a high score are separate goals.
- Legacy non-arcade naval movement/combat keeps its prior collision radius and
  targeting. Four stages, round choices, shields and the two-minute wall clock
  remain in place.

## Clear controls, feedback and results

- The opening guide has three instructions. The HUD prioritises score, health
  and round/time; duplicate energy/sector displays and the unused currency
  display in Catch are hidden. Unused difficulty, hangar and sharing controls
  are absent from the Booth flow. Sound, fullscreen and pause remain available.
- Laser, piercing and explosive shots have distinct cues; every fifth combo
  has a short rising chime. Explosions are quieter and rate-limited. Upgrade
  and end cues take priority over lingering shots. The existing 12-voice cap,
  mute control and audio fallback remain in place.
- Nearby simultaneous blast visuals are merged while every projectile still
  applies its own damage. Existing particle limits and reduced motion support
  keep feedback bounded; the enlarged R4 blast stays visible.
- Results use an 860px-wide card on desktop and the available phone width.
  They show a large score, local rank, the top five, and three short sentences
  connecting the game with allocating resources, reserves and risk. Only Play
  again and Menu actions remain. Short landscape screens use two columns so
  those actions stay visible without scrolling. Scores below the stored top
  ten display `10+` rather than implying an exact historical rank.

Catch and Wings store new scores under `booth-v9-combat3` partitions. Existing
records are retained. One Slice keeps its existing record keys and gameplay.

## Verification

- `node --test tests/*.test.mjs`: 146 passing tests.
- `npm run check`, `npm run bundle`, source syntax and `git diff --check` pass.
- Added behaviour checks for real blast damage/radius, early/late boss armour,
  boss scheduling and patrol, warning duration, locked aim, point-blank
  cancellation, centre gaps and capped hostile density.
- Three seeded 120-second aircraft simulations complete all four stages with
  paced keyboard movement, without shields or extra healing beyond round
  supplies. A controller samples visible trajectories every 150ms; this checks
  feasible routes, not human difficulty or a guarantee against every overlap.
- An additional deterministic benchmark runs 40 seeds per control style,
  without shields or repairs, using ordinary round supplies and one each of
  wingman, spread and rate upgrades. The slow reactive controller checks nearby
  bullets every 600ms and moves sideways without predicting trajectories.

  | Control style | Reached R4 | Finished | Median score (upper middle) |
  | --- | ---: | ---: | ---: |
  | Stationary | 23/40 | 0/40 | 4,350 |
  | Slow reactive | 38/40 | 0/40 | 8,515 |
  | Continuous sideways sweep | 40/40 | 30/40 | 18,980 |

  These are simulation outcomes, not measured first-time player probabilities.
  The regression suite checks 20 of the slow-reactive and stationary seeds.

Build the deliverables with `python sources/arcade/build.py`,
`python sources/fishing/build.py` and `python sources/fleet/build.py`.
Headless Chromium checked real Start/guide clicks and unclipped controls at
320×568, 390×844, 740×320 and 1280×900, in both Traditional Chinese and English
for both games (16 combinations; no page JavaScript errors). Normal mouse and
keyboard inputs with an accelerated animation clock reached R4 in both games.
Catch's Q/W/E/R and 1/2/3/4 activated the corresponding unlocked skills;
Wings used paced direction keys to avoid incoming shots through R3 into R4.
The landscape guide fix was rechecked in both languages. A second 16-case
browser pass checks the compact HUD, wide top-five result, replay reset and
visible landscape result actions. Real emulated two-touch events verify moving
or firing while pressing Freeze/Shield; fullscreen works for both games. Web
Audio decodes all eight bundled samples, plays the new cues, and clears voices
on mute with no page errors. R4 Catch was visually inspected during live hits
against the whale. These are browser checks, not an on-device touchscreen,
speaker or participant difficulty study.
