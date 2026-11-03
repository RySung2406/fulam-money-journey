# FuLam Wealth Fleet / 富臨財富艦隊

Self-contained bilingual naval arcade game at `site/fleet/index.html`.

## Open-source provenance

Combat components and entity lifecycle, targeting, homing and circle collision
code are adapted from Jerome Lecomte's **SUBmersible WARship 2063**:
https://github.com/herebefrogs/submersible-warship-2063

Upstream revision: `d039f0f1538def12d5d1bb9162e28cb6c1c17984`.
Upstream code: `src/js/game.js`, MIT, copyright 2017 Jerome Lecomte.
The complete licence is retained in `LICENSE.txt` and embedded in the HTML.

This adaptation supplies new canvas artwork, Kenney CC0 sound effects and synthesised accents, direct
keyboard/touch movement, automatic fire, continuous sectors, bosses, a cash
reserve, passive game income, purchasable weapons/escorts/repair/shields, and
Traditional Chinese/English text. Original music, font sprites and visual assets
are not included. Turning and swept collisions were corrected for stable play.

## Build and verify

`python3 sources/fleet/build.py`

`node --test tests/fleet.test.mjs`

Edit `shell.html`, `style.css`, `core.js` and `app.js`, then rebuild. The generated
HTML runs without dependencies or network requests, including directly as a file.

Shared sound, Canvas effects and Lucide icons live in `sources/arcade/`.
`sources/arcade/CREDITS.md` records asset sources and licences. The build embeds
audio and complete licence texts; audio decoding cannot block starting a game.
On portrait phones the workshop pauses battle, and fullscreen includes all
controls and upgrades. Landscape uses a side panel. Sinking finishes with a
short explosion and hull fragments before the result screen.

Physics advances in fixed 1/60 second steps; rendering follows display refresh.
Long stalls have a capped catch-up. Tab hiding and focus loss pause gameplay.
Particle counts and active entities are bounded. No automatic run timeout.

## Data

No accounts, network calls or database writes. Browser storage contains only
`fulam-fleet-best-v1` (one best score, sector, kills, mode and schema version),
`fulam-fleet-sound-v1` (on/off preference), and
the site's shared `fulam-language` choice. No run history, clickstream or video.
Local best scores are editable by the player and are not a verified leaderboard.

## Aircraft candidate researched 2026-11-02

Recommended for a future separate aircraft game: **Skyward Strike**, MIT.
https://github.com/ctbot000/airplane-game
Demo: https://ctbot000.github.io/airplane-game/

README, licence, controls and difficulty code were inspected. It has pure canvas
art and WebAudio sound, five enemy types, upgrades and every fifth wave is a boss.
Its touch input supports dragging; bombs and pause need visible touch buttons in
our adaptation. It uses JavaScript modules and needs a static web server unless
bundled into one HTML file. It has not been integrated into this naval game.

Alternative lightweight legacy base: https://github.com/zaaack/weichat-planewar-js
MIT code, copyright 2014 ZaneYoung. Its imitation-game sprites should be replaced
with original art rather than assumed to have a separate verified provenance.

Sky Troops (https://github.com/dagnelies/skytroops) is another option, but its
README explicitly excludes graphics and sounds from the code's MIT licence.
