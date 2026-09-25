# Button

Actions for the showroom UI; three variants and one small size.

- **primary** (`accent` fill, `on-accent` label): at most one per view — the thing the view is for ("Add to compare", "Open product").
- **secondary** (default, `surface-200` with `border-strong`): Previous / Next, Timeline of transport, Reset view.
- **ghost** (`accent` text): Back, Clear filters, inline actions in dense rows.
- `size="sm"` (32px) for 3D viewer controls and tray actions; default 40px.

Consumer provides: `children` (verb first, sentence case: "Add to compare", not "COMPARE"), `onClick`, any native button props. Icon-only buttons need `aria-label`.
Don't: put Orbitron on buttons, or use `brand-magenta`/`brand-cyan` fills (they are identity colours, not controls).
