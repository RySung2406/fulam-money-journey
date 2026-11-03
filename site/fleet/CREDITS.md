# FuLam Catch & Wealth Fleet — audio and interface credits

Selected and verified 2026-11-04. Assets are bundled in each game; there are no runtime CDN requests.

| Material | Author / source | Licence | Use |
| --- | --- | --- | --- |
| Sci-Fi Sounds 1.0 | [Kenney](https://kenney.nl/assets/sci-fi-sounds) | CC0-1.0 | Cannon, metal hit, shield, explosions and sinking |
| Impact Sounds 1.0 | [Kenney](https://kenney.nl/assets/impact-sounds) | CC0-1.0 | Glass / crystal break and freeze |
| RPG Audio | [Kenney](https://kenney.nl/assets/rpg-audio) | CC0-1.0 | Coins and cloth / net deployment |
| Selected SVG icons | [Lucide](https://github.com/lucide-icons/lucide) | ISC; inherited Feather icons MIT | Skills, ship, wallet, repair, fullscreen and workshop |

The Kenney download service did not supply an archive in this environment. The selected audio was obtained from the [assets-sfx-combat mirror](https://github.com/GeorgeQLe/assets-sfx-combat), which retains the original pack licence files. Licence terms were cross-checked on the original author's asset pages. `assets.json` maps every selected file to its source and SHA-256 checksum. Files were trimmed, faded out, converted to mono 44.1 kHz MP3 at 80 kbps; gain, pitch and polyphony are controlled in-game. Licence texts are retained in `sources/arcade/licenses/` and embedded in both games' credits.

Kenney Particle Pack and UI Pack were considered; their textures were not incorporated. Effects are new Canvas code matched to FuLam's existing art: bubbles, sparks, radial light, smoke, shockwaves and rotating hull/crystal fragments. No external VFX engine is required. Reduced-motion mode reduces particles and removes camera shake.

Audio decoding is optional and non-blocking, with synthesised fallback cues. Distinct synthesised musical accents are used for boss arrival, low armour, rapid fire, lure, upgrades and completion. No music or recordings from the original fishing/naval projects are used.

The existing gameplay attributions remain: Fishing Joy formations (MIT) and SUBmersible WARship 2063 combat core (MIT). Third-party assets retain their own licences.
