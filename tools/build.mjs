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
  [980, 119], [1010, 120],
];
const edgeAt = sampler(CURTAIN_EDGE);
const CURTAIN_BOTTOM = 1010;

/** Fold highlights run along x = u * edge(y), so they converge at the
 *  tie-back pinch and flare out again below it, like real gathered fabric.
 *  u, stroke width, colour stop and opacity are jittered per fold. */
const FOLDS = [
  [0.10, 2.2, 0.30], [0.16, 1.6, 0.20], [0.22, 2.6, 0.42], [0.28, 1.5, 0.22],
  [0.34, 3.0, 0.50], [0.40, 1.8, 0.26], [0.46, 3.4, 0.62], [0.52, 1.6, 0.24],
  [0.57, 4.0, 0.80], [0.63, 2.0, 0.32], [0.69, 3.2, 0.58], [0.75, 1.8, 0.28],
  [0.80, 4.2, 0.86], [0.86, 2.2, 0.36], [0.91, 3.6, 0.74], [0.96, 2.4, 0.44],
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

/* ============================ sparkles ============================ */
const sparkDots = fs.readFileSync(path.join(HERE, 'sparkles-dots.txt'), 'utf8').trim();
const sparkStars = fs.readFileSync(path.join(HERE, 'sparkles-stars.txt'), 'utf8').trim();

/* ============================ badge ============================ */
function scallop(cx, cy, ro, ri, n) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? ro : ri;
    const a = (Math.PI * i) / n - Math.PI / 2;
    p.push(`${r2(cx + r * Math.cos(a))} ${r2(cy + r * Math.sin(a))}`);
  }
  return 'M' + p.join('L') + 'Z';
}

/** laurel sprig hugging the left flank of the medallion.
 *  theta is measured from 12 o'clock, growing counter-clockwise. */
