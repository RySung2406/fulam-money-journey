# FuLam arcade and Booth v2

Requested by Ryan on 2026-11-04. Three high-score games share two public difficulties (Standard and Challenge) and a separate Booth preset. `/booth/` links to each activity. `/fleet/` remains compatible with existing links and now hosts Wealth Wings, an aircraft shooter.

## Rules and storage

- Web runs have no time limit. Every 30 active seconds opens an eight-second, three-choice upgrade: power, the next weapon, or support. The recommendation is applied if the timer expires. Combat is paused during choices.
- Booth fixes Standard difficulty and a reproducible seed. It ends at 180 elapsed seconds after starting, including pauses, intermissions and time spent away from the page. The visual result appears on the next animation frame after a hidden page returns. Defeat can finish earlier.
- Common upgrade strength survives weapon switches. Switching has a three-second cooldown. One Slice has three blades; Catch and Wings each have four weapon families.
- Catch drains energy, replenishes it on catches, and ends at zero. Net and freeze remain independently touchable while firing. Hidden legacy abilities cannot be activated by shortcuts in v2.
- Wings uses time-based rounds, a boss every third round and a wider second-phase boss pattern. Cash workshop upgrades, shield reserves and paid repairs coexist with free round choices. Paid weapon strength is retained across later free upgrades.
- One Slice starts with five hearts on Standard and three on Challenge. Wrong cuts cost one heart. Five missed correct targets on Standard, or three on Challenge, also cost one heart. Topics change only between rounds; old targets are removed first. Precision changes the hit area; Combo increases correct-score rewards; Focus charges a manual slow-time skill.
- Ranking uses integer score. Separate browser-local top-ten boards are keyed by version, game, setting, difficulty, and (for One Slice) initial topic and starting language. Existing legacy record keys are retained, not migrated into incomparable new boards. These are unverified local scores, not a server leaderboard.
- No login, participant database, questionnaire or financial account is involved. Learning notes describe actual choices when available. Gameplay scores are not assessment results or investment returns.
- Booth results include locally hosted QR SVGs linking to the corresponding public web game. Scanning starts a fresh run, not a transferred session. QR production provenance and hashes are in `sources/arcade/qr-assets.json`.

## Build

```sh
python sources/arcade/build.py
python sources/fishing/build.py
python sources/fleet/build.py
npm run check
npm test
npm run bundle
git diff --check
```

The shared source is `sources/arcade/journey.js` and `journey.css`. Builds embed both into the two Canvas games and copy them into `site/arcade` for One Slice. The original gameplay cores retain their fallback rules when the progression runtime is absent; old regression suites cover these paths. `tests/journey.test.mjs` covers the new clocks, upgrade lifecycle, weapon families, storage partitions and aircraft changes. Browser checks exercise the assembled v2 pages.

## Browser verification

The mounted Browser was used for actual UI starts, selections, pause/finish/restart flows and fullscreen controls. Its virtual clock accelerated ordinary animation frames for round transitions and the Booth deadline; no gameplay mutation API was shipped.

Checked Chinese and English at 320×568, 390×844, 740×320 and 1280×900. Both Canvas games support an aiming/movement finger plus a separate skill finger, including releasing only the skill finger. Fishing intermissions and aircraft workshop controls remain inside fullscreen. Each Booth activity expires through pause and resets the next player's score/loadout. This is browser simulation, not an iPhone hardware or speaker listening test.

Balance is an initial playable version. Real booth play is needed to tune late-run difficulty, average session length and reading time. Sound assets are the existing licensed Kenney selection, with original vector aircraft, clouds and interface additions.
