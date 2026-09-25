Pujiverse Transport is the Pujiverse brand applied to a vehicle showroom: every kind of vehicle, from bicycles to rockets, set against the deep space of the Pujiverse logo. It powers the Vehicle Universe site. Dark is the default theme; light is the alternative.

## Content fundamentals

- **Voice:** a knowledgeable museum guide. Plain, factual, short. State what the data says and stop.
- **Honesty over polish.** Never fill a gap. When a value is `null`, say so in `ink-muted`: "Launch price not published", "Not sold new today", "Not in dataset". Prices are labelled as approximate, and changes as "nominal, not inflation-adjusted".
- **Casing:** sentence case for buttons, labels and headings ("Add to compare", "Brand evolution"). Use uppercase only in the `display-*` and `eyebrow` styles, which echo the PUJIVERSE wordmark.
- **Address:** second person, sparingly ("Compare up to 3 products"). Don't use "we".
- **Numbers:** USD with separators on spec sheets (`$22,500`), abbreviated on cards (`$13.3B`, `$78M`). Years are shown as the dataset gives them ("2000s" stays "2000s").
- **No emoji in UI copy.** The dataset's `icon_emoji` is only a last-resort tile fallback.
- **Footer disclaimer (verbatim):** "Data snapshot mid-2026. Prices approximate and converted to USD; launch prices are nominal. Brand names and logos belong to their owners. Informational use only."

## Visual foundations

**Colour.** The identity colours were sampled from the logo: `brand-space` (ground), `brand-haze`, `brand-cyan`, `brand-glow`, `brand-periwinkle`, `brand-magenta`, `brand-violet`. They are the same in both themes. Use them for the logo's surroundings, illustration, the cover and glows, never for text or controls. The UI runs on role tokens:
- Grounds, from back to front: `surface-000` (page), `surface-100` (panels), `surface-200` (cards, inputs), `surface-300` (hover, selected, chip fills).
- Text: `ink` and `ink-muted`, both ≥4.5:1 on every surface in both themes.
- Interaction: `accent` (the logo's cyan, tuned per theme) with `on-accent`. `accent-2` (magenta) is for secondary highlights such as the hovered twin and the compare count.
- Domains each have one accent and a `-soft` ground: `domain-land` amber, `domain-rail` teal, `domain-water` blue, `domain-air` sky, `domain-space` violet. A domain accent tints its tiles, section headers and breadcrumb links. Nothing else.
- Status: `status-positive`, `status-info`, `status-neutral`, `status-caution` and `status-negative`, each with a `-soft` fill. Availability aliases them as `avail-wide`, `avail-limited` and `avail-none`. Always pair a status colour with its word, because hue alone never carries meaning.

**Type.** `Orbitron` (display family) carries the wordmark's techno, wide-set feel. Use it only in `display-xl`, `display-l` and `eyebrow`, always uppercase and tracked. Set everything else in `Space Grotesk` (sans family): `heading-1` to `heading-3`, `body`, `body-small`, `label` and `price`. Prices and counts use `font-variant-numeric: tabular-nums`. Both families are Google Fonts; `components/bundle.css` imports them.

**Space and shape.** Spacing runs on a 4px base, `space-1` to `space-8`. Panels are padded with `space-5`, cards with `space-4`, and domain sections are separated by `space-7`. The mobile side gutter is `space-4`. Radii: `radius-card` (14px) for cards, tiles, panels and the tray; `radius-sm` (8px) for buttons, inputs and grid cells; `radius-pill` for chips, pills, year chips and monogram discs.

**Depth and light.** Surfaces separate by shade and a `border` hairline, not by heavy shadow. On hover a card rises 2px and gains `shadow-lift`. Selected items and hover twins get `shadow-glow`, the orbit halo. The docked compare tray uses `shadow-tray`. Do not use gradients in the UI chrome. The nebula lives in the logo artwork, and the logo image is the only place it appears.

**Motion.** Level transitions are a fade or slide under 250ms. Card lift takes 200ms. The 3D viewer auto-rotates slowly until the user interacts. Under `prefers-reduced-motion`, drop the transitions and the lift.

**Focus.** Every interactive element gets a solid 2px `focus-ring` with a 2px offset: `brand-glow` on dark, `brand-violet` on light. It measures ≥3:1 on every surface.

**Layout.** Split screen with the visual stage on the left (about 58%) and the text navigator on the right (about 42%), both on `surface-100` over `surface-000`. Below 800px the panels stack: the stage on top at about 45vh, the navigator below, and a sticky breadcrumb.

## Logo

- Use `pujiverse-lockup.jpg` (mark plus wordmark) in the site header and on splash or about screens. Use `pujiverse-mark.jpg` (the orbiting P) where space is tight, such as the favicon-scale header on mobile or an avatar.
- The logo is a raster artwork on its own deep-space ground. Place it only on `brand-space` or `surface-000` in the dark theme. In the light theme, put it inside a `brand-space` block with `radius-card`, never floating on a light ground.
- Never recolour, redraw, crop into the ring, or add effects to the logo. There is no vector or single-ink version yet; when a one-colour mark is needed, set "PUJIVERSE" in `display-l` in `brand-violet` (light) or `ink` (dark).

## Third-party brands

Vehicle brand logos are trademarks: never draw or imitate one. Use `MonogramBadge` (the dataset's `logo.monogram` on `logo.monogram_color`) unless `logo.image_url` points to a licensed asset. The same rule applies to 3D models and illustrations: they must be generic, type-recognisable archetypes and never a copy of a specific product's design. Caption every 3D view "Representative 3D model of a {vehicle type}; not an exact replica of {product}."

## Iconography

There is no icon set in the sources. Keep interface icons to simple 2px-stroke line glyphs drawn in `currentColor` (search, back, close, rotate, wireframe), each with an `aria-label` when it stands alone. Vehicle-type illustrations are flat, single-ink SVGs in the domain accent on the domain's `-soft` ground, one per `model_3d_archetype`, all drawn in the same style.

## Components

`Button`, `FilterChip`, `StatusPill`, `ConfidenceBadge`, `MonogramBadge`, `Card`, `AvailabilityGrid`, `Timeline`, `Breadcrumb`, `SearchField`, all exported on `window.Pujiverse` (React 18). The site-level assemblies are built from these: the split panels, compare tray, price block, spec table, 3D viewer and timeline-of-transport strip.
