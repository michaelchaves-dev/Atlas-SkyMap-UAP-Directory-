# Atlas-SkyMap-UAP-Directory-

**ATLAS SkyMap | UAP Register & Directory**

A timestamped, sourced register of anomalous aerial activity — mapped, correlated against satellites, aircraft and space weather, and explained where the evidence explains it.

Public preview — in active development.

## What is live in this preview

- **Sky Map** — every register entry pinned on an interactive map (Leaflet / OpenStreetMap), colour-coded by status.
- **The Register** — 12 seed entries drawn from public records: government-released encounters (Nimitz “Tic Tac”, Gimbal, USS Russell), documented historical cases (Exeter NH, Rendlesham, Phoenix, O’Hare, Stephenville), and explained events that show the correlation work (Starlink train, 2023 balloon).
- **Search & filters** — by text, status (Unresolved / Government released / Mixed evidence / Explained) and source type.
- **Report a sighting** — a report form that adds your entry to your own map as *Pending review*. In this preview reports are saved only in your browser; nothing is transmitted.
- **Directory** — the established reporting channels (AARO, NUFORC, MUFON, Enigma Labs), because ATLAS sits alongside them, not instead of them.
- **Verification method** — timestamp first, then satellite, aircraft/balloon and NOAA space-weather correlation, then an honest label.

## Run it locally

No build step, no dependencies.

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy on Vercel

Static site — import this repository in Vercel with:

- Framework preset: **Other**
- Build command: *(none)*
- Output directory: *(root)*

`vercel.json` is included. A GitHub Pages deploy from the same root also works unchanged.

## Add a register entry

Append an object to `data/sightings.json` with: `id, title, date, location, lat, lng, shape, duration, summary, source_name, source_type, status, correlation`. Status is one of `Unresolved`, `Government released`, `Mixed evidence`, `Explained`. Every entry must name a source, and the correlation note must say what was checked.

## Roadmap

Live satellite (CelesTrak) and NOAA space-weather layers · reviewed public submissions with a moderation queue · Observer / Operator accounts with regional alerts · public camera watch-source catalogue. Detail: `BUILD-PLAN.md`.

<!-- SAS-IP-FOOTER-v1 -->
---
**Subtract Architect Studios™**
Copyright © 2026 Michael F. Chaves. All rights reserved in original Subtract Architect Studios materials except as expressly licensed. See [IP_NOTICE.md](./IP_NOTICE.md). Existing open-source and third-party licenses remain controlling for materials they cover.
