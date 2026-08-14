// Generates ../index.html — a rebuild of design.png (1254 x 1254) in HTML/CSS/SVG.
//
//   node tools/build.mjs          normal build
//   CAL=1 node tools/build.mjs    calibration build (names rendered uncondensed,
//                                 so their natural widths can be measured)
import fs from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const ROOT = path.join(HERE, '..');
const D = 1254; // design canvas

/* ---- edit me -------------------------------------------------------- *
 * Where the "back to the main site" button points. Set this to the
 * WordPress page this sub-directory was linked from.
 */
const BACK_URL = 'https://uraken0915.com/';
const BACK_LABEL = '元のページへ戻る';

/* Below this viewport width the fixed 1254px canvas is abandoned and the
 * page reflows into a single readable column. Above it, the canvas is
 * scaled to fit as before. */
const MOBILE_BP = 1000;

const r2 = (n) => Math.round(n * 100) / 100;

function sampler(pts) {
  return (y) => {
    if (y <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (y <= pts[i][0]) {
        const [y0, x0] = pts[i - 1];
        const [y1, x1] = pts[i];
        return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
      }
    }
    return pts.at(-1)[1];
  };
}

/* ============================ curtain ============================ */
const CURTAIN_EDGE = [
  [0, 251], [16, 246], [40, 242], [64, 232], [88, 224], [112, 214],
  [136, 203], [160, 191], [184, 178], [208, 162], [232, 145], [256, 123],
  [268, 111], [280, 97], [292, 81], [304, 73], [316, 72], [328, 74],
  [340, 77], [364, 82], [400, 86], [460, 92], [520, 97], [580, 101],
  [640, 105], [700, 107], [760, 110], [820, 112], [880, 115], [925, 117],
  // the drape keeps its width and simply dissolves into the black floor,
  // still faintly visible around y = 1060 and gone by ~1090
  [960, 118], [1000, 118], [1040, 116], [1070, 112], [1090, 104],
];
const edgeAt = sampler(CURTAIN_EDGE);
const CURTAIN_BOTTOM = 1090;

/** Fold highlights run along x = u * edge(y), so they converge at the
 *  tie-back pinch and flare out again below it, like real gathered fabric.
 *  u, stroke width, colour stop and opacity are jittered per fold. */
const FOLDS = [
  [0.075, 1.4, 0.22], [0.12, 1.0, 0.14], [0.165, 1.8, 0.30], [0.21, 1.1, 0.16],
  [0.255, 2.0, 0.36], [0.30, 1.2, 0.18], [0.345, 2.2, 0.44], [0.39, 1.1, 0.17],
  [0.435, 2.4, 0.50], [0.48, 1.3, 0.20], [0.525, 2.6, 0.58], [0.57, 1.2, 0.19],
  [0.615, 2.8, 0.64], [0.66, 1.4, 0.22], [0.705, 2.6, 0.56], [0.75, 1.3, 0.20],
  [0.795, 3.0, 0.70], [0.84, 1.5, 0.24], [0.885, 2.8, 0.62], [0.93, 1.6, 0.26],
  [0.965, 2.4, 0.50],
];

function foldLines() {
  const ys = [];
  for (let y = 0; y <= CURTAIN_BOTTOM; y += 26) ys.push(y);
  ys.push(CURTAIN_BOTTOM);
  let out = '';
  for (const [u, w, op] of FOLDS) {
    let d = '';
    for (const y of ys) d += (d ? 'L' : 'M') + `${r2(u * edgeAt(y))} ${y}`;
    out += `<path d="${d}" fill="none" stroke="url(#foldHi)" stroke-width="${w}" opacity="${op}"/>`;
  }
  return out;
}

function curtainOutline() {
  let d = 'M0 0';
  for (const [y, x] of CURTAIN_EDGE) d += `L${r2(x)} ${y}`;
  return d + `L0 ${CURTAIN_BOTTOM}Z`;
}

function braidPath() {
  let d = '';
  for (let y = -4; y <= 292; y += 8) d += (d ? 'L' : 'M') + `${r2(edgeAt(Math.max(0, y)) - 4.8)} ${y}`;
  return d;
}

