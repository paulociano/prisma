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
  for(const {invalid,flat,platformsOff,materialsOff=false} of [{invalid:false,flat:false,platformsOff:false},{invalid:true,flat:false,platformsOff:false},{invalid:false,flat:true,platformsOff:false},{invalid:false,flat:false,platformsOff:true},{invalid:false,flat:false,platformsOff:false,materialsOff:true}]){
    await page.goto('http://localhost:5199/?debug'+(flat?'&contours=0':'')+(platformsOff?'&platforms=0':'')+(materialsOff?'&materials=0':''));
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
      s.player.hit.body.allowGravity=false;
      const x=8*64+32,ground=s.surfaceBelow(x,0),y=ground>=0?ground-s.player.body.height/2:10*64-46;
      s.player.hit.body.reset(x,y);s.player.syncView(0);
      s.cameras.main.centerOn(x,y);
      s.cameras.main.fadeEffect.reset();
      const flatten=o=>[o,...(Array.isArray(o.list)?o.list.flatMap(flatten):[])];
      const volumes=flatten(s.world).filter(o=>o.getData?.('platformVolume')).map(o=>{
        const p=o.getData('platformVolume'),src=o.texture.getSourceImage(),g=src.getContext('2d');
        const a=g.getImageData(0,0,src.width,src.height).data;
        let visible=0,hazard=0;
        const x0=o.x-o.displayWidth*o.originX,y0=o.y-o.displayHeight*o.originY;
        for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++)if(a[(y*src.width+x)*4+3]>24){
          visible++;
          if(p.kind!=='mover'&&s.level.tiles[Math.floor((y0+y)/64)]?.[Math.floor((x0+x)/64)]===3)hazard++;
        }
        return {...p,x:o.x,y:o.y,visible,hazard,registered:Math.abs(o.displayHeight*o.originY-p.above)<.001&&o.originX===.5};
      });
      s.syncMoverViews();
      const moverContacts=s.movers.map(m=>({volume:!!m.view.getData('platformVolume'),width:m.zone.body.width,dx:m.view.x-m.zone.x,dy:m.view.y-(m.zone.y-10)}));
      const depth=s.data.get('pictorialDepth');
      let depthProbe=null;
      if(depth){
        const cam=s.cameras.main,old=[cam.scrollX,cam.scrollY,cam.zoom];
        const sample=()=>{s.updatePictorialDepth(cam);return {scroll:cam.scrollX,frame:s.data.get('pictorialDepthFrame'),far:s.bgFar.tilePositionX,mid:s.bgMid.tilePositionX,near:s.bgNear.tilePositionX,top:s.fgTop?{alpha:s.fgTop.alpha,visible:s.fgTop.visible,offset:s.fgTop.tilePositionX,edge:s.fgTop.y+s.fgTop.height}:null,bottom:s.fgBot?{alpha:s.fgBot.alpha,visible:s.fgBot.visible,offset:s.fgBot.tilePositionX,edge:s.fgBot.y}:null};};
        const first=sample();
        cam.setScroll(cam.scrollX+160,cam.scrollY);cam.setZoom(1.2);
        const second=sample();
        cam.setScroll(old[0],old[1]);cam.setZoom(old[2]);s.updatePictorialDepth(cam);
        depthProbe={first,second,haze:!!s.haze,backgroundDepth:s.bgContainer.depth,terrainDepth:s.world.depth};
      }
      const materialStats=s.data.get('pictorialMaterials');
      const materialObjects=flatten(s.world).filter(o=>o.getData?.('pictorialMaterial')).map(o=>({kind:o.getData('terrainPlate')?'terrain':o.getData('platformVolume')?.kind, ...o.getData('pictorialMaterial')}));
      let lightingProbe=null;
      const lightingDiagnostic={initialized:!!s.localMaterialLights,stats:s.data.get('materialLighting'),registered:materialObjects.length,scanned:0,eligible:0};
      if(s.localMaterialLights){
        const lighting=s.localMaterialLights;
        lighting.update(0,[],0,0,true);
        // Search a real opaque, non-saturated sample across all registered
        // terrain plates. Do not assume the first crop has such a pixel.
        for(const target of flatten(s.world).filter(o=>o.getData?.('pictorialMaterial')&&o.getData('terrainPlate'))){
          const ctx=target.texture.getContext(),w=target.width,h=target.height;
          const base=ctx.getImageData(0,0,w,h).data;
          lightingDiagnostic.scanned++;
          let at=-1;
          for(let y=8;y<h-8&&at<0;y++)for(let x=8;x<w-8;x++){
            const i=(y*w+x)*4;
            if(base[i+3]===255&&Math.min(base[i],base[i+1],base[i+2])<225){at=i/4;break;}
          }
          if(at>=0){
            lightingDiagnostic.eligible++;
            const x=target.x-target.originX*w+at%w+.5,y=target.y-target.originY*h+Math.floor(at/w)+.5;
            lighting.update(0,[{x,y,radius:48,intensity:.5,color:[1,.8,.6]}],x,y,true);
            const stats={...s.data.get('materialLighting')};
            const perfBefore={...s.data.get('materialLightingPerf')};
            lighting.update(0,[{x,y,radius:48,intensity:.5,color:[1,.8,.6]}],x,y,true);
            const perfAfter={...s.data.get('materialLightingPerf')};
            const cacheProbe={skipped:perfAfter.skipped-perfBefore.skipped,uploadBytes:perfAfter.uploadBytes-perfBefore.uploadBytes,updates:perfAfter.updates-perfBefore.updates};
            const lit=ctx.getImageData(0,0,w,h).data;
            let changed=0,alpha=0;
            for(let i=0;i<base.length;i+=4){if(base[i+3]!==lit[i+3])alpha++;if(base[i]!==lit[i]||base[i+1]!==lit[i+1]||base[i+2]!==lit[i+2])changed++;}
            lighting.update(0,[],x,y,true);
            const restored=ctx.getImageData(0,0,w,h).data;
            let residual=0;for(let i=0;i<base.length;i++)if(base[i]!==restored[i])residual++;
            lightingProbe={stats,changed,alpha,residual,cacheProbe};
            if(changed)break;
          }
        }
      }
      let livingProbe=null;
      if(s.livingVale){
        const living=s.livingVale,plants=living.plants;
        if(plants.length){
          const focus=plants[0].x;
          living.update(0,focus,1);
          const before=plants.map(p=>p.image.angle);
          for(let i=0;i<15;i++)living.update(.1,focus,1);
          const moved=plants.filter((p,i)=>Math.abs(p.image.angle-before[i])>.05).length;
          const displaced=plants.filter(p=>p.image.x!==p.x||p.image.y!==p.y||p.image.alpha!==1||p.image.originY!==1).length;
          const unsafe=living.pollen.filter(p=>p.image.visible&&s.level.tiles[Math.floor(p.image.y/64)]?.[Math.floor(p.image.x/64)]!==0).length;
          livingProbe={...s.data.get('livingVale'),moved,displaced,unsafe,frame:s.data.get('livingValeFrame')};
          living.update(0,s.player.hit.x,s.color.value);
        }
      }
      let cameraProbe=null;
      if(s.cameraDirector){
        const d=s.cameraDirector,cam=s.cameras.main,p=s.player.hit;
        const before=[p.x,p.y],old=d.pose;
        const held=d.step({x:p.x,vx:340,vy:-900,grounded:false,frozen:true,reduced:false,dt:.1});
        const accessible=d.step({x:p.x,vx:340,vy:-900,grounded:false,frozen:false,reduced:true,dt:.1});
        d.pose=old;
        s.updateCinematicCamera(0);
        const actual=s.data.get('cinematicCamera');
        cameraProbe={zones:d.zones.length,held,old,accessible,actual,zoom:cam.zoom,
          offset:[cam.followOffset.x,cam.followOffset.y],unchanged:before[0]===p.x&&before[1]===p.y};
      }
      const decorPlacement=s.data.get('valeDecorPlacement');
      const groundedDecor=s.decor.list.filter(o=>o.getData('valeGroundedDecor')).map(o=>{const q=o.getData('valeGroundedDecor');return {...q,anchored:o.x===q.col*64+32&&o.y===q.row*64+16&&o.alpha===1&&o.originY===1,supported:s.level.tiles[q.row]?.[q.col]===1&&s.level.tiles[q.row+1]?.[q.col]===1};});
      return {decorPlacement,groundedDecor,cameraProbe,livingProbe,lightingProbe,lightingDiagnostic,materialStats,materialObjects,depth,depthProbe,volumes,moverContacts,accepted:s.data.get('terrainPlates'),rejected:s.data.get('terrainPlateRejected'),mode:s.data.get('organicMode'),finish:s.data.get('terrainFinish'),contours:s.data.get('organicContours'),visualGeometry:s.data.get('visualGeometry'),visualLedges:s.data.get('visualLedges'),onewayArt:s.data.get('organicOneWayCells'),vistaCount:s.data.get('organicVistaObjects'),landmarks:s.children.list.flatMap(o=>Array.isArray(o.list)?o.list:[]).filter(o=>o.getData?.('organicLandmark')).map(o=>o.alpha),
        geometry:['solids','oneways','hazards'].map(key=>s[key].getChildren().map(z=>[z.body.x,z.body.y,z.body.width,z.body.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3]))};
    });
    const base=JSON.parse(fs.readFileSync('.debug/shots/baseline/1-1_renderer.json','utf8'));
    report.push({invalid,flat,platformsOff,materialsOff,...result});
    fs.writeFileSync(path.join(out,'terrain-plates-report.json'),JSON.stringify(report,null,2));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,invalid?'plate-invalid.png':flat?'plate-before-contours.png':platformsOff?'plate-before-platforms.png':materialsOff?'plate-before-materials.png':'plate-authored.png')});
    if(!invalid&&!flat&&!platformsOff&&!materialsOff){
      for(const col of [35,55,58,62,80,100,125,138,140,170,190,201,218,222]){
        await page.evaluate(col=>{
          const s=window.game.scene.getScene('Game'),x=col*64+32;
          const ground=s.surfaceBelow(x,0);
          const y=ground>=0?ground-s.player.body.height/2:10*64-46;
          s.player.hit.body.reset(x,y);s.player.syncView(0);
          s.cameras.main.centerOn(x,y);s.cameras.main.fadeEffect.reset();
        },col);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.screenshot({path:path.join(out,'vale-audit-c'+col+'.png')});
      }
    }
    if(JSON.stringify(result.geometry)!==JSON.stringify(base.staticGeometry))throw Error('Terrain plate physics regression');
    if(result.mode!=='organic')throw Error('Organic renderer missing in plate mode');
    if(!invalid){const p=result.decorPlacement;if(!p?.enabled||!p.startHouseOmitted||!p.grounded||p.grounded!==result.groundedDecor.length||result.groundedDecor.some(o=>!o.anchored||!o.supported||o.frame===0))throw Error('Vale decor grounding regression '+JSON.stringify({placement:p,objects:result.groundedDecor}));}
    if(!invalid){
      const p=result.cameraProbe;
      if(!p||!p.zones||!p.unchanged||p.held.mode!=='held'||p.held.x!==p.old.x||p.held.y!==p.old.y||p.held.zoom!==p.old.zoom||p.accessible.zoom!==1||p.accessible.x!==0||p.actual.zoom!==p.zoom||p.actual.x!==p.offset[0]||p.actual.y!==p.offset[1])throw Error('Cinematic camera contract mismatch '+JSON.stringify(p));
    }
    if(!invalid){const v=result.livingProbe;if(!v||!v.plants||!v.moved||v.displaced||v.unsafe||v.pollen>36||v.depth>=0)throw Error('Living Vale anchor or visibility regression '+JSON.stringify(v));}
    if(materialsOff&&(result.materialStats||result.materialObjects.length||result.lightingProbe))throw Error('Material rollback failed');
    if(!materialsOff&&!invalid){
      const p=result.lightingProbe;
      if(!p||!p.changed||p.alpha||p.residual||p.stats.pixels>160000||p.stats.lights!==1||p.cacheProbe?.skipped!==1||p.cacheProbe?.updates!==0||p.cacheProbe?.uploadBytes!==0)throw Error('Local material lighting probe failed '+JSON.stringify({probe:p,diagnostic:result.lightingDiagnostic}));
    }
    if(!materialsOff){
      const m=result.materialStats;
      if(!m||!m.count||!m.changed||!m.graded||m.failures||m.pixels>10000000||m.count!==result.materialObjects.length)throw Error('Material generation failed '+JSON.stringify(m));
      if(!result.materialObjects.some(o=>o.kind==='terrain'&&o.changed>0))throw Error('Terrain material missing');
      if(!platformsOff&&!invalid&&!result.materialObjects.some(o=>o.kind==='solid'&&o.changed>0))throw Error('Island material missing');
    }
    if(!result.depth||!result.depthProbe)throw Error('Pictorial depth manifest missing');
    const {first,second,haze,backgroundDepth,terrainDepth}=result.depthProbe;
    const moved=second.scroll-first.scroll;
    if(haze||backgroundDepth>=terrainDepth||moved!==160)throw Error('Pictorial depth ordering or redundant haze');
    for(const key of ['far','mid','near']){
      if(Math.abs(second[key]-first[key]-moved*result.depth[key].factor)>.001)throw Error('Parallax mismatch '+key);
    }
    for(const a of [first,second]){
      if(a.top&&(a.top.alpha!==1||a.top.edge!==48||a.top.visible!==a.frame.showTop))throw Error('Top foreground occlusion mismatch');
      if(a.bottom&&(a.bottom.alpha!==1||a.bottom.edge!==676||a.bottom.visible!==a.frame.showBottom))throw Error('Bottom foreground occlusion mismatch');
    }
    if(!flat&&(!result.contours?.enabled||!result.contours.pixels||!result.contours.plates||result.contours.failures))throw Error('Curved plate raster missing: '+JSON.stringify(result.contours));
    if(flat&&(result.contours?.enabled||result.contours?.pixels||result.contours?.plates))throw Error('Contour rollback failed');
    if(platformsOff&&result.volumes.length)throw Error('Platform volume rollback failed');
    if(!platformsOff&&!invalid){
      if(!result.volumes.some(v=>v.kind==='solid'))throw Error('Solid island volumes missing');
      if(!result.volumes.some(v=>v.kind==='solid'&&v.width>256))throw Error('Wide sculpted solid island missing');
      if(result.volumes.filter(v=>v.kind==='ledge').length!==(result.visualLedges??[]).length)throw Error('Free ledge volumes missing');
      if(result.volumes.some(v=>!v.registered||!v.visible||v.hazard))throw Error('Platform volume alpha or pivot regression');
      if(result.moverContacts.some(m=>m.width>=64&&m.width<=512&&Number.isInteger(m.width)&&(!m.volume||Math.abs(m.dx)>.001||Math.abs(m.dy)>.001)))throw Error('Mover volume contact regression');
    }
    if(!invalid&&!result.accepted.includes('chunk_001'))throw Error('Authored plate rejected: '+JSON.stringify(result.rejected));
    if(!invalid&&(!result.finish?.tops||!result.finish?.walls||!result.finish?.islandCells))throw Error('Organic silhouette finish missing: '+JSON.stringify(result.finish));
    if(!invalid&&(result.visualGeometry?.schema!==1||result.visualGeometry.level!=='1-1'||!result.visualGeometry.surfaces.length||!result.visualGeometry.walls.length))throw Error('Visual geometry contract missing');
    if(!invalid&&(result.finish.tops>result.visualGeometry.surfaces.length||result.finish.walls>result.visualGeometry.walls.length||result.finish.ramps>result.visualGeometry.ramps.length))throw Error('Visual finish exceeds spatial plan');
    if(!invalid&&result.onewayArt!==(result.visualLedges??[]).reduce((n,q)=>n+q.length,0))throw Error('One-way visual contract mismatch');
    if(result.vistaCount&&(result.vistaCount!==1||result.landmarks.length!==1||result.landmarks.some(a=>a!==1)))throw Error('Duplicate or translucent organic landmark');
    if(invalid&&(result.accepted.includes('chunk_001')||!result.rejected.includes('chunk_001:alpha-or-size')))throw Error('Invalid plate did not fall back');
    if(!Array.from({length:11},(_,i)=>'chunk_'+String(i+2).padStart(3,'0')).every(id=>result.accepted.includes(id)))throw Error('Continuous Vale masters rejected: '+JSON.stringify(result.rejected));
    if(!invalid&&!platformsOff){
      for(const col of (materialsOff?[35,80]:flat?[35,80,138,201]:[35,65,80,100,125,138,140,170,190,201,218,222])){
        await page.evaluate(col=>{const s=window.game.scene.getScene('Game');s.player.hit.body.allowGravity=false;s.player.hit.body.reset(col*64+32,10*64-46);s.cameras.main.centerOn(col*64+32,10*64-46);},col);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.screenshot({path:path.join(out,(materialsOff?'vale-before-materials-c':flat?'vale-before-contours-c':'vale-master-c')+col+'.png')});
      }
    }
    if(!invalid&&!flat&&!materialsOff){
      const anchors=platformsOff?report[0].volumes:result.volumes;
      for(const kind of ['solid','ledge','mover']){
        const v=anchors.find(q=>q.kind===kind);if(!v)continue;
        await page.evaluate(({x,y})=>{const s=window.game.scene.getScene('Game');s.cameras.main.centerOn(x,y);},{x:v.x,y:v.y});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.screenshot({path:path.join(out,'platform-'+kind+(platformsOff?'-before':'-volume')+'.png')});
      }
    }
  }
}
// Opening masses and the complete connected central Lanterns master.
if(label==='organic'&&wanted.includes(1)){
  await page.goto('http://localhost:5199/?debug');
  await page.waitForFunction(()=>window.game?.scene.isActive('Title'),null,{timeout:120000});
  await page.evaluate(()=>{
    const g=window.game;
    for(const id of Array.from({length:7},(_,i)=>String(i+1).padStart(3,'0')))if(!g.textures.exists('w1_plate_1-2_chunk_'+id))throw Error('Lantern terrain plate missing '+id);
    g.scene.getScenes(true).forEach(s=>g.scene.stop(s.scene.key));
    g.scene.start('Game',{level:1});
  });
  await page.waitForFunction(()=>{const s=window.game.scene.getScene('Game');return s?.level?.id==='1-2'&&s?.player?.hit?.body&&s?.color&&(window.game.scene.isActive('Game')||window.game.scene.isPaused('Game'));},null,{timeout:120000});
  const result=await page.evaluate(()=>{
    const g=window.game,s=g.scene.getScene('Game');
    if(g.scene.isActive('Dialogue'))g.scene.stop('Dialogue');
    if(g.scene.isPaused('Game'))g.scene.resume('Game');
    s.player.frozen=true;s.physics.world.pause();s.cameras.main.stopFollow();s.color.complete();s.color.update(1);
    const blends=s.data.get('terrainBlends');return {blends,accepted:s.data.get('terrainPlates'),rejected:s.data.get('terrainPlateRejected'),geometry:['solids','oneways','hazards'].map(key=>s[key].getChildren().map(z=>[z.body.x,z.body.y,z.body.width,z.body.height]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3]))};
  });
  fs.writeFileSync(path.join(out,'lantern-plates-report.json'),JSON.stringify(result,null,2));
  const baseline=JSON.parse(fs.readFileSync('.debug/shots/baseline/1-2_renderer.json','utf8'));
  if(JSON.stringify(result.geometry)!==JSON.stringify(baseline.staticGeometry))throw Error('Lantern plates physics regression');
  for(const col of [6,14,22]){
    await page.evaluate(col=>{const s=window.game.scene.getScene('Game');s.player.hit.body.allowGravity=false;s.player.hit.body.reset(col*64+32,20*64-46);s.cameras.main.centerOn(col*64+32,20*64-46);},col);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,'lantern-plate-c'+col+'.png')});
  }
  if(result.blends?.length)throw Error('Completed Lantern master must not use transitional overlay');
  for(const col of [40,55,65,75,90,100,110,117,119,124,130]){
    await page.evaluate(col=>{const s=window.game.scene.getScene('Game');s.cameras.main.centerOn(col*64+32,18*64-46);},col);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(out,'lantern-master-c'+col+'.png')});
  }
  if(!Array.from({length:7},(_,i)=>'chunk_'+String(i+1).padStart(3,'0')).every(id=>result.accepted.includes(id)))throw Error('Lantern plates rejected: '+JSON.stringify(result.rejected));
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
