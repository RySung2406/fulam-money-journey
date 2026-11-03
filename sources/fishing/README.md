# FuLam Catch source

Edit the shell, gameplay and Canvas art here. Rebuild the self-contained public HTML with:

```sh
python3 sources/fishing/build.py
npm run check
npm test
```

The site needs no external assets or network requests for this game. Six skills, twelve weapon levels and ten fish types run locally; only sound preferences and personal best scores are saved to browser localStorage. There are no database writes.

`formations.js` includes fish-school arrangements adapted from imtonyjaa/ggemu-fishing-joy under the included MIT licence. Remaining gameplay and Canvas artwork are created for FuLam.

`compact.css` keeps six skills visible below the water on portrait phones and
in a side panel in landscape; fullscreen contains the complete console.
`sources/arcade/` provides Kenney CC0 sound effects, Lucide icons and original
Canvas bursts, bubbles and crystal fragments. See its `CREDITS.md` for full
provenance. The build embeds audio and licences, without runtime asset downloads.
Audio failure falls back to synthesised cues and does not prevent gameplay.