function laurelLeaves() {
  const R = 36.5;
  let stem = '';
  let out = '';
  for (let i = 0; i <= 7; i++) {
    const th = ((152 - (i / 7) * 92) * Math.PI) / 180;
    const x = 40 - R * Math.sin(th);
    const y = 39.5 - R * Math.cos(th);
    if (i === 0) stem = `M${r2(x)} ${r2(y)}`;
    else stem += `L${r2(x)} ${r2(y)}`;
    const rot = 90 - (th * 180) / Math.PI;       // lay the leaf along the tangent
    out += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="6" ry="2.5" transform="rotate(${r2(rot)} ${r2(x)} ${r2(y)})"/>`;
  }
  return `<path d="${stem}" fill="none" stroke="url(#lgold)" stroke-width="1.6"/>${out}`;
}

const BADGE = `<svg class="badge" viewBox="0 0 80 80" aria-hidden="true">
<g fill="url(#lgold)">${laurelLeaves()}</g>
<g fill="url(#lgold)" transform="translate(80,0) scale(-1,1)">${laurelLeaves()}</g>
<path d="${scallop(40, 39.5, 37.6, 34.1, 25)}" fill="url(#bgold)"/>
<circle cx="40" cy="39.5" r="34.2" fill="url(#bgold2)"/>
<circle cx="40" cy="39.5" r="27.4" fill="url(#bcore)"/>
<circle cx="40" cy="39.5" r="26.4" fill="none" stroke="#8a6620" stroke-width=".8"/>
<path d="M33.2 27.4l2.4-4 2.6 2.3L40 21.2l1.8 4.5 2.6-2.3 2.4 4z" fill="url(#lgold)"/>
<rect x="33" y="27.9" width="14" height="1.7" rx=".8" fill="url(#lgold)"/>
<circle cx="33.2" cy="22.6" r="1.15" fill="#f6dd93"/>
<circle cx="46.8" cy="22.6" r="1.15" fill="#f6dd93"/>
<circle cx="40" cy="20" r="1.3" fill="#f6dd93"/>
<text class="badge-t" x="40" y="49.8">認定</text>
</svg>`;

/* ============================ ornaments ============================ */
const PAGE_CORNER = `<svg class="pcorner" viewBox="0 0 92 92" aria-hidden="true">
<g fill="none" stroke="url(#ogold)" stroke-width="1.6" stroke-linecap="round">
<path d="M5 32C5 17 13 7 27 7c9 0 14 6 14 12 0 5-3 9-8 9-4 0-7-3-7-6 0-3 2-5 5-5"/>
<path d="M32 5C17 5 7 13 7 27c0 9 6 14 12 14 5 0 9-3 9-8 0-4-3-7-6-7-3 0-5 2-5 5"/>
<path d="M9 46c-2-10 3-19 12-22 6-2 11 0 13 4"/>
<path d="M46 9c-10-2-19 3-22 12-2 6 0 11 4 13"/>
<path d="M7 62c9-2 15-9 17-17 2-9 9-15 18-17"/>
<path d="M20 70c7-4 11-11 12-19M70 20c-4 7-11 11-19 12"/>
<path d="M6 78c7 0 12-4 15-9M78 6c0 7-4 12-9 15"/>
<path d="M28 28c4 0 8 3 9 8M28 28c0-4 3-8 8-9"/>
<path d="M40 20c5-3 11-3 16 0M20 40c-3 5-3 11 0 16"/>
</g>
<g fill="url(#ogold)">
<circle cx="28.5" cy="28.5" r="2.4"/><circle cx="11" cy="53" r="1.7"/>
<circle cx="53" cy="11" r="1.7"/><circle cx="17" cy="17" r="1.4"/>
<ellipse cx="45" cy="17" rx="5" ry="2.1" transform="rotate(-22 45 17)"/>
<ellipse cx="17" cy="45" rx="2.1" ry="5" transform="rotate(-22 17 45)"/>
<ellipse cx="60" cy="28" rx="4.4" ry="1.9" transform="rotate(28 60 28)"/>
<ellipse cx="28" cy="60" rx="1.9" ry="4.4" transform="rotate(28 28 60)"/>
</g></svg>`;

const CARD_CORNER = `<svg class="ccorner" viewBox="0 0 30 30" aria-hidden="true">
<g fill="none" stroke="url(#ogold)" stroke-width="1.4" stroke-linecap="round">
<path d="M1.5 12c0-7 4-11 10-11 4 0 7 3 7 6 0 3-2 5-4 5-2 0-4-2-4-4"/>
<path d="M12 1.5C5 1.5 1.5 5.5 1.5 12c0 4 3 7 6 7 3 0 5-2 5-4 0-2-2-4-4-4"/>
<path d="M3 22c4-1 7-4 8-8 1-4 4-7 8-8"/>
<path d="M22 3c-1 4-4 7-8 8-4 1-7 4-8 8"/>
</g>
<g fill="url(#ogold)"><circle cx="11.5" cy="11.5" r="1.8"/><circle cx="5" cy="5" r="1.1"/>
<ellipse cx="21" cy="8" rx="3.2" ry="1.4" transform="rotate(-26 21 8)"/>
<ellipse cx="8" cy="21" rx="1.4" ry="3.2" transform="rotate(-26 8 21)"/></g></svg>`;

const cardCorners = ['tl', 'tr', 'bl', 'br']
  .map((k) => CARD_CORNER.replace('class="ccorner"', `class="ccorner ccorner--${k}"`))
  .join('');

/* ============================ button ============================ */
function octagon(x, y, w, h, c) {
  return `M${x + c} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h - c}L${x + w - c} ${y + h}` +
    `H${x + c}L${x} ${y + h - c}V${y + c}Z`;
}

const BTN_GFX = `<svg class="btn__gfx" viewBox="0 0 246 50" aria-hidden="true">
<path d="${octagon(0.6, 0.6, 244.8, 48.8, 9)}" fill="none" stroke="url(#btnLine)" stroke-width="1.2"/>
<path d="${octagon(4, 8, 239, 39.5, 6.5)}" fill="url(#btnBody)"/>
<path d="${octagon(4, 8, 239, 39.5, 6.5)}" fill="none" stroke="url(#btnEdge)" stroke-width="1.6"/>
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
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
.pcorner{position:absolute;width:92px;height:92px;pointer-events:none}
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
.btn__label{position:absolute;left:0;right:0;top:8px;height:39.5px;display:flex;
  align-items:center;justify-content:center;font-size:21px;font-weight:700;
  letter-spacing:.09em;text-indent:.09em;color:#2a1503}
.btn__arrow{position:absolute;right:26px;top:27.5px;width:0;height:0;margin-top:-7px;
  border-left:12px solid #2a1503;border-top:7px solid transparent;border-bottom:7px solid transparent}

/* ---------- badge + corners ---------- */
.badge{position:absolute;left:9px;top:2px;width:78px;height:78px;
  filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}
.badge-t{font-family:"Noto Serif JP","Yu Mincho",serif;font-weight:700;font-size:20.5px;
  text-anchor:middle;fill:url(#tgold);letter-spacing:.5px}
.ccorner{position:absolute;width:30px;height:30px;pointer-events:none}
.ccorner--tl{left:5px;top:6px}
.ccorner--tr{right:5px;top:6px;transform:scaleX(-1)}
.ccorner--bl{left:5px;bottom:5px;transform:scaleY(-1)}
.ccorner--br{right:5px;bottom:5px;transform:scale(-1)}
</style>
</head>
<body>
<div class="viewport" id="viewport">
<div class="stage" id="stage">

  <div class="bg"></div>

  <svg class="spark" viewBox="0 0 ${D} ${D}" aria-hidden="true">
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
  <stop offset="0" stop-color="#060000"/><stop offset=".18" stop-color="#150101"/>
  <stop offset=".5" stop-color="#210202"/><stop offset=".8" stop-color="#2c0403"/>
  <stop offset="1" stop-color="#380705"/></linearGradient>
<linearGradient id="foldHi" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${CURTAIN_BOTTOM}">
  <stop offset="0" stop-color="#c4322c"/><stop offset=".22" stop-color="#a8221e"/>
  <stop offset=".42" stop-color="#8c1a17"/><stop offset=".72" stop-color="#6d1210"/>
  <stop offset="1" stop-color="#4a0a09"/></linearGradient>
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
  <stop offset=".78" stop-color="#000" stop-opacity="0"/>
  <stop offset=".88" stop-color="#000" stop-opacity=".3"/>
  <stop offset=".955" stop-color="#000" stop-opacity=".82"/>
  <stop offset="1" stop-color="#000" stop-opacity="1"/></linearGradient>
<linearGradient id="cshade" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#000" stop-opacity=".82"/>
  <stop offset=".09" stop-color="#000" stop-opacity=".35"/>
  <stop offset=".2" stop-color="#000" stop-opacity="0"/></linearGradient>
<clipPath id="cclip"><path d="${curtainOutline()}"/></clipPath>
</defs></svg>

<script>
(function(){
  var vp=document.getElementById('viewport'),st=document.getElementById('stage'),D=${D};
  function fit(){var k=vp.clientWidth/D;st.style.transform='scale('+k+')';vp.style.height=(D*k)+'px';}
  fit();addEventListener('resize',fit);
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
console.log('index.html written:', html.length, 'bytes');
