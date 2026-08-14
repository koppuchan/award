# ハカセさんぽ 認定ホール

A static HTML/CSS/SVG reproduction of `design.png` (1254 × 1254).

## Structure

```
index.html              the deliverable — single self-contained page
img/                    photos + logo
fonts/                  self-hosted Noto Serif JP glyph subsets
design.png              the reference mock-up
tools/build.mjs         generator that emits index.html
tools/fetch-fonts.mjs   re-downloads fonts/ (run when the copy changes)
tools/sparkles-*.txt    background sparkle coordinates sampled from design.png
tools/cmp.ps1           renders a design-vs-build comparison strip
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

## Scaling and responsive behaviour

Two modes, switched at `MOBILE_BP` (1000px) in `tools/build.mjs`:

- **≥1000px** — the fixed 1254px stage is scaled to the viewport by a small
  inline script (`transform: scale()` + a matching wrapper height), so the
  design stays pixel-proportional to the comp.
- **<1000px** — scaling is switched off and the page reflows into a normal
  document: curtains hidden, cards one per row (two between 640–999px), and
  type sized with `clamp()`. At 390px the scaled canvas would have rendered
  25px text at ~8px, which is why a real reflow is needed rather than
  shrinking further.

Two things to know if you touch the mobile rules:

- `.bg` and `.spark` are absolutely positioned, so `.content` **must** stay
  positioned (`position: relative; z-index: 1`) or they paint over it — and
  it must reset `left`/`top`, since the desktop rule offsets it by 137px.
- `transform: scaleX()` condenses the store names visually but does **not**
  reduce their layout width. On narrow screens the font-size is scaled by the
  same `--sx` factor instead, otherwise the longest name forces the card
  wider than the viewport.

## Back link

The "back to the main site" button under the canvas is driven by `BACK_URL`
at the top of `tools/build.mjs`.

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

Noto Serif JP, **self-hosted** as glyph subsets in `fonts/` — 42KB for all
three weights (400/500/700) versus megabytes for the full Japanese family.
`Yu Mincho` / `Hiragino Mincho ProN` are local fallbacks.

The subsets contain only the characters this page renders. Regenerate after
changing any visible copy:

```bash
node tools/fetch-fonts.mjs   # updates fonts/ and tools/fonts.json
node tools/build.mjs
```

This replaced a Google Fonts `<link>`, which is render-blocking: whenever
`fonts.googleapis.com` was slow to answer, the page painted nothing at all.

## Known limitation: E: drive and git

Git cannot write refs or the index anywhere on the `E:` drive on this machine
— a brand-new `git init` in `E:\anything` fails with `unable to write new
index file` / `couldn't set 'refs/heads/main'`, while the same commands work
on `C:`. Something (most likely real-time antivirus or a filesystem filter
driver) is blocking the unlink/rename that git relies on. Until that is
excluded, commit from a clone on `C:` rather than from `E:\award`.
