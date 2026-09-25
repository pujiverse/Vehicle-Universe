# FilterChip

Toggle chip for domain filters, sort options, decades and regions; `aria-pressed` reflects `selected`.

- Pass `domain` ("Land" … "Space") to show the domain dot and, when selected, the `domain-*` / `domain-*-soft` tint. Without it, selected uses `accent` on `surface-300`.
- `count` renders a muted tabular number after the label.

Consumer provides: `children` (label), `selected`, `onClick`, optional `domain`, `count`. Use a row of chips for single- or multi-select filters; for three or more exclusive options with long labels use a select instead.
