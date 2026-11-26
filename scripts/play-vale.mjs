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
const report={scenario:'Vale opening, production bundle, fresh browser context per renderer, keyboard controls, normal physics',modes:{}};
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
    camera:s.data.get('cinematicCamera')??null,paused:s.physics.world.isPaused};
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
