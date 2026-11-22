# Shoppe logo — "Bag stack"

Three stacked tiles (yellow, pink, blue) with a bag handle on the top tile and a lowercase **s**.
The letters are Bricolage Grotesque ExtraBold (wght 800, opsz 96), **converted to outlines**, so
none of these files needs the font installed.

## Files

| File | Use |
|---|---|
| `shoppe-lockup.svg` | Main logo: mark + wordmark, on light backgrounds |
| `shoppe-lockup-on-dark.svg` | Main logo on dark (`#141414`) backgrounds; wordmark in yellow |
| `shoppe-mark.svg` | Mark on its own (header on mobile, avatars, social) |
| `shoppe-mark-on-dark.svg` | Mark on dark backgrounds |
| `shoppe-wordmark.svg` | Wordmark only, for tight horizontal spaces |
| `shoppe-favicon.svg` | Simplified two-layer mark for sizes below 48px → use as `app/icon.svg` |
| `favicon.ico` | 16 / 32 / 48 px, for `public/favicon.ico` |
| `app-icon.svg`, `app-icon-maskable.svg` | Sources for the app icons |
| `png/icon-192x192.png`, `png/icon-512x512.png` | PWA icons → `public/icons/` |
| `png/icon-maskable-192x192.png`, `png/icon-maskable-512x512.png` | Maskable PWA icons (mark stays inside the safe zone) → `public/icons/` |
| `png/apple-touch-icon.png` | 180 px iOS home-screen icon |
| `png/*-1024.png`, `png/*-2000w.png` | Transparent high-res masters for documents and social |

## Colours

| Name | Hex |
|---|---|
| Danfo yellow (top tile) | `#FFC400` |
| Hot pink (middle tile) | `#FF4FA3` |
| Electric blue (back tile) | `#2F5BFF` |
| Ink (outlines, letters) | `#141414` |
| Paper (outlines on dark) | `#FAF7F0` |

## Rules

- **Minimum size:** full mark 24 px tall; below that use `shoppe-favicon.svg` (two layers).
- **Clear space:** keep at least the height of the bag handle free on every side.
- **Don't** recolour the tiles individually, rotate the mark, add shadows/gradients, or re-type the
  wordmark in another font.
- On busy photos, place the logo on a paper or ink panel rather than directly on the image.
