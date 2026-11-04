# FuLam arcade and Booth — v6 survival choices and taller welcome

Latest Catch/Wings controls and balance: [four-round combat update](combat-balance-2026-11-04.md).
The historical rules below are superseded where that update and the later four-round notes differ.

Requested by Ryan on 2026-11-04. Updated after Ryan’s feedback on cumulative weapon upgrades, enemy pressure, clearer Slice abilities and meaningful round scenes. Three high-score games share two public difficulties (Standard and Challenge) and a separate Booth preset. `/booth/` links to each activity. `/fleet/` remains compatible with existing links and now hosts Wealth Wings, an aircraft shooter.

## Rules and storage

- Web runs have no total time limit. Catch and Wings offer an twelve-second upgrade choice every 30 active seconds. One Slice offers it after all 20 choices in a stage have been resolved, rather than on a timer. Catch and Wings offer five choices: fire rate, weapon evolution, projectile coverage, energy/armour capacity, or protection. Slice offers four: blade score, Focus duration, a consumable mistake guard, or extra heart capacity. Weapon/blade evolution is applied after twelve seconds without a selection. Combat pauses during choices.
- Booth fixes an intermediate difficulty between Standard and Challenge, with a reproducible seed. It ends at 180 elapsed seconds after starting, including pauses, intermissions and time spent away from the page. The visual result appears on the next animation frame after a hidden page returns. Defeat can finish earlier.
- There is no weapon switching. Rate, weapon and trajectory levels accumulate independently for the current run. Catch and Wings have twelve named evolution stages, with further stat upgrades beyond stage twelve. One Slice has one evolving blade, a charged Focus skill and explicit single-use guard charges. A new run resets all upgrades.
- Catch drains energy, replenishes it on catches, and ends at zero. All six skills are visible and independently touchable while firing. Net and freeze start unlocked; rapid fire, double coins, bomb and lure unlock in rounds 2, 3, 4 and 5. Buttons show shortcuts and cooldowns.
- Wings uses time-based rounds, a boss every third round and a wider second-phase boss pattern. Cash workshop upgrades, shield reserves and paid repairs coexist with free round choices. Paid weapon strength is retained across later free upgrades.
- One Slice starts at the first topic, in both modes. Every stage draws its 20 existing choices once (10 correct, 10 decoys); five topics rotate in order. English and Chinese have matching option IDs. Answer text is 17px on phones and 18px on desktop. One Slice starts with five hearts on Standard, four in Booth and three on Challenge. Wrong cuts cost one heart. Five missed correct targets on Standard, four in Booth, or three on Challenge also cost one heart. Recovery is capped at the initial heart count. Topics change only between rounds; old targets are removed first. Each blade upgrade adds 25% of the original correct-score reward. Focus is available from the start: correct cuts charge it, and each Focus upgrade extends its duration by 0.6 seconds and increases charging. Each guard choice restores one heart (up to the mode cap) and grants one consumable charge that blocks one wrong-cut heart loss; wrong answers still lose points and do not count as correct.
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

The shared source is `sources/arcade/journey.js` and `journey.css`. Builds embed both into the two Canvas games and copy them into `site/arcade` for One Slice. The original gameplay cores retain their fallback rules when the progression runtime is absent; old regression suites cover these paths. `tests/journey.test.mjs` covers the new clocks, upgrade lifecycle, projectile evolution, late-stage enemy pressure, scene assets, storage partitions and aircraft changes. Browser checks exercise the assembled pages.

## Browser verification

The mounted Browser was used for actual UI starts, selections, pause/finish/restart flows and fullscreen controls. Its virtual clock accelerated ordinary animation frames for round transitions and the Booth deadline; no gameplay mutation API was shipped.

Checked Chinese and English at 320×568, 390×844, 740×320 and 1280×900. Both Canvas games support an aiming/movement finger plus a separate skill finger, including releasing only the skill finger. Fishing intermissions and aircraft workshop controls remain inside fullscreen. Each Booth activity expires through pause and resets the next player's score/loadout. This is browser simulation, not an iPhone hardware or speaker listening test.

Balance is an initial playable version. Real booth play is needed to tune late-run difficulty, average session length and reading time. Sound assets are the existing licensed Kenney selection, with original vector aircraft, clouds and interface additions.

## Previous v3 interface (historical; switching superseded in v5)

