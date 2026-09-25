# StatusPill

Product `market_status` as a tinted pill; the word always shows, colour is secondary.

Mapping (built in, from the dataset's `field_notes`): In production → `status-positive` (green) · In service, In service (production ended), Operational → `status-info` (blue) · In development → `status-caution` (amber) · Discontinued, Retired, Historical, Completed mission → `status-neutral` (grey). Override with `tone` only for a status not in that list.

Consumer provides: `status` (the exact dataset string). Use on product cards, the Level 4 title block and the compare table.
