// Downloads a minimal Noto Serif JP subset containing only the glyphs this
// page actually uses, and writes them to ../fonts/ plus fonts.json for the
// build. Run once (or whenever the copy changes):
//
//   node tools/fetch-fonts.mjs
//
// Self-hosting matters here: the Google Fonts <link> is render-blocking, and
// the full Japanese family is megabytes. The subset below is a few KB.
import fs from 'node:fs';
import path from 'node:path';

const HERE = import.meta.dirname;
const ROOT = path.join(HERE, '..');
const FONT_DIR = path.join(ROOT, 'fonts');

// every string that is rendered in Noto Serif JP, grouped by weight
const COPY = {
  400: ['全国のパチンコホールを調査し、独自の基準をクリアした認定ホールをご紹介します。'],
  500: [
    'ビーディー亀田店', 'ヤング舞鶴', 'グランドダムズ県央店',
    'マルハン鹿児島新港店', 'グランドオータ888鳴海店', 'ヴィーナスギャラリー姫路I店',
    '新潟県', '京都府', '鹿児島県', '愛知県', '兵庫県',
  ],
  700: ['ハカセが自信を持って推薦する優良ホール', '店舗情報', '認定'],
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

fs.mkdirSync(FONT_DIR, { recursive: true });

const manifest = [];

for (const [weight, strings] of Object.entries(COPY)) {
  // unique code points, sorted for a stable URL
  const chars = [...new Set(strings.join(''))].sort().join('');
  const cssUrl =
    'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@' +
    weight + '&text=' + encodeURIComponent(chars);

  const css = await (await fetch(cssUrl, { headers: { 'User-Agent': UA } })).text();
  const m = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/);
  if (!m) throw new Error(`no woff2 in CSS for weight ${weight}:\n${css}`);

  const buf = Buffer.from(await (await fetch(m[1], { headers: { 'User-Agent': UA } })).arrayBuffer());
  const file = `noto-serif-jp-${weight}.woff2`;
  fs.writeFileSync(path.join(FONT_DIR, file), buf);

  manifest.push({ weight: Number(weight), file, bytes: buf.length, chars: chars.length });
  console.log(`weight ${weight}: ${chars.length} glyphs -> ${file} (${buf.length} bytes)`);
}

fs.writeFileSync(path.join(HERE, 'fonts.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('wrote tools/fonts.json');