- Every new run opens a controls guide; the run and Booth clock start only on its Start button. In short views, instructions scroll inside the card while Start and Back remain visible.
- Standard and Challenge are two distinct cards. Booth is a separate violet button; selecting a public difficulty exits Booth selection.
- Catch and Wings expand their battlefield during play. All exits are solid red, including in-game End and result/menu Back controls.
- Wings puts the paid hangar inside the playing surface; it pauses combat and works in fullscreen. Keyboard 1–4 retains direct purchases.
- Slice uses E to switch blades, Q for charged Focus, P to pause; mouse, touch and keyboard target activation remain supported.
- Records use `booth-v3` because the option pool and available skills changed. Older records are retained under their own keys. QR SVGs and their hashes were refreshed to the new public entry version.

The v3 revision passed 120 repository tests and syntax/bundle checks. Mounted Browser checks covered 30 Chinese/English/game/viewport combinations (320, 390, 430, 740 landscape and 1280 desktop); short-view menus/guides were then rechecked after compact fixes. Two full Slice stages each resolved exactly 20 distinct options before transitioning, and E/Q blade skills worked. Catch skills were exercised through round 5, including locked shortcuts before unlock. Wings fullscreen hangar paused/resumed correctly, and its Booth clock expired while paused. Simulated two-finger aim/move plus net/shield continued firing after lifting only the skill finger. This remains browser QA, not iPhone hardware testing.

## v4 balance and readability (preserved base settings)

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


## v5 evolution, pressure and scenes (v6 extends these choices)

Requested by Ryan on 2026-11-04: upgrade weapons instead of switching them; retain fire-rate and trajectory choices; more visible stages; enemies must grow alongside the player; explain Slice upgrades; give round backgrounds a purpose.

- Catch and Wings evolve through single/twin guns, piercing, heavy piercing, plasma, burst plasma, beam/laser, focused beam, homing, cluster, arc and aurora stages. Colour, projectile form, piercing, blast, tracking and chaining change with milestones. Each upgrade is retained for the current run. Rate and spread still increase damage after their visual/performance limits are reached.
- Three upgrade cards show before/after bursts per second, total direct damage per burst, or projectile count. Total burst damage assumes every projectile hits; it excludes extra blast, chain and piercing hits. It is not an enemy-specific damage-per-second guarantee. Number keys 1-3 select only the round upgrade and do not also spend hangar cash or trigger a skill.
- Paused upgrade cards cover the viewport, including fullscreen. Their battlefield is raised above neighbouring controls to keep every choice reachable. The narrow Slice footer gives Focus its own full-width grid cell without clipping.
- Each round restores 12 energy/armour to the two combat games. Enemy health, movement, density and projectile speed rise; elites begin at round three, and bosses arrive every third round with an additional health factor and wider second-phase patterns. Round transitions clear remaining enemies. Surviving a boss round does not imply the boss was defeated.
- Slice keeps its sequential five-topic cycle and twenty distinct choices per stage. Blade score and Focus duration are lasting upgrades for the current run; guard charges are consumed. The guide, HUD and choice card explain these differences. No questionnaire or assessment items were changed.
- Fifteen original SVG backgrounds provide five scenes per game: harbour/islands/storm/ruins/dawn, bay/islands/storm/city/dawn, and workshop/garden/lighthouse/bridge/observatory. Palettes, silhouettes and scenery change each round and repeat every five rounds. Short transitions connect tools, diversification, reserves, opportunity cost and checking information to the game choices. The asset source and published copies are built together; existing Kenney audio and licensed icons are reused.
- Score and QR entry versions are `booth-v5`. Earlier scores remain stored under their original keys.

### Balancing model and limits

Let `w`, `r`, `t` be the number of weapon, rate and trajectory upgrades, and `n = round - 1`. These are dimensionless counts.

- Base direct damage in points: `d0 * (1 + 0.35w + 0.04w^2)`, where `d0` is 1.8 for Catch and 16 for Wings. Extra damage is applied after rate 18 and trajectory 5 so capped visual upgrades remain useful.
- Firing interval in seconds: `interval0 / (1 + 0.18 * min(18, r))`, with `interval0` 0.22 for Catch and 0.20 for Wings. Projectile count caps at seven. Two lanes deal 65% each; later extra lanes deal 55% of the central shot. Piercing, splash and homing are additional effects.
- Shared enemy health multiplier: `1 + 0.22n + 0.035n^2`, multiplied by each game's base and difficulty rules. Bosses additionally use `2 + 0.15 * round`; elites receive 1.6 times ordinary health.
- Shared movement multiplier: `1 + min(0.6, 0.045n)`; density: `1 + min(1.4, 0.09n)`; hostile projectile speed: `1 + min(0.6, 0.035n)`. Limits keep movement readable; health continues growing.

