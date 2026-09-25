# Card

The tile and card surface: `surface-200`, `border` hairline, `radius-card` (14px), hover lift (`shadow-lift`, −2px) and selected orbit glow (`shadow-glow`).

- `domain` tints the media well (`domain-*-soft`), the badge and the hover/selected border with that domain's accent.
- Slots: `media` (SVG illustration, 3D snapshot, monogram), `title`, `badge` ("8 brands", price), `meta` (category, founded · HQ), `children` (status pill, price line).
- With `onClick` it renders a `<button>`, with `href` an `<a>`; otherwise a static `<div>`.

Consumer provides: the content slots and the handler. Media illustrations are flat, single-ink SVG in `currentColor` (the domain accent), one per `model_3d_archetype`; `icon_emoji` on the tinted well is the fallback only. Hover-twin highlighting: set `selected` on the card whose twin row is hovered.
