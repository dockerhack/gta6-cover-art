# After Dark — Vice City Cover Studio
[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/dockerhack/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/dockerhack/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photos into GTA 6-style cover art — **ONE NIGHT IN VICE CITY**: a
timeline of one night in five (or six) panels, each stamped with a time and a
place, under a giant gradient **AFTER DARK** title that overlaps the photos.
Deep blue/teal shadows, magenta neon glow, a dark vignette — the panels read
as night, not dusk. Pick a layout, pick a grade, crop each panel, write the
caption, export a PNG.

Runs entirely offline in desktop Chrome. Your photos never leave your machine.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

1. Load up to three photos (or use the sample photos).
2. Pick a layout: **One Night** (5 panels, the default), **Night Drive** (4),
   **The Crew** (4), **Getaway** (3), **City Strips** (5), **Mosaic** (6).
3. Pick a grade: **After Dark** (night neon), **Vice Sunset**, **Poster Ink**,
   **Neon Mono**.
4. Write the kicker, title, script subtitle, tagline, and badge — the title
   overlaps the photos along their bottom third.
5. Click a panel to select it; drag it to crop, scroll to zoom; set its
   **time** and **place** label, or change which photo it shows.
6. Export PNG in **1080 × 1080**, **1080 × 1350**, or **1920 × 1080**.

## The cover, v2

The default layout is the **one night** timeline: five scenes across a
single night — 8:12 PM **NEON PIER**, 10:47 PM **PALM ROW**, 12:30 AM **THE
STRIP**, 2:05 AM **MARINA LIGHTS**, 4:40 AM **ROOFTOP 9** (the six-panel
Mosaic adds 5:55 AM **MIDNIGHT FERRY**). Every panel shows a different crop of the
photos — no two panels are the same crop of the same photo. The title is
drawn over the photos, and the night grade darkens the shadows and deepens
the teal and magenta so a day beach shot reads as after dark. All panel
labels, captions, and place names are original.

## Entry

This repository is an entry for the **gta6-cover-art-01** bounty on make.fun.

- `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
  to `/output` and writes `dossier.json` — run it with
  `MAKEFUN_OUTPUT_DIR=out node main.ts`. It is deterministic: two runs
  produce byte-identical output.
- `app/` is the whole web app: plain HTML/CSS/ES modules, no dependencies,
  no network. `app/fonts/` holds the two OFL fonts it uses: **Anton** for the
  display type and **Pacifico** for the neon script (OFL texts beside the
  fonts). Everything — titles, places, taglines, layout — is original.
- `screenshots/` holds the judged images: `1-cover.jpg` (the one-night
  timeline cover, 1920 × 1080), `2-editor.jpg` (the editor with a photo
  loaded), `3-cover.jpg` (a second cover, square, Neon Mono grade, Mosaic
  layout).

Nothing here is affiliated with Rockstar Games, and nothing in it uses a
Rockstar logo, artwork, or font.

## License

MIT — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
