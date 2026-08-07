# ハカセさんぽ 認定ホール

A static HTML/CSS/SVG reproduction of `design.png` (1254 × 1254).

## Structure

```
index.html            the deliverable — single self-contained page
img/                  photos + logo
design.png            the reference mock-up
tools/build.mjs       generator that emits index.html
tools/sparkles-*.txt  background sparkle coordinates sampled from design.png
```

`index.html` is committed and is what Vercel serves. It is **generated** — edit
`tools/build.mjs` and re-run the build rather than hand-editing the HTML:

```bash
node tools/build.mjs
```

## How it is built

Everything except the photos and the logo is drawn in CSS/SVG — no image
slices. Geometry was measured off `design.png` pixel by pixel:

| element        | value                                             |
| -------------- | ------------------------------------------------- |
| canvas         | 1254 × 1254                                       |
| outer frame    | 2px gold rule inset 13px, hairline inset 4px more |
| content column | 973px wide starting at x = 137                    |
| card           | 315 × 378, 14px column gap, 15px row gap          |
| card padding   | 11px top / 9px sides / 9px bottom                 |
| photo          | 297 × 199                                         |
| info panel     | 297 × 156                                         |
| tag            | 75 × 35, chamfered corners                        |
| button         | 246 × 50, gold body inset 8px from the outer rule |
| badge          | 78 × 78                                           |

Drawn with SVG: the curtains (silhouette traced from the design, fold
highlights follow `x = u · edge(y)` so they converge at the tie-back and flare
below it), the 認定 medallion, the corner filigree, the header divider and the
button plate.

The 315 background sparkles are real coordinates extracted from `design.png`
rather than random noise.

## Scaling

The page is a fixed 1254px stage that is scaled to the viewport by a small
inline script (`transform: scale()` + a matching wrapper height), so the
layout stays pixel-proportional at any width, including mobile.

## Notes on the assets

`img/` does **not** match the mock-up, and this is deliberate — the files in
`img/` are treated as the current assets and the mock-up as a placeholder
comp:

- Every store photo differs from the one shown in `design.png`.
- `logo01.png` is a different lockup from the one in the comp: it has a solid
  gold disc where the comp shows a laurel wreath, and it is taller than it is
  wide (2476 × 2639) whereas the comp's logo is wider than tall. It is
  therefore fitted to the same vertical band as the comp's logo (top of the
  canvas down to just above the headline) rather than matched on width.

Store names are condensed horizontally (`transform: scaleX()`, per-card `--sx`)
to reproduce the comp, which does the same for longer names. The name and the
prefecture tag are positioned independently rather than in a flex row, because
`scaleX` does not reduce layout width — a long name in a flex row would push
the tag off the card.

## Fonts

Noto Serif JP (Google Fonts), with `Yu Mincho` / `Hiragino Mincho ProN` as
local fallbacks.
