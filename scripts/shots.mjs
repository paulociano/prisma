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
await page.goto('http://localhost:5199/?debug'+(label==='organic'||label==='organic-low'?'&organic=1&plates=0':label==='baseline'?'&organic=0':''));
await page.waitForFunction(() => window.game?.scene.isActive('Title'), null, { timeout: 120000 });
if(label==='organic-low')await page.evaluate(async()=>{const {setSettings}=await import('/src/systems/Settings.ts');setSettings({quality:'low',reduceMotion:true});});

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
  const info = await page.evaluate(async () => {
    const {organicRampPlans,organicVistaPlan,rootSanctuaryPlan}=await import('/src/levels/ArtGeometry.ts');
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
    return { id: s.level.id, objects: s.children.length, chest: s.level.entities.find(e=>e.type==='chest')?.col, organicCoffer: s.data.get('organicCoffer'), organicFaces: s.data.get('organicFaces'), organicCofferSource:s.data.get('organicCofferSource'), organicSurfaces:s.data.get('organicSurfaces'), organicMode:s.data.get('organicMode'), atmosphereLayers:s.data.get('organicAtmosphereLayers'), vista:s.data.get('organicVista'), vistaObjects:s.data.get('organicVistaObjects'), organicForeground:s.data.get('organicForeground'), rootSanctuary:s.data.get('organicRootSanctuary'), rootCandidate:rootSanctuaryPlan(s.level)??null, rootSanctuaryBehind:s.world.list[0]?.getData('rootSanctuary')===true, rootSkirt:(()=>{const img=s.world.list.find(o=>o.getData('rootSanctuarySkirt')===true);const p=s.data.get('organicRootSanctuary');if(!img||!p)return null;const src=img.texture.getSourceImage();const data=src.getContext('2d').getImageData(0,0,src.width,src.height).data;let visible=0,outside=0,top=0;for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++){if(!data[(y*src.width+x)*4+3])continue;visible++;if(y===0)top++;if(s.level.tiles[Math.floor((img.y+y)/64)]?.[Math.floor((img.x+x)/64)]!==1)outside++;}return {visible,outside,top,aligned:img.y===p.groundRow*64,aboveBackground:s.world.list.indexOf(img)>0};})(), rootClearAlpha:(()=>{const p=s.data.get('organicRootSanctuary');if(!p)return null;const img=s.world.list[0];const src=img.texture.getSourceImage();const g=src.getContext('2d');return Math.max(...g.getImageData(p.clear.x-p.x+10,p.clear.y-p.y+10,8,8).data.filter((_,i)=>i%4===3));})(), foregroundBounds:s.fgTop&&s.fgBot?{top:s.fgTop.y+s.fgTop.height,bottom:s.fgBot.y}:null, vistaCandidate:organicVistaPlan(s.level)??null, vistaLandmarkAvailable:!!s.landmark, lanternLights:s.data.get('organicLanternLights'), architectureContacts:s.data.get('organicArchitectureContacts'), lanternCandidates:s.decor.list.filter(o=>o.texture?.key==='w1_props'&&String(o.frame?.name)==='2'&&o.y>=16).length, architectureCandidates:s.decor.list.filter(o=>o.texture?.key==='w1_props'&&['0','8'].includes(String(o.frame?.name))&&o.y>=16).length, authoredIslands:s.data.get('organicAuthoredIslands'), authoredWalls:s.data.get('organicAuthoredWalls'), authoredGround:s.data.get('organicAuthoredGround'), authoredRamps:s.data.get('organicAuthoredRamps'), authoredCorners:s.data.get('organicAuthoredCorners'), rampCandidates:organicRampPlans(s.level), rampContacts:organicRampPlans(s.level).map(q=>[.5,32,63.5,64.5,96,127.5].map(dx=>s.rampSurface(q.col*64+dx,q.row,s.level.tiles[q.row][q.col+Math.floor(dx/64)]))), islandCandidates:(()=>{const runs=[];const l=s.level;const solid=(c,r)=>c<0||c>=l.cols||(r>=0&&r<l.rows&&l.tiles[r][c]===1);for(let r=0;r<l.rows;r++){let start=-1;for(let c=0;c<=l.cols;c++){const lone=c<l.cols&&solid(c,r)&&!solid(c,r-1)&&!solid(c,r+1);if(lone&&start<0)start=c;if(!lone&&start>=0){if(c-start>=2&&c-start<=4&&start>0&&c<l.cols&&!solid(start-1,r)&&!solid(c,r))runs.push({col:start,row:r,length:c-start});start=-1;}}}return runs;})(), organicFaceBytes:s.data.get('organicFaceBytes'), cols:s.level.cols, staticGeometry:['solids','oneways','hazards'].map(key=>s[key].getChildren().map(z=>[z.body.x,z.body.y,z.body.width,z.body.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3])) };
  });
  if(index<3 && label==='organic' && (!info.organicFaces || !(info.organicSurfaces>0) || info.organicMode!=='organic' || !(info.organicFaceBytes>0))) throw Error('Organic renderer fallback: '+JSON.stringify(info));
  if(index===2 && label==='organic' && (!info.organicCoffer || info.organicCofferSource!=='authored')) throw Error('Missing authored coffer: '+info.organicCofferSource);
  if(index<3 && label==='organic' && JSON.stringify(info.authoredIslands)!==JSON.stringify(info.islandCandidates))throw Error('Authored island coverage mismatch: '+JSON.stringify({id:info.id,actual:info.authoredIslands,expected:info.islandCandidates}));
  if(index<3 && label==='organic' && !info.authoredWalls.length)throw Error('Missing authored walls in '+info.id);
  if(index<3 && label==='organic' && !info.authoredGround.length)throw Error('Missing authored ground in '+info.id);
  if(index<3 && label==='organic' && info.atmosphereLayers!==2)throw Error('Atmosphere missing '+info.id);
  if(index===2&&label==='organic'&&(!info.rootCandidate||JSON.stringify(info.rootSanctuary)!==JSON.stringify(info.rootCandidate)||!info.rootSanctuaryBehind||info.rootClearAlpha!==0))throw Error('Root sanctuary not safely composed');
  if(index===2&&label==='organic'&&(!info.rootSkirt||info.rootSkirt.visible===0||info.rootSkirt.outside!==0||info.rootSkirt.top!==0||!info.rootSkirt.aligned||!info.rootSkirt.aboveBackground))throw Error('Root skirt not safely integrated');
  if((index!==2||label!=='organic')&&info.rootSkirt)throw Error('Unexpected root skirt');
  if((index!==2||label!=='organic')&&info.rootSanctuary)throw Error('Unexpected root sanctuary');
  if(index<3&&label==='organic'&&(!info.organicForeground||!info.foregroundBounds||info.foregroundBounds.top>96||info.foregroundBounds.bottom<648))throw Error('Foreground readability guard missing '+info.id);
  if((label==='baseline'||label==='organic-low'||index===3)&&info.organicForeground)throw Error('Unexpected foreground guard '+info.id);
  if(index<3&&label==='organic'&&info.vistaCandidate&&info.vistaLandmarkAvailable&&(JSON.stringify(info.vista)!==JSON.stringify(info.vistaCandidate)||info.vistaObjects<1))throw Error('Vista composition missing '+info.id);
  if((label==='baseline'||label==='organic-low'||index===3)&&(info.vista||info.vistaObjects))throw Error('Unexpected vista '+info.id);
  if(index<3&&label==='organic'&&(info.lanternLights!==info.lanternCandidates||info.architectureContacts!==info.architectureCandidates))throw Error('Organic prop lighting coverage mismatch '+info.id);
  if((label==='baseline'||label==='organic-low'||index===3)&&(info.lanternLights||info.architectureContacts))throw Error('Unexpected prop lighting '+info.id);
  if((label==='baseline'||label==='organic-low'||index===3)&&info.atmosphereLayers!==0)throw Error('Unexpected atmosphere '+info.id);
  if(label==='organic-low'&&info.organicMode!=='organic')throw Error('Low quality must retain organic terrain');
  if(index<3 && label==='organic' && JSON.stringify(info.authoredRamps)!==JSON.stringify(info.rampCandidates))throw Error('Missing organic ramp in '+info.id);
  if(index<3 && label==='baseline' && (info.organicFaces||info.organicCoffer||info.authoredWalls.length||info.authoredGround.length)) throw Error('Baseline unexpectedly uses organic terrain');
  if(index===3 && ['organic','baseline'].includes(label) && info.organicMode!=='painted-arena') throw Error('Arena paint not preserved');
  fs.writeFileSync(path.join(out,info.id+'_renderer.json'),JSON.stringify(info,null,2));
  if(index===2 && (label==='organic'||label==='baseline') && info.chest!==undefined) stops=[8,62,150,Math.max(1,info.chest-4),info.chest+2,info.chest+9];
  if(index<3 && ['organic','baseline'].includes(label) && info.islandCandidates.length)stops.push(info.islandCandidates[0].col+1);
  if(index<3 && ['organic','baseline'].includes(label)&&info.rampCandidates.length)stops.push(info.rampCandidates[0].col+1);
  if(index<3&&['organic','baseline'].includes(label)&&info.vistaCandidate)stops.push(info.vistaCandidate.col);
  stops=[...new Set(stops.map(c=>Math.max(1,Math.min(info.cols-2,c))))];
  if(label==='organic-low')stops=stops.slice(0,1);
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
// Test the real plate and a rejected blank texture in the existing visual CI.
if(label==='organic'&&wanted.includes(0)){
  const report=[];
  for(const invalid of [false,true]){
    await page.goto('http://localhost:5199/?debug');
    await page.waitForFunction(()=>window.game?.scene.isActive('Title'),null,{timeout:120000});
    await page.evaluate(invalid=>{
      const game=window.game,key='w1_plate_1-1_chunk_001';
      if(!game.textures.exists(key))throw Error('Authored plate missing');
      if(invalid){game.textures.remove(key);game.textures.createCanvas(key,1280,160).refresh();}
      game.scene.getScenes(true).forEach(s=>game.scene.stop(s.scene.key));
      game.scene.start('Game',{level:0});
    },invalid);
    await page.waitForFunction(()=>{
      const s=window.game.scene.getScene('Game');
      return s?.level?.id==='1-1'&&s?.player?.hit?.body&&s?.color&&(window.game.scene.isActive('Game')||window.game.scene.isPaused('Game'));
    },null,{timeout:120000});
    const result=await page.evaluate(()=>{
      const game=window.game,s=game.scene.getScene('Game');
      if(game.scene.isActive('Dialogue'))game.scene.stop('Dialogue');
      if(game.scene.isPaused('Game'))game.scene.resume('Game');
      s.player.frozen=true;s.physics.world.pause();s.cameras.main.stopFollow();
      s.color.complete();s.color.update(1);
      s.player.hit.body.allowGravity=false;s.player.hit.body.reset(8*64+32,10*64-46);
      s.cameras.main.centerOn(8*64+32,10*64-46);
      return {accepted:s.data.get('terrainPlates'),rejected:s.data.get('terrainPlateRejected'),mode:s.data.get('organicMode'),
        geometry:['solids','oneways','hazards'].map(key=>s[key].getChildren().map(z=>[z.body.x,z.body.y,z.body.width,z.body.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3]))};
    });
    const base=JSON.parse(fs.readFileSync('.debug/shots/baseline/1-1_renderer.json','utf8'));
    report.push({invalid,...result});
    fs.writeFileSync(path.join(out,'terrain-plates-report.json'),JSON.stringify(report,null,2));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,invalid?'plate-invalid.png':'plate-authored.png')});
    if(JSON.stringify(result.geometry)!==JSON.stringify(base.staticGeometry))throw Error('Terrain plate physics regression');
    if(result.mode!=='organic')throw Error('Organic renderer missing in plate mode');
    if(!invalid&&!result.accepted.includes('chunk_001'))throw Error('Authored plate rejected: '+JSON.stringify(result.rejected));
    if(invalid&&(result.accepted.includes('chunk_001')||!result.rejected.includes('chunk_001:alpha-or-size')))throw Error('Invalid plate did not fall back');
    if(!Array.from({length:11},(_,i)=>'chunk_'+String(i+2).padStart(3,'0')).every(id=>result.accepted.includes(id)))throw Error('Continuous Vale masters rejected: '+JSON.stringify(result.rejected));
    if(!invalid){
      for(const col of [35,65,80,100,125,138,140,170,190,201,218,222]){
        await page.evaluate(col=>{const s=window.game.scene.getScene('Game');s.player.hit.body.allowGravity=false;s.player.hit.body.reset(col*64+32,10*64-46);s.cameras.main.centerOn(col*64+32,10*64-46);},col);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.screenshot({path:path.join(out,'vale-master-c'+col+'.png')});
      }
    }
  }
}
// Two independent authored opening masses in Trilha das Lanternas.
if(label==='organic'&&wanted.includes(1)){
  await page.goto('http://localhost:5199/?debug');
  await page.waitForFunction(()=>window.game?.scene.isActive('Title'),null,{timeout:120000});
  await page.evaluate(()=>{
    const g=window.game;
    for(const id of ['001','002'])if(!g.textures.exists('w1_plate_1-2_chunk_'+id))throw Error('Lantern terrain plate missing '+id);
    g.scene.getScenes(true).forEach(s=>g.scene.stop(s.scene.key));
    g.scene.start('Game',{level:1});
  });
  await page.waitForFunction(()=>{const s=window.game.scene.getScene('Game');return s?.level?.id==='1-2'&&s?.player?.hit?.body&&s?.color&&(window.game.scene.isActive('Game')||window.game.scene.isPaused('Game'));},null,{timeout:120000});
  const result=await page.evaluate(()=>{
    const g=window.game,s=g.scene.getScene('Game');
    if(g.scene.isActive('Dialogue'))g.scene.stop('Dialogue');
    if(g.scene.isPaused('Game'))g.scene.resume('Game');
    s.player.frozen=true;s.physics.world.pause();s.cameras.main.stopFollow();s.color.complete();s.color.update(1);
    const blends=s.data.get('terrainBlends');const blend=blends?.[0];const tex=blend&&g.textures.get(blend.key).getSourceImage();const ctx=tex?.getContext('2d');const alpha=ctx&&[0,48,96,320,1000].map(x=>ctx.getImageData(x,200,1,1).data[3]);return {blends,alpha,accepted:s.data.get('terrainPlates'),rejected:s.data.get('terrainPlateRejected'),geometry:['solids','oneways','hazards'].map(key=>s[key].getChildren().map(z=>[z.body.x,z.body.y,z.body.width,z.body.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3]))};
  });
  fs.writeFileSync(path.join(out,'lantern-plates-report.json'),JSON.stringify(result,null,2));
  const baseline=JSON.parse(fs.readFileSync('.debug/shots/baseline/1-2_renderer.json','utf8'));
  if(JSON.stringify(result.geometry)!==JSON.stringify(baseline.staticGeometry))throw Error('Lantern plates physics regression');
  for(const col of [6,14,22]){
    await page.evaluate(col=>{const s=window.game.scene.getScene('Game');s.player.hit.body.allowGravity=false;s.player.hit.body.reset(col*64+32,20*64-46);s.cameras.main.centerOn(col*64+32,20*64-46);},col);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,'lantern-plate-c'+col+'.png')});
  }
  if(result.blends?.[0]?.id!=='chunk_007'||!result.alpha||result.alpha[0]>4||result.alpha[1]<100||result.alpha[1]>155||result.alpha[2]<250||result.alpha[3]<250||result.alpha[4]!==0)throw Error('Lantern blend failed: '+JSON.stringify({blends:result.blends,alpha:result.alpha}));
  for(const col of [117,119,124,130]){
    await page.evaluate(col=>{const s=window.game.scene.getScene('Game');s.cameras.main.centerOn(col*64+32,18*64-46);},col);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,'lantern-blend-c'+col+'.png')});
  }
  if(!['chunk_001','chunk_002'].every(id=>result.accepted.includes(id)))throw Error('Lantern plates rejected: '+JSON.stringify(result.rejected));
}
// Root Bridge: an authored mass and its separated floating island.
if(label==='organic'&&wanted.includes(2)){
  await page.goto('http://localhost:5199/?debug&macro=0');
  await page.waitForFunction(()=>window.game?.scene.isActive('Title'),null,{timeout:120000});
  await page.evaluate(()=>{
    const g=window.game;
    if(!g.textures.exists('w1_plate_1-3_chunk_005'))throw Error('Root terrain plate missing');
    g.scene.getScenes(true).forEach(s=>g.scene.stop(s.scene.key));
    g.scene.start('Game',{level:2});
  });
  await page.waitForFunction(()=>{const s=window.game.scene.getScene('Game');return s?.level?.id==='1-3'&&s?.player?.hit?.body&&s?.color&&(window.game.scene.isActive('Game')||window.game.scene.isPaused('Game'));},null,{timeout:120000});
  const result=await page.evaluate(()=>{
    const g=window.game,s=g.scene.getScene('Game');
    if(g.scene.isActive('Dialogue'))g.scene.stop('Dialogue');
    if(g.scene.isPaused('Game'))g.scene.resume('Game');
    s.player.frozen=true;s.physics.world.pause();s.cameras.main.stopFollow();s.color.complete();s.color.update(1);
    return {bridges:s.data.get('terrainTowerBridges'),pillars:s.data.get('terrainTowerPillars'),accepted:s.data.get('terrainPlates'),rejected:s.data.get('terrainPlateRejected'),geometry:['solids','oneways','hazards'].map(key=>s[key].getChildren().map(z=>[z.body.x,z.body.y,z.body.width,z.body.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3]))};
  });
  fs.writeFileSync(path.join(out,'root-plates-report.json'),JSON.stringify(result,null,2));
  const baseline=JSON.parse(fs.readFileSync('.debug/shots/baseline/1-3_renderer.json','utf8'));
  if(JSON.stringify(result.geometry)!==JSON.stringify(baseline.staticGeometry))throw Error('Root plates physics regression');
  for(const [col,row] of [[84,19],[93,17]]){
    await page.evaluate(([col,row])=>{const s=window.game.scene.getScene('Game');s.player.hit.body.allowGravity=false;s.player.hit.body.reset(col*64+32,row*64-46);s.cameras.main.centerOn(col*64+32,row*64-46);},[col,row]);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,'root-plate-c'+col+'.png')});
  }
  if(JSON.stringify(result.pillars?.map(p=>[p.id,p.col,p.row,p.height]))!==JSON.stringify([['suspended',131,3,768],['anchored',142,3,1088]]))throw Error('Tower pillars missing: '+JSON.stringify(result.pillars));
  if(result.bridges?.length!==9||result.bridges.reduce((n,p)=>n+p.length,0)!==38||result.bridges[0].width!==896)throw Error('Root tower bridges missing: '+JSON.stringify(result.bridges));
  for(const [col,row] of [[136,2],[136,5],[136,11],[136,18]]){
    await page.evaluate(([col,row])=>{const s=window.game.scene.getScene('Game');s.player.hit.body.allowGravity=false;s.player.hit.body.reset(col*64+32,row*64-46);s.cameras.main.centerOn(col*64+32,row*64-46);},[col,row]);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,'root-tower-r'+row+'.png')});
  }
  if(!result.accepted.includes('chunk_005'))throw Error('Root plate rejected: '+JSON.stringify(result.rejected));
}
// Unified tower: same gameplay, one authored image instead of separate pieces.
if(label==='organic'&&wanted.includes(2)){
  await page.goto('http://localhost:5199/?debug');
  await page.waitForFunction(()=>window.game?.scene.isActive('Title'),null,{timeout:120000});
  await page.evaluate(()=>{const g=window.game;g.scene.getScenes(true).forEach(s=>g.scene.stop(s.scene.key));g.scene.start('Game',{level:2});});
  await page.waitForFunction(()=>{const s=window.game.scene.getScene('Game');return s?.level?.id==='1-3'&&s?.player?.hit?.body&&s?.color&&(window.game.scene.isActive('Game')||window.game.scene.isPaused('Game'));},null,{timeout:120000});
  const result=await page.evaluate(()=>{
    const g=window.game,s=g.scene.getScene('Game');
    if(g.scene.isActive('Dialogue'))g.scene.stop('Dialogue');
    if(g.scene.isPaused('Game'))g.scene.resume('Game');
    s.player.frozen=true;s.physics.world.pause();s.cameras.main.stopFollow();s.color.complete();s.color.update(1);
    return {macro:s.data.get('terrainTowerMacro'),pillars:s.data.get('terrainTowerPillars'),bridges:s.data.get('terrainTowerBridges'),
      geometry:['solids','oneways','hazards'].map(key=>s[key].getChildren().map(z=>[z.body.x,z.body.y,z.body.width,z.body.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3]))};
  });
  fs.writeFileSync(path.join(out,'root-macro-report.json'),JSON.stringify(result,null,2));
  const baseline=JSON.parse(fs.readFileSync('.debug/shots/baseline/1-3_renderer.json','utf8'));
  if(JSON.stringify(result.geometry)!==JSON.stringify(baseline.staticGeometry))throw Error('Macro physics regression');
  if(result.macro?.solidCells!==29||result.macro?.onewayCells!==38||result.pillars?.length||result.bridges?.length)throw Error('Macro not active or old pieces duplicated: '+JSON.stringify(result.macro));
  for(const [col,row] of [[136,2],[136,6],[136,12],[136,19]]){
    await page.evaluate(([col,row])=>{const s=window.game.scene.getScene('Game');s.player.hit.body.allowGravity=false;s.player.hit.body.reset(col*64+32,row*64-46);s.cameras.main.centerOn(col*64+32,row*64-46);},[col,row]);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,'root-macro-r'+row+'.png')});
  }
}
if (errors.length) console.log('erros no console:\n' + [...new Set(errors)].slice(0, 10).join('\n'));
console.log(`capturas em ${out}`);
if(errors.length)process.exitCode=1;
} finally {
  await browser.close();
  await server.close();
}
