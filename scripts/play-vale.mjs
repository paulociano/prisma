// Production browser smoke. Scene launch is a fixture; subsequent movement,
// jumps, attack, pause and restart use keyboard input, not body teleportation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { preview } from 'vite';
import { chromium } from 'playwright-core';
const out='.debug/vale-play';
fs.mkdirSync(out,{recursive:true});
const server=await preview({preview:{port:5202,strictPort:true},logLevel:'error'});
let browser;
const report={scenario:'Vale opening and isolated regional fixtures, production bundle, fresh browser context per renderer, keyboard controls, normal physics',modes:{}};
const save=()=>fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
try{
 browser=await chromium.launch({
  ...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),
  args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
 });
 for(const organic of [false,true]){
  const name=organic?'organic':'legacy';
  const context=await browser.newContext({viewport:{width:1280,height:720}});
  const page=await context.newPage();
  const result=report.modes[name]={steps:[],errors:[]};
  page.on('pageerror',e=>result.errors.push(String(e)));
  const mark=(step,data)=>{result.steps.push({step,...data});save();};
  const state=()=>page.evaluate(()=>{
   const s=window.game.scene.getScene('Game'),p=s.player,b=p.body;
   return {x:p.hit.x,y:p.hit.y,bottom:b.bottom,vx:b.velocity.x,vy:b.velocity.y,ground:p.onGround,hp:p.hp,
    frozen:p.frozen,dead:p.dead,color:s.color.value,mode:s.data.get('organicMode'),plates:s.data.get('terrainPlates')?.length??0,
    camera:s.data.get('cinematicCamera')??null,zoom:s.cameras.main.zoom,paused:s.physics.world.isPaused};
  });
  const wait=async(fn,arg)=>page.waitForFunction(fn,arg,{timeout:60000});
  const grounded=()=>wait(()=>{const s=window.game.scene.getScene('Game'),p=s.player;return p&&!p.frozen&&!p.dead&&p.onGround&&Math.abs(p.body.velocity.x)<2&&Math.abs(p.body.velocity.y)<2;});
  const key=async(k,fn,arg)=>{await page.keyboard.down(k);try{await wait(fn,arg);}finally{await page.keyboard.up(k);}};
  try{
   await page.goto('http://localhost:5202/?debug'+(organic?'':'&organic=0'));
   await wait(()=>window.game?.scene.isActive('Title'));
   await page.evaluate(()=>{const g=window.game;g.scene.getScenes(true).forEach(s=>g.scene.stop(s.scene.key));g.scene.start('Game',{level:0});});
   await wait(()=>{const g=window.game,s=g.scene.getScene('Game');return g.scene.isActive('Game')&&s?.level?.id==='1-1'&&s.player?.body&&s.color&&g.scene.isActive('Hud');});
   await grounded();
   const initial=await state();
   assert.equal(initial.mode,organic?'organic':'legacy');assert.equal(initial.plates,organic?12:0);assert.equal(initial.paused,false);
   assert.ok(Math.abs(initial.zoom*110/720-.4)<1e-6,'nominal standing height framing');
   mark('spawn',initial);
   // Keep the first smoke on the safe opening ground, before the first pit.
   await key('ArrowRight',x=>window.game.scene.getScene('Game').player.hit.x>=x,initial.x+128);
   await grounded();
   const walked=await state();assert.ok(walked.x>=initial.x+128&&walked.x<initial.x+260);assert.equal(walked.hp,initial.hp);
   mark('walk',walked);
   // Collect observations via the real scene update event while input drives physics.
   await page.evaluate(()=>{
    const s=window.game.scene.getScene('Game');
    window.valeTrace={minY:s.player.hit.y,maxY:s.player.hit.y,jumps:0,lands:0,attacks:0};
    s.events.on('player-jump',()=>window.valeTrace.jumps++);
    s.events.on('player-land',()=>window.valeTrace.lands++);
    s.events.on('player-attack',()=>window.valeTrace.attacks++);
    s.events.on('postupdate',()=>{const y=s.player.hit.y;window.valeTrace.minY=Math.min(window.valeTrace.minY,y);window.valeTrace.maxY=Math.max(window.valeTrace.maxY,y);});
   });
   await key('Space',()=>{const s=window.game.scene.getScene('Game');return window.valeTrace.jumps>0&&!s.player.onGround&&s.player.body.velocity.y>=0;});
   await grounded();
   const landed=await state(),trace=await page.evaluate(()=>({...window.valeTrace}));
   const height=walked.y-trace.minY;
   assert.ok(height>100&&height<300,'jump height '+height);
   assert.ok(trace.jumps===1&&trace.lands>=1,'jump/land events '+JSON.stringify(trace));
   assert.ok(Math.abs(landed.bottom-walked.bottom)<3);assert.equal(landed.hp,initial.hp);
   assert.equal(landed.zoom,initial.zoom,'fixed zoom after jumping');
   mark('jump-land',{height,trace,...landed});
   await key('x',()=>window.valeTrace.attacks===1);
   mark('attack',await state());
   await key('p',()=>window.game.scene.isActive('Pause')&&window.game.scene.isPaused('Game'));
   const paused=await state();
   // The resume button is real UI in the 1280x720 viewport.
   await page.mouse.click(640,270);
   await wait(()=>window.game.scene.isActive('Game')&&!window.game.scene.isActive('Pause'));
   await grounded();
   const resumed=await state();assert.ok(Math.abs(resumed.x-paused.x)<2&&Math.abs(resumed.y-paused.y)<2);
   mark('pause-resume',resumed);
   await page.screenshot({path:out+'/'+name+'-before-restart.png'});
   await page.evaluate(()=>{window.valeOldPlayer=window.game.scene.getScene('Game').player;});
   await key('r',()=>{const g=window.game,s=g.scene.getScene('Game');return g.scene.isActive('Game')&&s.player!==window.valeOldPlayer&&!!s.player?.body&&!!s.color;});
   await grounded();
   const restarted=await state();assert.ok(Math.abs(restarted.x-initial.x)<3&&Math.abs(restarted.bottom-initial.bottom)<3);
   assert.equal(restarted.hp,initial.hp);assert.equal(restarted.mode,initial.mode);assert.equal(restarted.plates,initial.plates);
   mark('restart',restarted);
   await page.screenshot({path:out+'/'+name+'-after-restart.png'});
   // Independent regional fixtures: only the starting location is set.
   // Actual movement, one-way collision, overlap and persistence remain live.
   const fixture=async(x,y)=>page.evaluate(({x,y})=>{
    const s=window.game.scene.getScene('Game');s.player.respawn(x,y);s.player.syncView(0);
    s.resetCinematicCamera();s.cameras.main.fadeEffect.reset();
   },{x,y});
   const ledge=await page.evaluate(()=>{
    const s=window.game.scene.getScene('Game'),l=s.level;
    for(let r=1;r<l.rows-2;r++)for(let c=2;c<l.cols-2;c++){
      if(l.tiles[r][c]===2&&l.tiles[r][c-1]===2&&l.tiles[r][c+1]===2&&l.tiles[r+1][c]===0&&l.tiles[r+2][c]===1&&l.tiles[r-1][c]===0)
        return {x:c*64+32,y:r*64,ground:(r+2)*64,col:c,row:r};
    }
    return null;
   });
   assert.ok(ledge,'No suitable one-way fixture');
   await fixture(ledge.x,ledge.ground-46);
   await grounded();
   assert.ok(Math.abs((await state()).bottom-ledge.ground)<3);
   await key('Space',y=>{const p=window.game.scene.getScene('Game').player;return !p.onGround&&p.body.bottom<y-10&&p.body.velocity.y>=0;},ledge.y);
   await grounded();
   const onLedge=await state();assert.ok(Math.abs(onLedge.bottom-ledge.y)<3,'one-way landing '+JSON.stringify(onLedge));
   await page.keyboard.down('ArrowDown');
   try{await key('Space',y=>window.game.scene.getScene('Game').player.body.bottom>y+20,ledge.y);}
   finally{await page.keyboard.up('ArrowDown');}
   await grounded();
   const dropped=await state();assert.ok(Math.abs(dropped.bottom-ledge.ground)<3,'drop through '+JSON.stringify(dropped));
   mark('oneway-jump-drop',{fixture:ledge,landing:onLedge.bottom,drop:dropped.bottom});
   const checkpoint=await page.evaluate(()=>{
    const s=window.game.scene.getScene('Game');
    const z=s.props.getChildren().find(z=>z.getData('kind')==='checkpoint'&&!z.getData('on'));
    return z?{x:z.x,y:z.y,ground:z.y+64}:null;
   });
   assert.ok(checkpoint,'Missing checkpoint fixture');
   await fixture(checkpoint.x,checkpoint.ground-46);
   await wait(x=>{const s=window.game.scene.getScene('Game');return s.respawnPoint.x===x&&s.props.getChildren().some(z=>z.x===x&&z.getData('kind')==='checkpoint'&&z.getData('on'));},checkpoint.x);
   const cp=await state();assert.equal(cp.hp,initial.hp);
   mark('checkpoint',{fixture:checkpoint,respawn:await page.evaluate(()=>{const s=window.game.scene.getScene('Game');return {x:s.respawnPoint.x,y:s.respawnPoint.y};}),...cp});
   const shard=await page.evaluate(()=>{
    const s=window.game.scene.getScene('Game'),p=s.pickups.getChildren().find(z=>z.active&&z.getData('kind')==='shard');
    return p?{x:p.x,y:p.y,index:p.getData('index'),level:s.level.id}:null;
   });
   assert.ok(shard,'Missing shard fixture');
   await fixture(shard.x,shard.y-40);
   await wait(i=>window.game.scene.getScene('Game').shards[i]===true,shard.index);
   const persistence=await page.evaluate(({index,level})=>{
     const s=window.game.scene.getScene('Game');
     return {memory:s.save.shards[level]?.[index]===true,stored:Object.keys(localStorage).some(k=>{try{return JSON.parse(localStorage.getItem(k))?.shards?.[level]?.[index]===true;}catch{return false;}})};
   },shard);
   assert.ok(persistence.memory&&persistence.stored,'shard save '+JSON.stringify(persistence));
   mark('shard-save',{fixture:shard,persistence,...await state()});
   assert.deepEqual(result.errors,[]);
   result.passed=true;save();
  }catch(e){result.passed=false;result.error=String(e);save();await page.screenshot({path:out+'/'+name+'-failure.png'}).catch(()=>{});throw e;}
  finally{await context.close();}
 }
 const a=report.modes.legacy.steps.find(s=>s.step==='jump-land'),b=report.modes.organic.steps.find(s=>s.step==='jump-land');
 report.parity={landingDelta:Math.abs(a.bottom-b.bottom),jumpHeightDelta:Math.abs(a.height-b.height)};
 // Render timing can change integration discretization; the physical floor
 // must match and both independent jump heights must satisfy their contract.
 assert.ok(report.parity.landingDelta<3);
 report.passed=true;save();
 console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));}
