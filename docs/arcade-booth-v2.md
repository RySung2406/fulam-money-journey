# FuLam arcade and Booth — v3 interface revision

Requested by Ryan on 2026-11-04. Updated after Ryan’s 2026-11-04 feedback on play area, onboarding, controls, modes and answer size. Three high-score games share two public difficulties (Standard and Challenge) and a separate Booth preset. `/booth/` links to each activity. `/fleet/` remains compatible with existing links and now hosts Wealth Wings, an aircraft shooter.

## Rules and storage

- Web runs have no total time limit. Catch and Wings offer an eight-second upgrade choice every 30 active seconds. One Slice offers it after all 20 choices in a stage have been resolved, rather than on a timer. The choices are power, the next weapon, or support; power is applied after eight seconds without a selection. Combat pauses during choices.
- Booth fixes Standard difficulty and a reproducible seed. It ends at 180 elapsed seconds after starting, including pauses, intermissions and time spent away from the page. The visual result appears on the next animation frame after a hidden page returns. Defeat can finish earlier.
- Common upgrade strength survives weapon switches. Switching has a three-second cooldown. One Slice has three blades; Catch and Wings each have four weapon families.
- Catch drains energy, replenishes it on catches, and ends at zero. All six skills are visible and independently touchable while firing. Net and freeze start unlocked; rapid fire, double coins, bomb and lure unlock in rounds 2, 3, 4 and 5. Buttons show shortcuts and cooldowns.
- Wings uses time-based rounds, a boss every third round and a wider second-phase boss pattern. Cash workshop upgrades, shield reserves and paid repairs coexist with free round choices. Paid weapon strength is retained across later free upgrades.
- One Slice starts at the first topic, in both modes. Every stage draws its 20 existing choices once (10 correct, 10 decoys); five topics rotate in order. English and Chinese have matching option IDs. Artwork is smaller while answer text remains at least 16px in play. One Slice starts with five hearts on Standard and three on Challenge. Wrong cuts cost one heart. Five missed correct targets on Standard, or three on Challenge, also cost one heart. Topics change only between rounds; old targets are removed first. Precision changes the hit area; Combo increases correct-score rewards; Focus charges a manual slow-time skill.
- Ranking uses integer score. Separate browser-local top-ten boards are keyed by version, game, setting, difficulty, and (for One Slice) fixed starting topic and starting language. Existing legacy record keys are retained, not migrated into incomparable new boards. These are unverified local scores, not a server leaderboard.
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

The shared source is `sources/arcade/journey.js` and `journey.css`. Builds embed both into the two Canvas games and copy them into `site/arcade` for One Slice. The original gameplay cores retain their fallback rules when the progression runtime is absent; old regression suites cover these paths. `tests/journey.test.mjs` covers the new clocks, upgrade lifecycle, weapon families, storage partitions and aircraft changes. Browser checks exercise the assembled pages.

## Browser verification

The mounted Browser was used for actual UI starts, selections, pause/finish/restart flows and fullscreen controls. Its virtual clock accelerated ordinary animation frames for round transitions and the Booth deadline; no gameplay mutation API was shipped.

Checked Chinese and English at 320×568, 390×844, 740×320 and 1280×900. Both Canvas games support an aiming/movement finger plus a separate skill finger, including releasing only the skill finger. Fishing intermissions and aircraft workshop controls remain inside fullscreen. Each Booth activity expires through pause and resets the next player's score/loadout. This is browser simulation, not an iPhone hardware or speaker listening test.

Balance is an initial playable version. Real booth play is needed to tune late-run difficulty, average session length and reading time. Sound assets are the existing licensed Kenney selection, with original vector aircraft, clouds and interface additions.

## v3 interface

- Every new run opens a controls guide; the run and Booth clock start only on its Start button. In short views, instructions scroll inside the card while Start and Back remain visible.
- Standard and Challenge are two distinct cards. Booth is a separate violet button; selecting a public difficulty exits Booth selection.
- Catch and Wings expand their battlefield during play. All exits are solid red, including in-game End and result/menu Back controls.
- Wings puts the paid hangar inside the playing surface; it pauses combat and works in fullscreen. Keyboard 1–4 retains direct purchases.
- Slice uses E to switch blades, Q for charged Focus, P to pause; mouse, touch and keyboard target activation remain supported.
- Records use `booth-v3` because the option pool and available skills changed. Older records are retained under their own keys. QR SVGs and their hashes were refreshed to the new public entry version.

The v3 revision passed 120 repository tests and syntax/bundle checks. Mounted Browser checks covered 30 Chinese/English/game/viewport combinations (320, 390, 430, 740 landscape and 1280 desktop); short-view menus/guides were then rechecked after compact fixes. Two full Slice stages each resolved exactly 20 distinct options before transitioning, and E/Q blade skills worked. Catch skills were exercised through round 5, including locked shortcuts before unlock. Wings fullscreen hangar paused/resumed correctly, and its Booth clock expired while paused. Simulated two-finger aim/move plus net/shield continued firing after lifting only the skill finger. This remains browser QA, not iPhone hardware testing.
