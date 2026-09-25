# MonogramBadge

Stand-in for a third-party brand logo: `logo.monogram` on a disc of `logo.monogram_color`, name underneath.

- Brand logos are trademarks: never draw or imitate one. If `logo.image_url` is set (an asset you are licensed to use), pass it as `imageUrl` and the image replaces the disc.
- The letter colour is picked automatically (white or `brand-space`, whichever contrasts more with the disc), because the dataset's 42%-lightness yellows and greens fail with white.
- Sizes: 64 (default, Level 2 cards), 48 (lists), 40 (inline). Set `showName={false}` when the name sits elsewhere.

Consumer provides: `name`, `monogram`, `color`, optional `imageUrl`, `size`, `showName`.
