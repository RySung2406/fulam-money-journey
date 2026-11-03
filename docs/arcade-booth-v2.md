# FuLam arcade and Booth — v4 intermediate balance

Requested by Ryan on 2026-11-04. Updated after Ryan’s 2026-11-04 feedback on play area, onboarding, controls, modes and answer size. Three high-score games share two public difficulties (Standard and Challenge) and a separate Booth preset. `/booth/` links to each activity. `/fleet/` remains compatible with existing links and now hosts Wealth Wings, an aircraft shooter.

## Rules and storage

- Web runs have no total time limit. Catch and Wings offer an eight-second upgrade choice every 30 active seconds. One Slice offers it after all 20 choices in a stage have been resolved, rather than on a timer. The choices are power, the next weapon, or support; power is applied after eight seconds without a selection. Combat pauses during choices.
- Booth fixes an intermediate difficulty between Standard and Challenge, with a reproducible seed. It ends at 180 elapsed seconds after starting, including pauses, intermissions and time spent away from the page. The visual result appears on the next animation frame after a hidden page returns. Defeat can finish earlier.
- Common upgrade strength survives weapon switches. Switching has a three-second cooldown. One Slice has three blades; Catch and Wings each have four weapon families.
- Catch drains energy, replenishes it on catches, and ends at zero. All six skills are visible and independently touchable while firing. Net and freeze start unlocked; rapid fire, double coins, bomb and lure unlock in rounds 2, 3, 4 and 5. Buttons show shortcuts and cooldowns.
- Wings uses time-based rounds, a boss every third round and a wider second-phase boss pattern. Cash workshop upgrades, shield reserves and paid repairs coexist with free round choices. Paid weapon strength is retained across later free upgrades.
- One Slice starts at the first topic, in both modes. Every stage draws its 20 existing choices once (10 correct, 10 decoys); five topics rotate in order. English and Chinese have matching option IDs. Answer text is 17px on phones and 18px on desktop. One Slice starts with five hearts on Standard, four in Booth and three on Challenge. Wrong cuts cost one heart. Five missed correct targets on Standard, four in Booth, or three on Challenge also cost one heart. Recovery is capped at the initial heart count. Topics change only between rounds; old targets are removed first. Precision changes the hit area; Combo increases correct-score rewards; Focus charges a manual slow-time skill.
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

## v4 balance and readability

Ryan requested slightly larger bags/numbers and a Booth difficulty between the two public choices. There is still no third public difficulty button. Booth menus, guides and status bars identify the intermediate preset.

| Initial parameter | Standard | Booth | Challenge |
| --- | ---: | ---: | ---: |
| Slice hearts / misses per lost heart | 5 | 4 | 3 |
| Slice flight duration, seconds | 4.8–6.2 | 3.8–4.8 | 3–3.8 |
| Catch fish speed multiplier | 1.05 | 1.2 | 1.35 |
| Catch fish health multiplier | 1.15 | 1.375 | 1.6 |
| Catch spawn interval, seconds | 1.35 | 1.2 | 1.05 |
| Catch energy drain, points/second | 0.85 | 1.05 | 1.25 |
| Wings initial/max armour, points | 100 | 88 | 75 |
| Wings enemy health/speed and spawn-frequency multiplier | 1 | 1.1 | 1.2 |
| Wings bullet speed multiplier | 1 | 1.08 | 1.16 |

The existing round-based growth is applied on top of these base values. Integer enemy health is rounded after multiplication. Wings armour rounds the 87.5-point midpoint to 88. Slice reuses the existing medium timing profile. Standard and Challenge balance values are unchanged.

Phone bag art grew from 100px to 112px wide; answer cards from 138px to 148px (140px on screens below 351px). Short landscape art grew from 65px to 72px. Phone score grew from 25px to 28px and the countdown from 20px to 23px. Launch selection samples more of the flight and measures rectangular label separation to reduce covering text. Records and QR entry links use `booth-v4`; prior records remain under their old keys.

Validation: 122 repository tests and syntax/bundle checks passed. Mounted Browser checks covered 24 game/language/viewport combinations at 320×568, 390×844, 740×320 and 1280×900: no horizontal overflow, clipped active labels or inaccessible exit/start controls. Actual mode starts confirmed 5/4/3 hearts, 100/88/75 armour, and ten-second idle Catch energy of about 91.5/89.5/87.5. Slice completed two 20-choice stages, lost one heart after four deliberate misses, and recovered to a cap of four. Both Canvas games advanced to round two, applied power and a weapon swap, and activated net/shield. All three Booth games expired at 180 seconds through pause and restarted with reset score/loadout. Balance still needs real participant play; these are browser checks, not iPhone hardware testing.
