// Capturas automáticas das fases: sobe o jogo em modo de desenvolvimento, abre fases em pontos
// fixos e salva as imagens em .debug/shots/<pasta>. Serve de antes/depois em mudanças visuais.
//
//   npm run shots                 -> fases padrão, pasta "atual"
//   npm run shots -- depois 0,5   -> pasta "depois", só as fases de índice 0 e 5
//
// Precisa do Google Chrome instalado (usa o canal "chrome" do playwright-core) ou CHROME_PATH.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const [label = 'atual', only] = process.argv.slice(2);
// índice da fase -> colunas onde a câmera para
const PLAN = { 0: [8, 31, 45, 60, 76, 110], 1: [30, 75, 120, 150, 185], 2: [62, 150], 4: [40, 112], 8: [40, 110], 12: [40, 96], 13: [40, 110], 16: [40, 110], 20: [40, 116], 24: [40, 80, 114] };
const wanted = only ? only.split(',').map(Number) : Object.keys(PLAN).map(Number);
const out = path.resolve('.debug/shots', label);
fs.mkdirSync(out, { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5199/?debug');
await page.waitForFunction(() => window.game?.scene.isActive('Title'), null, { timeout: 120000 });

for (const index of wanted) {
  const stops = PLAN[index] ?? [20, 80];
  await page.evaluate(async (index) => {
    const g = window.game;
    const { ensureWorld } = await import('/src/systems/Loader.ts');
    const from = g.scene.getScenes(true)[0];
    await new Promise((done) => ensureWorld(from, Math.floor(index / 4) + 1, done));
    g.scene.getScenes(true).forEach((s) => g.scene.stop(s.scene.key));
    g.scene.start('Game', { level: index });
  }, index);
  await page.waitForFunction(() => window.game.scene.getScene('Game')?.player, null, { timeout: 120000 });
  await page.waitForTimeout(1800);
  const info = await page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    s.color.complete(); // cor cheia: é assim que a arte é julgada
    return { id: s.level.id, objects: s.children.length };
  });
  for (const col of stops) {
    await page.evaluate((col) => {
      const s = window.game.scene.getScene('Game');
      const h = s.player.hit;
      // pousa Íris no chão dessa coluna (ou a deixa no ar sobre um buraco)
      let row = s.level.rows - 3;
      for (let r = 1; r < s.level.rows; r++) if (s.level.tiles[r][col] === 1 && s.level.tiles[r - 1][col] === 0) { row = r; break; }
      s.player.frozen = true;
      h.body.allowGravity = false;
      h.body.reset(col * 64 + 32, row * 64 - 46);
      s.cameras.main.centerOn(col * 64 + 32, row * 64 - 46); // sem esperar a câmera suavizada chegar
    }, col);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(out, `${info.id}_c${String(col).padStart(3, '0')}.png`) });
  }
  console.log(`fase ${info.id}: ${stops.length} captura(s), ${info.objects} objetos em cena`);
}
if (errors.length) console.log('erros no console:\n' + [...new Set(errors)].slice(0, 10).join('\n'));
await browser.close();
await server.close();
console.log(`capturas em ${out}`);
process.exit(errors.length ? 1 : 0);
