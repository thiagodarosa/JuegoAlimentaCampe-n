// Genera los íconos de la PWA a partir del logotipo oficial (recoloreado en blanco
// sobre el vino de la marca). Uso: npm run icons
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const logo = readFileSync(new URL('src/assets/brand/logo-granplus.png', root)).toString('base64');
const outDir = fileURLToPath(new URL('public/icons/', root));
mkdirSync(outDir, { recursive: true });

const page = (size, padding) => `<!doctype html><html><body style="margin:0">
<div style="width:${size}px;height:${size}px;display:grid;place-items:center;
  background:radial-gradient(120% 90% at 80% 0%, #ff8b7b55 0%, transparent 60%), linear-gradient(180deg,#6a0032,#4d0225)">
  <img src="data:image/png;base64,${logo}" style="width:${size - padding * 2}px;filter:brightness(0) invert(1)">
</div></body></html>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const tab = await ctx.newPage();
for (const [name, size, padding] of [
  ['icon-192.png', 192, 4],
  ['icon-512.png', 512, 12],
  ['icon-512-maskable.png', 512, 80],
]) {
  await tab.setViewportSize({ width: size, height: size });
  await tab.setContent(page(size, padding));
  await tab.screenshot({ path: outDir + name, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('✓', name);
}
await browser.close();
