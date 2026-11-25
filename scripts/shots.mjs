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
const PLAN = { 0: [8, 31, 45, 60, 76, 110], 1: [30, 75, 120, 150, 185], 2: [62, 150], 3: [8,15], 4: [40, 112], 8: [40, 110], 12: [40, 96], 13: [40, 110], 16: [40, 110], 20: [40, 116], 24: [40, 80, 114] };
const wanted = only ? only.split(',').map(Number) : Object.keys(PLAN).map(Number);
const out = path.resolve('.debug/shots', label);
fs.mkdirSync(out, { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
try {
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5199/?debug'+(label==='organic'?'&organic=1':''));
await page.waitForFunction(() => window.game?.scene.isActive('Title'), null, { timeout: 120000 });

for (const index of wanted) {
  let stops = PLAN[index] ?? [20, 80];
  await page.evaluate(async (index) => {
    const g = window.game;
    const { ensureWorld } = await import('/src/systems/Loader.ts');
    const from = g.scene.getScenes(true)[0];
    await new Promise((done) => ensureWorld(from, Math.floor(index / 4) + 1, done));
    g.scene.getScenes(true).forEach((s) => g.scene.stop(s.scene.key));
    g.scene.start('Game', { level: index });
  }, index);
  const expectedId=(Math.floor(index/4)+1)+'-'+(index%4+1);
  await page.waitForFunction(id=>{const s=window.game.scene.getScene('Game');return s?.level?.id===id && s?.player?.hit?.body && s?.color && (window.game.scene.isActive('Game')||window.game.scene.isPaused('Game'));}, expectedId, { timeout: 120000 });
  await page.waitForTimeout(1800);
  const info = await page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    // Capture is not a playtest. Fix state explicitly instead of waiting for
    // the gameplay clock (which may pause during dialogue or on a slow runner).
    if (window.game.scene.isActive('Dialogue')) window.game.scene.stop('Dialogue');
    if (window.game.scene.isPaused('Game')) window.game.scene.resume('Game');
    s.player.frozen=true;
    s.physics.world.pause();
    s.cameras.main.stopFollow();
    s.color.complete();
    s.color.update(1);
    return { id: s.level.id, objects: s.children.length, chest: s.level.entities.find(e=>e.type==='chest')?.col, organicCoffer: s.data.get('organicCoffer'), organicFaces: s.data.get('organicFaces'), organicCofferSource:s.data.get('organicCofferSource'), organicSurfaces:s.data.get('organicSurfaces'), organicMode:s.data.get('organicMode'), authoredIslands:s.data.get('organicAuthoredIslands'), authoredWalls:s.data.get('organicAuthoredWalls'), authoredGround:s.data.get('organicAuthoredGround'), islandCandidates:(()=>{const runs=[];const l=s.level;const solid=(c,r)=>c<0||c>=l.cols||(r>=0&&r<l.rows&&l.tiles[r][c]===1);for(let r=0;r<l.rows;r++){let start=-1;for(let c=0;c<=l.cols;c++){const lone=c<l.cols&&solid(c,r)&&!solid(c,r-1)&&!solid(c,r+1);if(lone&&start<0)start=c;if(!lone&&start>=0){if(c-start>=2&&c-start<=4&&start>0&&c<l.cols&&!solid(start-1,r)&&!solid(c,r))runs.push({col:start,row:r,length:c-start});start=-1;}}}return runs;})(), organicFaceBytes:s.data.get('organicFaceBytes'), cols:s.level.cols, staticGeometry:['solids','oneways','hazards'].map(key=>s[key].getChildren().map(z=>[z.body.x,z.body.y,z.body.width,z.body.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3])) };
  });
  if(index<3 && label==='organic' && (!info.organicFaces || !(info.organicSurfaces>0) || info.organicMode!=='organic' || !(info.organicFaceBytes>0))) throw Error('Organic renderer fallback: '+JSON.stringify(info));
  if(index===2 && label==='organic' && (!info.organicCoffer || info.organicCofferSource!=='authored')) throw Error('Missing authored coffer: '+info.organicCofferSource);
  if(index<3 && label==='organic' && JSON.stringify(info.authoredIslands)!==JSON.stringify(info.islandCandidates))throw Error('Authored island coverage mismatch: '+JSON.stringify({id:info.id,actual:info.authoredIslands,expected:info.islandCandidates}));
  if(index<3 && label==='organic' && !info.authoredWalls.length)throw Error('Missing authored walls in '+info.id);
  if(index<3 && label==='organic' && !info.authoredGround.length)throw Error('Missing authored ground in '+info.id);
  if(index<3 && label==='baseline' && (info.organicFaces||info.organicCoffer||info.authoredWalls.length||info.authoredGround.length)) throw Error('Baseline unexpectedly uses organic terrain');
  if(index===3 && ['organic','baseline'].includes(label) && info.organicMode!=='painted-arena') throw Error('Arena paint not preserved');
  fs.writeFileSync(path.join(out,info.id+'_renderer.json'),JSON.stringify(info,null,2));
  if(index===2 && (label==='organic'||label==='baseline') && info.chest!==undefined) stops=[8,62,150,Math.max(1,info.chest-4),info.chest+2,info.chest+9];
  if(index<3 && ['organic','baseline'].includes(label) && info.islandCandidates.length)stops.push(info.islandCandidates[0].col+1);
  stops=[...new Set(stops.map(c=>Math.max(1,Math.min(info.cols-2,c))))];
  for (const col of stops) {
    await page.evaluate((col) => {
      const s = window.game.scene.getScene('Game');
      const h = s.player.hit;
      // pousa Íris no chão dessa coluna (ou a deixa no ar sobre um buraco)
      let row = s.level.rows - 3;
      for (let r = 1; r < s.level.rows; r++) if (s.level.tiles[r][col] === 1 && s.level.tiles[r - 1][col] === 0) { row = r; break; }
      s.player.frozen = true;
      s.physics.world.pause();
      h.body.allowGravity = false;
      h.body.reset(col * 64 + 32, row * 64 - 46);
      s.cameras.main.stopFollow();
      s.cameras.main.centerOn(col * 64 + 32, row * 64 - 46);
      s.color.complete(); s.color.update(1);
      if(s.color.value<.998)throw Error('Capture saturation not synchronized');
    }, col);
    // Two rendered frames after the state change, rather than gameplay time.
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(out, `${info.id}_c${String(col).padStart(3, '0')}.png`) });
  }
  console.log(`fase ${info.id}: ${stops.length} captura(s), ${info.objects} objetos em cena`);
}
if (errors.length) console.log('erros no console:\n' + [...new Set(errors)].slice(0, 10).join('\n'));
console.log(`capturas em ${out}`);
if(errors.length)process.exitCode=1;
} finally {
  await browser.close();
  await server.close();
}