These are initial balancing parameters, not evidence of human completion difficulty. Automated tests check increasing strength and boss durability with explicit ideal-hit assumptions. Skilled aiming, splash, paid upgrades, missed shots and player choices alter actual outcomes. Real booth participants are still needed to tune the difficulty curve.

### v5 verification

126 repository tests passed, including real emitted projectiles across all twelve stages, accumulation beyond visual caps, intermediate Booth ordering, clocks and boss pressure. Actual mounted-Browser inputs completed eleven Catch upgrade choices to round twelve and all three Wings choices to round four. Three Slice stages each resolved exactly twenty choices; the next stage verified an unchanged heart count but a 150-point deduction on a guarded wrong cut, and upgraded Focus lasted approximately 3.1 seconds. These checks used accelerated ordinary animation frames and read-only telemetry, with no production gameplay mutation interface.

Thirty Chinese/English game/viewport combinations were checked at 320x568, 390x844, 430x932, 740x320 and 1280x900. The narrow Focus clipping was fixed and rechecked in both languages. Upgrade cards were separately tested in short portrait and landscape views: all three buttons fit and receive input without another control covering them. Wings upgrades and hangar operate inside fullscreen; keyboard choices do not purchase paid upgrades accidentally. All three Booth games expired through pause and restarted with zero score and reset upgrades. No JavaScript errors were reported in the final browser checks. This remains browser QA, not an iPhone hardware or participant balancing test.


## v6 taller welcome and survival choices

Requested by Ryan on 2026-11-04 after a screenshot showed the Catch welcome card clipped inside a short sea. The welcome sea now grows with its card, without nested scrolling. Wide, short displays use two columns; portrait displays keep the introduction visible. The duplicate in-card language button is hidden when the header language button is available. Active combat keeps its existing full-height layout.

Catch and Wings show all five options every round; Slice shows all four. Only one can be chosen. Attack upgrades remain cumulative. The selection window is twelve seconds, with automatic weapon evolution on timeout; Booth's 180-second wall clock still includes this window. Green capacity and violet protection cards show their numeric effects. Keyboard 1-5 works in the choice dialog and does not activate combat shortcuts.

- Catch capacity: +20 maximum energy per level, plus 35 extra energy on selection. The usual 12-point round refill still applies, capped at the new maximum. Catches also respect the new maximum; the percentage gauge uses the new capacity as its denominator.
- Wings capacity: +20 maximum armour per level, plus 35 extra armour on selection, in addition to the usual 12-point round refill. Paid repairs respect the raised maximum.
- Protection uses `multiplier = 1 / (1 + 0.15 * level)` for Catch energy consumption and Wings incoming damage. Level one reduces consumption/damage by approximately 13%. Protection does not increase attack strength or reset other upgrades. Wings shield duration gains `min(2, 0.4 * level)` seconds; the duration bonus is bounded to avoid a permanently active shield.
- Slice life adds one to the heart limit and restores two hearts up to that limit. Guard still adds one consumable charge and restores one heart. Guard blocks only wrong-cut heart loss; it does not make an incorrect answer correct or cancel its score penalty. The missed-answer threshold remains the original mode threshold, independently of extra hearts.
- All capacity/protection levels reset for the next player. Initial Booth values remain between the two public difficulties. v6 record keys separate the new scores, and QR links use `booth-v6`.

Mounted-Browser checks confirmed the welcome intro and Start button are visible without internal scrolling in both languages at 320x568, 390x844, 1280x720 and 1440x900, plus wide and short-landscape checks. All five upgrade buttons were reachable and unclipped at 320/390 phone widths and 640x360/740x320 landscape, including Wings fullscreen. Actual choices raised Catch capacity to 120, Wings Booth armour from 88 to 108, and Slice Booth hearts from 4 to 5. A protected 12-point aircraft hit removed about 10.435 armour; its shield lasted 3.2 seconds. A guarded wrong Slice answer still deducted 150 points without losing a heart. These are browser simulations, not iPhone hardware or human balance tests.

Validation: 130 repository tests, syntax checks, bundles and whitespace checks passed. New tests exercise real energy drain/refills, projectile damage, shield duration, capacity/repair caps and survival-upgrade reset.
