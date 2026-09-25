# Timeline

Vertical timeline with year badges; `highlight` (a year string or index) marks the entry the user came from with the `accent` badge and glow dot.

Accepts `timeline[]` objects (`{year, event}`) or plain strings, so the same component renders a brand's `evolution_milestones` (no year badge).

Consumer provides: `items`, optional `highlight`. For the Level 3 year chips, render `FilterChip`s from the same `timeline[]` and pass the chosen year here on Level 4.
