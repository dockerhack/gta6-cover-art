# Vice City Cover Studio — turn your photos into a one-night GTA-style timeline cover

[![Make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/dockerhack/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/dockerhack/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your photos into GTA 6-style multi-panel cover
art. Pick a layout, pick a grade, crop each panel, write your caption — and
export a share-ready PNG.

## The idea: ONE NIGHT IN VICE CITY

The cover is a timeline of one night, hour by hour. Five (or six) photo
panels, each stamped with a time and a place — 8:12 PM at the Neon Pier,
10:47 PM on Palm Row, 12:30 AM on the Strip, 2:05 AM at Marina Lights,
4:40 AM on Rooftop 9 — under one giant gradient **AFTER DARK** title that
overlaps the photos, with the script line *One Night in Vice City* and the
tagline **FIVE SCENES · ONE NIGHT · NO SLEEP** (the count follows the
layout you pick).

## What it does

- **Any photo:** load your own photos from your machine (they never leave
  it). Fill several panels with one photo or several, and crop each panel
  independently — drag to reposition, scroll to zoom.
- **Six layouts:** One Night (5 panels), Mosaic (6 panels), Getaway
  (3 panels), Split (2 panels), Quartet (4 panels) and Hero (1 panel).
- **Four grades:** Vice City After Dark (the signature dark neon night
  grade), Vice Sunset, Poster Ink (halftone print look) and Neon Mono.
- **Editable everything:** every panel's time and place label, the kicker,
  the title, the script line and the tagline — the cover updates live as
  you type.
- **Fast exports:** one click to a PNG in 1080×1080, 1080×1350 or
  1920×1080, or export all three sizes at once.

## Run it offline

The app is plain static files under `app/` — no build step, no network
request. Serve it with any static server:

```sh
node serve.ts
```

then open http://localhost:8080 in desktop Chrome. Or open `app/index.html`
directly from any static file server.

Two sample photos ship under `app/samples/` so you can try it right away.
The fonts (Anton and Pacifico, SIL Open Font License) ship under
`app/fonts/`.

## Screenshots

The three screenshots in `screenshots/` are taken by the app's own
screenshot script (`app/src/shots.js`): the One Night cover, the editor at
work, and the six-panel Mosaic cover in Neon Mono.

## Entry

Built for the make.fun bounty
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).
`main.ts` hands the app in: it copies `app/` and `screenshots/` to the
output directory and writes `dossier.json` with the kit's library.