const CURTAIN_BODY = `
  <g clip-path="url(#cclip)">
    <path d="${curtainOutline()}" fill="url(#cloth)"/>
    <g filter="url(#soft)">${foldLines()}</g>
    <rect x="0" y="0" width="260" height="${CURTAIN_BOTTOM}" fill="url(#cshade)"/>
    <rect x="0" y="0" width="260" height="${CURTAIN_BOTTOM}" fill="url(#cfade)"/>
  </g>
  <path d="${braidPath()}" fill="none" stroke="url(#braid)" stroke-width="9.5" stroke-linecap="round"/>
  <path d="${braidPath()}" fill="none" stroke="rgba(255,246,206,.45)" stroke-width="2"
    stroke-dasharray="2 5" stroke-linecap="round"/>
  <g>
    <path d="M20 287C40 302 84 300 106 267" fill="none" stroke="url(#rope)" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M20 287C40 302 84 300 106 267" fill="none" stroke="rgba(255,242,196,.42)" stroke-width="1.5"
      stroke-dasharray="3 5.5" stroke-linecap="round"/>
    <ellipse cx="67.5" cy="309" rx="6.5" ry="9" fill="url(#rope)"/>
    <rect x="61.5" y="317.5" width="12" height="4.5" rx="1.8" fill="url(#ropeHi)"/>
    <path d="M61.5 322H73.5L74.5 382H62.5Z" fill="url(#rope)"/>
    <g stroke="rgba(92,60,8,.5)" stroke-width=".8" fill="none">
      <path d="M64 323l-.6 58M67 323v58M70 323l.6 58"/>
    </g>
  </g>`;

/* ============================ fonts ============================ *
 * Self-hosted glyph subsets (see tools/fetch-fonts.mjs). Keeps the page free
 * of a render-blocking third-party stylesheet and makes text render
 * identically regardless of whether Google Fonts is reachable.
 */
const fontManifest = JSON.parse(fs.readFileSync(path.join(HERE, 'fonts.json'), 'utf8'));

const FONT_FACE = fontManifest
  .map((f) => `@font-face{font-family:"Noto Serif JP";font-style:normal;font-weight:${f.weight};
  font-display:block;src:url(fonts/${f.file}) format("woff2")}`)
  .join('\n');

const FONT_PRELOAD = fontManifest
  .map((f) => `<link rel="preload" href="fonts/${f.file}" as="font" type="font/woff2" crossorigin>`)
  .join('\n');

/* ============================ sparkles ============================ */
const sparkDots = fs.readFileSync(path.join(HERE, 'sparkles-dots.txt'), 'utf8').trim();
const sparkStars = fs.readFileSync(path.join(HERE, 'sparkles-stars.txt'), 'utf8').trim();

/* ============================ badge ============================ */
/** Rounded scallop rim: valleys sit on the inner radius, and each bump is a
 *  quadratic through a control point past the outer radius, which reads as a
 *  soft petal rather than the sawtooth a straight-line star gives. */
