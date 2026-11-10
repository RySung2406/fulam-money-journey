# FuLam One Slice — open-source credits

The launch-angle helper and the independent continuous-spawn clock are adapted from
[an1kens/fruit-blade](https://github.com/an1kens/fruit-blade), pinned to commit
[`b1543f3ca02f477741e6a976815cf7198c881ad2`](https://github.com/an1kens/fruit-blade/tree/b1543f3ca02f477741e6a976815cf7198c881ad2).

Copyright (c) 2026 an1kens. MIT License. The complete upstream notice is included in
[fruit-blade-LICENSE.txt](./fruit-blade-LICENSE.txt).

Source references:
- `js/physics/Physics.js`: `pickLaunchAngle` and `randomLaunchParams`.
- `js/engine/WaveManager.js`: independent `spawnTimer` update with wave breaks disabled.

Modified for FuLam One Slice: injectable randomness, normalized safe screen bounds,
frame-rate-independent analytic arcs, randomized continuous spawn intervals, bounded
active targets, shuffled topic decks and per-appearance scoring. FuLam retains its own
money-bag SVG artwork, interface, question content and swipe collision handling. No
upstream fruit images, camera tracking or other assets are bundled.

## Audio (2026-11-10)

Correct cuts keep the original synthesised metallic coin. Combos pitch that coin up and may
layer a short Kenney CC0 sparkle. Slice / miss / whoosh use optional Kenney samples under
[`audio/`](./audio/README.md) (Impact / Sci-Fi / RPG), prepared with the Catch / Wings set.
Decode failures fall back to synthesised cues. No background music is bundled.
