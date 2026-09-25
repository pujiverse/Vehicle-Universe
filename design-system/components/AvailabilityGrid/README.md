# AvailabilityGrid

The brand's `availability_by_region` as an 11-cell grid: each cell names the region and states Wide / Limited / None in words, with an `avail-*` top edge and a `status-*-soft` fill.

Colour never carries the meaning alone. A missing region shows "Not in dataset". Pass `order` (the dataset's `meta.regions`) to keep region order stable; add `key_markets_note` as `note`.

Consumer provides: `regions` (object), optional `order`, `note`. Use on Level 3 (brand profile) and Level 4 ("Where it's available").