function scallop(cx, cy, ro, ri, n) {
  const pt = (r, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ctrl = ri + (ro - ri) / Math.cos(Math.PI / (2 * n)) * 1.28;
  let d = '';
  for (let i = 0; i < n * 2; i += 2) {
    const [x0, y0] = pt(ri, i);
    const [cxp, cyp] = pt(ctrl, i + 1);
    const [x1, y1] = pt(ri, i + 2);
    d += (d ? '' : `M${r2(x0)} ${r2(y0)}`) + `Q${r2(cxp)} ${r2(cyp)} ${r2(x1)} ${r2(y1)}`;
  }
  return d + 'Z';
}

/* Badge geometry. The viewBox is deliberately larger than the medallion so the
   laurel tips are not clipped by the SVG viewport (they were, before). */
const BX = 46;      // medallion centre
const BY = 45.5;
const BRO = 37.5;   // scallop outer radius

/** Laurel sprig behind the medallion. Only the tips show, at roughly 7-8
 *  o'clock. theta is measured from 12 o'clock, growing counter-clockwise. */
function laurelLeaves() {
  const R = 35;
  let stem = '';
  let leaves = '';
  for (let i = 0; i <= 8; i++) {
    const deg = 158 - (i / 8) * 78;              // 158° (low) up to 80°
    const th = (deg * Math.PI) / 180;
    const x = BX - R * Math.sin(th);
    const y = BY - R * Math.cos(th);
    stem += (i ? 'L' : 'M') + `${r2(x)} ${r2(y)}`;
    // splay the leaf outward from the rim so the tip clears the scallop
    const rot = 118 - deg;
    const lx = BX - (R + 3.4) * Math.sin(th);
    const ly = BY - (R + 3.4) * Math.cos(th);
    leaves += `<ellipse cx="${r2(lx)}" cy="${r2(ly)}" rx="6.4" ry="2.6" transform="rotate(${r2(rot)} ${r2(lx)} ${r2(ly)})"/>`;
  }
  return `<path d="${stem}" fill="none" stroke="url(#lgold)" stroke-width="1.7"/>${leaves}`;
}

const BADGE = `<svg class="badge" viewBox="0 0 92 92" aria-hidden="true">
<g fill="url(#lgold)">${laurelLeaves()}</g>
<g fill="url(#lgold)" transform="translate(92,0) scale(-1,1)">${laurelLeaves()}</g>
<path d="${scallop(BX, BY, BRO, 33.6, 19)}" fill="url(#bgold)"/>
<circle cx="${BX}" cy="${BY}" r="33.4" fill="url(#bgold2)"/>
<circle cx="${BX}" cy="${BY}" r="27.6" fill="url(#bcore)"/>
<circle cx="${BX}" cy="${BY}" r="26.6" fill="none" stroke="#8a6620" stroke-width=".9"/>
<path d="M35.2 33.6 36.8 25.4 41 29.2 46 21.8 51 29.2 55.2 25.4 56.8 33.6Z" fill="url(#lgold)"/>
<rect x="34.6" y="33.4" width="22.8" height="2.6" rx="1.2" fill="url(#lgold)"/>
<circle cx="36.2" cy="23.4" r="1.7" fill="#f8e3a0"/>
<circle cx="55.8" cy="23.4" r="1.7" fill="#f8e3a0"/>
<circle cx="46" cy="19.6" r="1.9" fill="#f8e3a0"/>
<text class="badge-t" x="${BX}" y="57.4">認定</text>
</svg>`;

/* ============================ ornaments ============================ *
 * The mock-up's corner motif is symmetric about the 45° diagonal: a small
 * hub near the corner throws one acanthus branch along each edge. So the
 * branch is drawn once and mirrored with matrix(0,1,1,0,0,0), which swaps
 * x and y — i.e. reflects across the diagonal.
 */
const DIAG = 'matrix(0,1,1,0,0,0)';

/** one acanthus branch running away from the hub along the top edge */
const PAGE_BRANCH = `
<g fill="none" stroke="url(#ogold)" stroke-width="1.55" stroke-linecap="round">
  <path d="M20 20C30 18.4 38 17.9 49 17.2"/>
  <path d="M27.6 18.4C26.8 10.6 32.4 4.6 39.4 5.6c5.8.8 6.4 7.4 1.2 8.6-3.2.7-4.6-2.3-2.4-3.8"/>
  <path d="M49 17.2c5.6-.9 9-4 8.6-7.3-.3-2.2-2.6-2.9-3.7-1.4"/>
  <path d="M32.6 19.9c3.2 3.2 7.4 3.2 10.1 1.1"/>
  <path d="M21.6 17.4C24.2 11.4 29 7.9 34 7.1"/>
  <path d="M44.6 18.6c3.6 2.4 8 2 10.8-.8"/>
  <path d="M16.2 13.4c3-1.2 6.4-.8 8.8 1.2"/>
  <path d="M11.4 20.4c-2.6 1.6-3.4 4.8-1.8 7.2 1.1 1.6 3.2 1.4 3.6-.4"/>
</g>
<g fill="url(#ogold)">
  <path d="M21 18.4C23.6 12 28.2 8.5 33.6 7.4c-1.5 4.6-5.6 8.7-11.4 11.8Z"/>
  <path d="M45.8 20C48.6 22.4 52 22.9 55.4 21.6c-2.4 2.6-6 3.2-9.8 1.6Z"/>
  <ellipse cx="14.6" cy="12.2" rx="3.4" ry="1.5" transform="rotate(-30 14.6 12.2)"/>
  <circle cx="43.2" cy="4.2" r="1.4"/><circle cx="54.6" cy="13.2" r="1"/>
  <circle cx="36.2" cy="22" r=".9"/><circle cx="9.4" cy="28.6" r="1"/>
</g>`;

/** the part that sits on the symmetry axis, drawn once */
const PAGE_SPINE = `
<g fill="none" stroke="url(#ogold)" stroke-width="1.7" stroke-linecap="round">
  <path d="M5.6 5.6 20 20"/>
  <path d="M8.4 15.6C11 13 13 11 15.6 8.4"/>
</g>
<circle cx="20" cy="20" r="2.5" fill="url(#ogold)"/>
<circle cx="5" cy="5" r="1.6" fill="url(#ogold)"/>`;

const PAGE_CORNER = `<svg class="pcorner" viewBox="0 0 66 66" aria-hidden="true">
${PAGE_SPINE}${PAGE_BRANCH}<g transform="${DIAG}">${PAGE_BRANCH}</g></svg>`;

/** same motif, simplified for the 30px card corners */
const CARD_BRANCH = `
<g fill="none" stroke="url(#ogold)" stroke-width="1.5" stroke-linecap="round">
  <path d="M9.5 9.5C14 8.8 18 8.6 23 8.3"/>
  <path d="M13.4 8.6C13.1 5.2 15.6 2.5 18.8 3c2.6.4 2.9 3.4.5 3.9-1.4.3-2-1-1.1-1.7"/>
  <path d="M23 8.3c2.4-.4 3.9-1.8 3.7-3.3"/>
</g>
<g fill="url(#ogold)">
  <path d="M10.2 8.8C11.5 5.8 13.6 4.2 16.1 3.7c-.7 2.1-2.6 4-5.3 5.4Z"/>
  <circle cx="20.6" cy="2.4" r="1"/>
</g>`;

const CARD_CORNER = `<svg class="ccorner" viewBox="0 0 30 30" aria-hidden="true">
<path d="M2.6 2.6 9.5 9.5" fill="none" stroke="url(#ogold)" stroke-width="1.5" stroke-linecap="round"/>
<circle cx="9.5" cy="9.5" r="1.7" fill="url(#ogold)"/>
${CARD_BRANCH}<g transform="${DIAG}">${CARD_BRANCH}</g></svg>`;

const cardCorners = ['tl', 'tr', 'bl', 'br']
  .map((k) => CARD_CORNER.replace('class="ccorner"', `class="ccorner ccorner--${k}"`))
  .join('');

/* ============================ button ============================ */
function octagon(x, y, w, h, c) {
  return `M${x + c} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h - c}L${x + w - c} ${y + h}` +
    `H${x + c}L${x} ${y + h - c}V${y + c}Z`;
}

/* The outline hugs the plate with an even gap on all four sides. An earlier
   version inset the plate 8px from the top but only 2px from the bottom,
   which read as the button sitting low inside its frame. */
const BTN_PLATE = octagon(3.5, 4.5, 239, 41, 6.5);

const BTN_GFX = `<svg class="btn__gfx" viewBox="0 0 246 50" aria-hidden="true">
<path d="${octagon(0.8, 1.8, 244.4, 46.4, 8.5)}" fill="none" stroke="url(#btnLine)" stroke-width="1.2"/>
<path d="${BTN_PLATE}" fill="url(#btnBody)"/>
<path d="${BTN_PLATE}" fill="none" stroke="url(#btnEdge)" stroke-width="1.6"/>
</svg>`;

/* ============================ cards ============================ */
const CARDS = [
  // sx horizontally condenses long names, matching the mock-up
  { img: 'img/BD.jpg', name: 'ビーディー亀田店', pref: '新潟県', sx: 0.932 },
  { img: 'img/ヤング.webp', name: 'ヤング舞鶴', pref: '京都府', sx: 1 },
  { img: 'img/グランドダムズ.jpg', name: 'グランドダムズ県央店', pref: '新潟県', sx: 0.795 },
  { img: 'img/マルハン.jpg', name: 'マルハン鹿児島新港店', pref: '鹿児島県', sx: 0.77 },
  { img: 'img/オータ888.jpg', name: 'グランドオータ888鳴海店', pref: '愛知県', sx: 0.699 },
  { img: 'img/VG姫路.jpg', name: 'ヴィーナスギャラリー姫路I店', pref: '兵庫県', sx: 0.585 },
];

// CAL=1 renders every name uncondensed so natural widths can be measured
const CAL = process.env.CAL === '1';

const card = (c) => `<article class="card">
  <div class="card__frame">
    <div class="card__body">
      <div class="card__photo"><img src="${encodeURI(c.img)}" alt="${c.name}" loading="lazy" decoding="async"></div>
      <div class="card__rule"></div>
      <div class="card__info">
        <div class="card__row">
          <h3 class="card__name"><span style="--sx:${CAL ? 1 : c.sx}">${c.name}</span></h3>
          <span class="tag"><i>${c.pref}</i></span>
        </div>
        <a class="btn" href="#">${BTN_GFX}<span class="btn__label">店舗情報</span><span class="btn__arrow"></span></a>
      </div>
    </div>
  </div>
  ${cardCorners}
  ${BADGE}
</article>`;

/* ============================ document ============================ */
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ハカセさんぽ 認定ホール｜ハカセが自信を持って推薦する優良ホール</title>
<meta name="description" content="全国のパチンコホールを調査し、独自の基準をクリアした認定ホールをご紹介します。">
${FONT_PRELOAD}
<style>
${FONT_FACE}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;background:#000}
body{overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img,svg{display:block}

.viewport{position:relative;width:100%;overflow:hidden;background:#000}
.stage{position:relative;width:${D}px;height:${D}px;transform-origin:0 0;background:#000;
  font-family:"Noto Serif JP","Yu Mincho","YuMincho","Hiragino Mincho ProN",serif;color:#fff}

/* ---------- background ---------- */
.bg{position:absolute;inset:0;
  background:radial-gradient(128% 86% at 50% 2%,#191008 0%,#0a0604 32%,#020101 66%,#000 100%)}
.spark{position:absolute;inset:0;pointer-events:none}

/* ---------- curtains ---------- */
.curtain{position:absolute;top:0;width:260px;height:${D}px;pointer-events:none}
.curtain--l{left:0}
.curtain--r{right:0;transform:scaleX(-1)}

/* ---------- outer frame ---------- */
.frame{position:absolute;inset:13px;pointer-events:none;border:2px solid transparent;
  border-image:linear-gradient(150deg,#f6e6a6,#c9992a 20%,#7a5205 46%,#dbb246 66%,#f8ecb6 84%,#a5731a) 1}
.frame::after{content:"";position:absolute;inset:2px;border:1px solid rgba(190,142,38,.45)}
.pcorner{position:absolute;width:66px;height:66px;pointer-events:none}
.pcorner--tl{left:14px;top:14px}
.pcorner--tr{right:14px;top:14px;transform:scaleX(-1)}
.pcorner--bl{left:14px;bottom:14px;transform:scaleY(-1)}
.pcorner--br{right:14px;bottom:14px;transform:scale(-1)}

/* ---------- content ---------- */
.content{position:absolute;left:137px;top:0;width:973px;height:100%}
/* logo01.png is taller than the mock-up's lockup, so it is fitted to the
   same vertical band (top ~4px .. just above the headline) rather than width */
.logo{position:absolute;left:50%;top:var(--logo-t,4px);width:var(--logo-w,282px);
  transform:translateX(-50%)}
.logo img{width:100%;height:auto}

.headline{position:absolute;left:0;top:304px;width:100%;margin:0;text-align:center;
  font-weight:700;font-size:35.4px;line-height:44px;letter-spacing:.012em;
  background-image:linear-gradient(180deg,#fffdf0 0%,#fcefb4 20%,#f0cd6b 42%,
    #cf9c2c 58%,#a2731a 72%,#e7c86e 90%,#f7e4a2 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.9))}
.rule{position:absolute;left:50%;top:348px;width:792px;height:14px;
  transform:translateX(calc(-50% - 5px))}
.lead{position:absolute;left:0;top:365px;width:100%;margin:0;text-align:center;
  font-size:14.6px;line-height:22px;letter-spacing:.015em;color:#eae5d7;font-weight:400}

/* ---------- grid ---------- */
.grid{position:absolute;left:0;top:410px;width:973px;display:grid;
  grid-template-columns:repeat(3,315px);column-gap:14px;row-gap:15px}

/* ---------- card ---------- */
.card{position:relative;width:315px;height:378px}
.card__frame{position:absolute;inset:0;padding:2px;
  background:linear-gradient(168deg,#f7e4a2,#c3932c 16%,#7c5509 40%,#dcb043 60%,#f9eeb8 78%,#a6741b)}
.card__body{position:relative;height:100%;background:#030101;padding:9px 7px 7px}
.card__body::before{content:"";position:absolute;left:5px;right:5px;top:6px;bottom:5px;
  pointer-events:none;border:1px solid transparent;
  border-image:linear-gradient(180deg,#eac560,#a27214 34%,#6f4c08 66%,#cb9d2e) 1}
.card__photo{position:relative;width:297px;height:199px;overflow:hidden;background:#0a0b0d}
.card__photo img{width:100%;height:100%;object-fit:cover}
.card__rule{width:297px;height:3px;
  background:linear-gradient(90deg,#2f1002,#a3741a 13%,#f8dc62 50%,#ad7d1c 87%,#2f1002)}
.card__info{position:relative;width:297px;height:156px;
  background:radial-gradient(112% 134% at 50% -2%,#5a1d07 0%,#380c04 24%,#210401 52%,#0a0100 82%,#000 100%)}

/* Name and tag are positioned independently: scaleX condenses the name
   visually but does not change its layout width, so a flex row would let a
   long name shove the tag off the card. */
.card__row{position:absolute;left:0;top:23px;width:100%;height:35px}
.card__name{position:absolute;left:13px;top:50%;margin:0;font-size:25px;font-weight:500;
  line-height:1;color:#fff;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,.9);
  transform:translateY(-50%)}
.card__name span{display:inline-block;transform:scaleX(var(--sx,1));transform-origin:left center}

.tag{position:absolute;right:8px;top:0;width:75px;height:35px;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(148deg,#f5df94,#bb8c21 34%,#7d5608 58%,#e6c569);
  clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),
    calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)}
.tag::before{content:"";position:absolute;inset:1.6px;background:#0a0603;
  clip-path:polygon(7px 0,calc(100% - 7px) 0,100% 7px,100% calc(100% - 7px),
    calc(100% - 7px) 100%,7px 100%,0 calc(100% - 7px),0 7px)}
.tag i{position:relative;font-style:normal;font-size:16.5px;font-weight:500;line-height:1;
  background-image:linear-gradient(180deg,#fdf6cb,#f4d777 40%,#d4a12c 68%,#f7e7a6);
  -webkit-background-clip:text;background-clip:text;color:transparent}

.btn{position:absolute;left:25px;top:88px;width:246px;height:50px;display:block;
  text-decoration:none}
.btn__gfx{position:absolute;inset:0;width:246px;height:50px}
.btn__label{position:absolute;left:0;right:0;top:4.5px;height:41px;display:flex;
  align-items:center;justify-content:center;font-size:21px;font-weight:700;
  letter-spacing:.09em;text-indent:.09em;color:#2a1503}
.btn__arrow{position:absolute;right:26px;top:25px;width:0;height:0;margin-top:-7px;
  border-left:12px solid #2a1503;border-top:7px solid transparent;border-bottom:7px solid transparent}

/* ---------- badge + corners ---------- */
/* 92px box for a ~75px medallion: the extra room is for the laurel tips */
.badge{position:absolute;left:2px;top:-1px;width:92px;height:92px;
  filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}
.badge-t{font-family:"Noto Serif JP","Yu Mincho",serif;font-weight:700;font-size:22px;
  text-anchor:middle;fill:url(#tgold);letter-spacing:.5px}
.ccorner{position:absolute;width:30px;height:30px;pointer-events:none}
.ccorner--tl{left:5px;top:6px}
.ccorner--tr{right:5px;top:6px;transform:scaleX(-1)}
.ccorner--bl{left:5px;bottom:5px;transform:scaleY(-1)}
.ccorner--br{right:5px;bottom:5px;transform:scale(-1)}

/* ---------- back to the main site ---------- */
.pagenav{background:#000;padding:26px 16px 44px;text-align:center}
.backbtn{position:relative;display:inline-block;width:300px;max-width:100%;height:56px;
  text-decoration:none}
.backbtn__gfx{position:absolute;inset:0;width:100%;height:100%}
.backbtn__label{position:absolute;inset:0;display:flex;align-items:center;
  justify-content:center;gap:10px;font-size:19px;font-weight:700;letter-spacing:.06em;
  color:#2a1503}
.backbtn__arrow{width:0;height:0;border-right:11px solid #2a1503;
  border-top:7px solid transparent;border-bottom:7px solid transparent}
.backbtn:hover .backbtn__label{color:#000}
.backbtn:focus-visible{outline:3px solid #f0cd6b;outline-offset:3px}

/* ================= narrow screens: reflow into one column ================
   Below ${MOBILE_BP}px the fixed canvas would scale text down to ~8px, so the
   absolute positioning is unwound and the page becomes a normal document. */
@media (max-width:${MOBILE_BP - 1}px){
  .viewport{height:auto!important}
  .stage{width:100%;height:auto;transform:none!important;padding:0 0 34px}

  .curtain{display:none}
  .spark{height:100%}
  .frame{inset:7px}
  .frame::after{inset:3px}
  .pcorner{width:46px;height:46px}
  .pcorner--tl,.pcorner--tr{top:8px}
  .pcorner--bl,.pcorner--br{bottom:8px}
  .pcorner--tl,.pcorner--bl{left:8px}
  .pcorner--tr,.pcorner--br{right:8px}

  /* must stay positioned: .bg and .spark are absolute, and absolutely
     positioned siblings paint above static ones regardless of DOM order */
  .content{position:relative;left:auto;top:auto;z-index:1;width:auto;height:auto;
    padding:0 clamp(16px,4.6vw,30px)}
  .logo{position:static;transform:none;width:min(300px,64%);margin:clamp(18px,5vw,30px) auto 0}
  /* 4.5vw keeps all 19 characters on one line down to ~340px wide, so the
     heading never breaks mid-word (ホ / ール) */
  .headline{position:static;margin:clamp(14px,3.6vw,22px) 0 0;font-size:clamp(13px,4.5vw,30px);
    line-height:1.45;letter-spacing:.01em}
  .rule{position:static;transform:none;width:100%;max-width:560px;height:14px;
    margin:clamp(10px,2.6vw,16px) auto 0}
  .lead{position:static;margin:clamp(8px,2.4vw,14px) 0 0;font-size:clamp(12px,3.3vw,15px);
    line-height:1.85;text-align:center}

  .grid{position:static;width:auto;grid-template-columns:1fr;
    gap:clamp(16px,4.4vw,26px);margin-top:clamp(20px,5.4vw,34px)}
  /* the frame is absolute on desktop, which would collapse an auto-height card */
  .card{width:100%;height:auto}
  .card__frame{position:relative;inset:auto}
  .card__body{height:auto;padding:10px 8px 8px}
  .card__photo{width:auto;height:auto;aspect-ratio:297/199}
  .card__rule{width:auto}
  .card__info{width:auto;height:auto;padding:clamp(12px,3.4vw,20px) clamp(10px,3vw,16px)
    clamp(14px,3.8vw,20px)}

  .card__row{position:static;height:auto;padding:0;display:flex;align-items:center;
    justify-content:space-between;gap:10px}
  /* scaleX does not reduce layout width, so on a narrow screen the longest
     name forced the card wider than the viewport. Shrink the font instead,
     reusing the same per-card factor. */
  .card__name{position:static;transform:none;line-height:1.3;min-width:0}
  .card__name span{transform:none;
    font-size:max(12.5px,calc(min(25px,5.4vw) * var(--sx,1)))}
  .tag{position:static;flex:none;width:clamp(62px,17vw,78px);height:clamp(29px,7.6vw,36px)}
  .tag i{font-size:clamp(13px,3.7vw,17px)}

  .btn{position:static;width:100%;max-width:300px;height:clamp(46px,12vw,54px);
    margin:clamp(12px,3.4vw,18px) auto 0}
  .btn__gfx{width:100%;height:100%}
  .btn__label{top:9%;height:82%;font-size:clamp(16px,4.4vw,21px)}
  .btn__arrow{right:8%;top:50%;border-left-width:clamp(9px,2.6vw,12px);
    border-top-width:clamp(5px,1.5vw,7px);border-bottom-width:clamp(5px,1.5vw,7px);
    margin-top:calc(clamp(5px,1.5vw,7px) * -1)}

  .badge{left:1%;top:-2px;width:clamp(58px,17vw,88px);height:auto;aspect-ratio:1}
  .ccorner{width:clamp(20px,6vw,30px);height:clamp(20px,6vw,30px)}

  .backbtn{height:clamp(48px,13vw,56px)}
  .backbtn__label{font-size:clamp(15px,4.2vw,19px)}
}

/* tablets: two columns rather than dropping straight to one */
@media (min-width:640px) and (max-width:${MOBILE_BP - 1}px){
  .grid{grid-template-columns:1fr 1fr}
  .headline{font-size:clamp(22px,3.4vw,32px)}
  .lead{font-size:clamp(13px,1.9vw,16px)}
  .card__name span{font-size:calc(min(25px,3.1vw) * var(--sx,1))}
}
</style>
</head>
<body>
<div class="viewport" id="viewport">
<div class="stage" id="stage">

  <div class="bg"></div>

  <svg class="spark" viewBox="0 0 ${D} ${D}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g fill="#e5a726">${sparkDots}</g>
    <g>${sparkStars}</g>
  </svg>

  <svg class="curtain curtain--l" viewBox="0 0 260 ${D}" aria-hidden="true">${CURTAIN_BODY}</svg>
  <svg class="curtain curtain--r" viewBox="0 0 260 ${D}" aria-hidden="true">${CURTAIN_BODY}</svg>

  <div class="frame"></div>
  ${['tl', 'tr', 'bl', 'br'].map((k) => PAGE_CORNER.replace('class="pcorner"', `class="pcorner pcorner--${k}"`)).join('\n  ')}

  <div class="content">
    <div class="logo"><img src="img/logo01.png" alt="ハカセさんぽ 認定ホール" width="2476" height="2639"></div>
    <h1 class="headline">ハカセが自信を持って推薦する優良ホール</h1>
    <svg class="rule" viewBox="0 0 792 14" aria-hidden="true">
      <path d="M0 7H792" stroke="url(#rg)" stroke-width="1.7"/>
      <g fill="none" stroke="url(#rg)" stroke-width="1.7">
        <circle cx="18" cy="7" r="5.6"/><circle cx="28" cy="7" r="3.2"/>
        <circle cx="774" cy="7" r="5.6"/><circle cx="764" cy="7" r="3.2"/>
      </g>
      <g fill="#f2d264"><circle cx="18" cy="7" r="2.2"/><circle cx="774" cy="7" r="2.2"/></g>
    </svg>
    <p class="lead">全国のパチンコホールを調査し、独自の基準をクリアした認定ホールをご紹介します。</p>

    <div class="grid">
${CARDS.map(card).join('\n')}
    </div>
  </div>

</div>
</div>

<nav class="pagenav">
  <a class="backbtn" href="${BACK_URL}">
    <svg class="backbtn__gfx" viewBox="0 0 300 56" aria-hidden="true">
      <path d="${octagon(0.8, 1.8, 298.4, 52.4, 9)}" fill="none" stroke="url(#btnLine)" stroke-width="1.3"/>
      <path d="${octagon(4, 5, 292, 46, 7)}" fill="url(#btnBody)"/>
      <path d="${octagon(4, 5, 292, 46, 7)}" fill="none" stroke="url(#btnEdge)" stroke-width="1.7"/>
    </svg>
    <span class="backbtn__label"><i class="backbtn__arrow"></i>${BACK_LABEL}</span>
  </a>
</nav>

<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="ogold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#f9e9ab"/><stop offset=".4" stop-color="#d6a934"/>
  <stop offset=".72" stop-color="#96690f"/><stop offset="1" stop-color="#ecd070"/></linearGradient>
<linearGradient id="tgold" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#fdf5c8"/><stop offset=".42" stop-color="#f2d477"/>
  <stop offset=".7" stop-color="#cf9c2a"/><stop offset="1" stop-color="#f6e5a2"/></linearGradient>
<linearGradient id="lgold" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#f7e196"/><stop offset=".5" stop-color="#c4921f"/>
  <stop offset="1" stop-color="#8a5c0c"/></linearGradient>
<linearGradient id="bgold" x1=".05" y1="0" x2=".7" y2="1">
  <stop offset="0" stop-color="#fdf3bd"/><stop offset=".17" stop-color="#e6c261"/>
  <stop offset=".36" stop-color="#a3700f"/><stop offset=".5" stop-color="#f6e096"/>
  <stop offset=".68" stop-color="#bd8b1e"/><stop offset=".85" stop-color="#845709"/>
  <stop offset="1" stop-color="#e8c463"/></linearGradient>
<linearGradient id="bgold2" x1=".1" y1="0" x2=".85" y2="1">
  <stop offset="0" stop-color="#fff8d6"/><stop offset=".28" stop-color="#dcb44e"/>
  <stop offset=".55" stop-color="#8f6210"/><stop offset=".78" stop-color="#e3bd58"/>
  <stop offset="1" stop-color="#7d5308"/></linearGradient>
<radialGradient id="bcore" cx=".5" cy=".36" r=".74">
  <stop offset="0" stop-color="#2b2317"/><stop offset=".5" stop-color="#0d0a06"/>
  <stop offset="1" stop-color="#000"/></radialGradient>
<linearGradient id="btnLine" x1="0" y1="0" x2=".3" y2="1">
  <stop offset="0" stop-color="#e8c76e"/><stop offset=".5" stop-color="#a2761f"/>
  <stop offset="1" stop-color="#6d4a09"/></linearGradient>
<linearGradient id="btnBody" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#f8e6ac"/><stop offset=".07" stop-color="#f2cd6b"/>
  <stop offset=".26" stop-color="#e3b243"/><stop offset=".52" stop-color="#d29832"/>
  <stop offset=".74" stop-color="#c68c27"/><stop offset=".9" stop-color="#d5a038"/>
  <stop offset="1" stop-color="#93650f"/></linearGradient>
<linearGradient id="btnEdge" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#f5e3a8"/><stop offset=".35" stop-color="#c08f28"/>
  <stop offset="1" stop-color="#8f6212"/></linearGradient>
<!-- userSpaceOnUse: the rule is a zero-height box, so an objectBoundingBox
     gradient would not paint at all -->
<linearGradient id="rg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="792" y2="0">
  <stop offset="0" stop-color="#8f6710"/><stop offset=".06" stop-color="#c39428"/>
  <stop offset=".26" stop-color="#d9ad33"/><stop offset=".5" stop-color="#f6dc6c"/>
  <stop offset=".74" stop-color="#d9ad33"/><stop offset=".94" stop-color="#c39428"/>
  <stop offset="1" stop-color="#8f6710"/></linearGradient>
<linearGradient id="cloth" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#040000"/><stop offset=".18" stop-color="#0f0000"/>
  <stop offset=".5" stop-color="#180101"/><stop offset=".8" stop-color="#210202"/>
  <stop offset="1" stop-color="#2a0403"/></linearGradient>
<linearGradient id="foldHi" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${CURTAIN_BOTTOM}">
  <stop offset="0" stop-color="#a0231f"/><stop offset=".22" stop-color="#8a1a17"/>
  <stop offset=".42" stop-color="#701312"/><stop offset=".72" stop-color="#560d0c"/>
  <stop offset="1" stop-color="#380707"/></linearGradient>
<filter id="soft" x="-20%" y="-5%" width="140%" height="110%">
  <feGaussianBlur stdDeviation="1.1"/></filter>
<linearGradient id="braid" x1="0" y1="0" x2="1" y2=".22">
  <stop offset="0" stop-color="#7d5808"/><stop offset=".3" stop-color="#f6ecb4"/>
  <stop offset=".55" stop-color="#d1a533"/><stop offset="1" stop-color="#6f4a05"/></linearGradient>
<linearGradient id="rope" x1="0" y1="0" x2=".25" y2="1">
  <stop offset="0" stop-color="#f3de97"/><stop offset=".45" stop-color="#c89b2d"/>
  <stop offset="1" stop-color="#75500a"/></linearGradient>
<linearGradient id="ropeHi" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#8a6110"/><stop offset=".45" stop-color="#f6e3a4"/>
  <stop offset="1" stop-color="#8a6110"/></linearGradient>
<linearGradient id="cfade" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#000" stop-opacity="0"/>
  <stop offset=".86" stop-color="#000" stop-opacity="0"/>
  <stop offset=".92" stop-color="#000" stop-opacity=".22"/>
  <stop offset=".96" stop-color="#000" stop-opacity=".42"/>
  <stop offset="1" stop-color="#000" stop-opacity=".88"/></linearGradient>
<linearGradient id="cshade" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#000" stop-opacity=".82"/>
  <stop offset=".09" stop-color="#000" stop-opacity=".35"/>
  <stop offset=".2" stop-color="#000" stop-opacity="0"/></linearGradient>
<clipPath id="cclip"><path d="${curtainOutline()}"/></clipPath>
</defs></svg>

<script>
(function(){
  var vp=document.getElementById('viewport'),st=document.getElementById('stage'),
      D=${D},BP=${MOBILE_BP};
  function fit(){
    var w=vp.clientWidth;
    if(w>=BP){
      // wide: keep the pixel-exact canvas and scale it to the viewport
      var k=w/D;
      st.style.transform='scale('+k+')';
      vp.style.height=(D*k)+'px';
    }else{
      // narrow: CSS reflows the page, so let it size itself
      st.style.transform='';
      vp.style.height='';
    }
  }
  fit();
  addEventListener('resize',fit);
  addEventListener('orientationchange',fit);
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
console.log('index.html written:', html.length, 'bytes');
