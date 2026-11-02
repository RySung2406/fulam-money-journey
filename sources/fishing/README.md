# FuLam Catch source

Edit the shell, gameplay and Canvas art here. Rebuild the self-contained public HTML with:

```sh
python3 sources/fishing/build.py
npm run check
npm test
```

The site needs no external assets or network requests for this game. Six skills, twelve weapon levels and ten fish types run locally; only sound preferences and personal best scores are saved to browser localStorage. There are no database writes.

`formations.js` includes fish-school arrangements adapted from imtonyjaa/ggemu-fishing-joy under the included MIT licence. All other gameplay and artwork are created for FuLam.
