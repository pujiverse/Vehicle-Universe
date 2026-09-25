# Vehicle Universe

**Vehicle Universe by Pujiverse** lets you explore every kind of vehicle, from bicycles to rockets: 57 vehicle types, 3,400+ brands and 59,000+ models. It has brand histories, specs, timelines, websites and credited photos.

It is built on the **Pujiverse Transport** design system (see `design-system/`).

## Run it

It is a static site with no build step needed to view it. Serve the folder over HTTP, because the page loads its data with `fetch`, which does not work from `file://`:

```bash
python3 -m http.server 8000
# open http://localhost:8000/#/
```

GitHub Pages works as-is: enable Pages for the `main` branch, root folder. `.nojekyll` is included.

## Layout

| Path | What |
| --- | --- |
| `index.html` | The site. React 18 (cdnjs), the Pujiverse components and the app are inlined. |
| `data/core.json` | Vehicle types (with stats), brands (profiles, websites, social channels) |
| `data/p/VTxx.json` | Every model for one vehicle type, loaded on demand |
| `data/search.json` | Compact search index (id, name, brand, type) |
| `data/tiles.json` | One photo per vehicle type for the home tiles |
| `img/*.json` | Product photos (WebP data URIs) in chunks, loaded on demand |
| `src/` | Readable sources: `app.js`, `app.css`, Pujiverse component bundle |
| `design-system/` | Pujiverse Transport tokens, brand book and component guidelines |
| `pipeline/` | Python scripts used to build the catalogue (Wikidata via QLever, spreadsheets, Commons photos). They use absolute scratch paths from the original build machine; adjust before re-running. |

Routes use the URL hash: `#/`, `#/type/VT08`, `#/type/VT08/brand/B026`, `#/type/VT08/brand/B026/product/P0041` and `#/brand/B026` (every model of one brand).

## Data sources and credits

- **Curated records (295 models):** the original Vehicle Universe dataset, with approximate prices converted to USD. Launch prices are nominal.
- **Model catalogue:** [Wikidata](https://www.wikidata.org) (CC0) and the owner's *Vehicle Brands & Models* spreadsheets, which are also a Wikidata export. Individual vessels, locomotives and museum exhibits are included where Wikidata records them. Prices and sale status are rarely recorded, and the site says so instead of guessing.
- **Photos:** [Wikimedia Commons](https://commons.wikimedia.org), each under its own free licence (mostly CC BY / CC BY-SA). The author and licence are shown with each photo, and each photo links to its Commons file page. Keep those credits if you reuse the images.
- **Brand logos** are trademarks and are not reproduced. Brands are shown as generated monograms, and the monogram colours are not brand colours.
- **Brand websites** come from Wikidata. Newsroom, investor and careers links were found by checking each official site.

Informational use only. Data snapshot: September 2026.
