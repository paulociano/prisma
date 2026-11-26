// Fixed camera scene in the production bundle, not a gameplay or GPU benchmark.
import fs from 'node:fs';
import os from 'node:os';
import {preview} from 'vite';
import {chromium} from 'playwright-core';
const server=await preview({preview:{port:5201,strictPort:true},logLevel:'error'});
const browser=await chromium.launch({
 ...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),
 args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']
});
const out='.debug/shots/vale-performance';
fs.mkdirSync(out,{recursive:true});
const quantile=(arr,p)=>{const s=[...arr].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(p*(s.length-1)))];};
const describe=a=>({median:quantile(a,.5),p95:quantile(a,.95),min:Math.min(...a),max:Math.max(...a)});
const report={scenario:'production build, high quality, 1280x720, frozen player, paused physics, camera centered on col 138, restored color, 30 warmup and 90 measured rAF intervals, 5 repeats per lighting mode (off, uncached, exact cache)',machine:{cpu:os.cpus()[0]?.model,cores:os.cpus().length,ramBytes:os.totalmem(),platform:os.platform(),browser:browser.version(),renderer:'SwiftShader requested; software CI is not target hardware'},modes:{}};
try{
 for(const mode of ['lightingOff','lightingUncached','lightingOn']){
  const enabled=mode!=='lightingOff';
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://localhost:5201/?debug'+(enabled?(mode==='lightingUncached'?'&lightcache=0':''):'&lighting=0'));
   await page.waitForFunction(()=>window.game?.scene.isActive('Title'),null,{timeout:120000});
   await page.evaluate(()=>{const g=window.game;g.scene.getScenes(true).forEach(s=>g.scene.stop(s.scene.key));g.scene.start('Game',{level:0});});
   await page.waitForFunction(()=>{const s=window.game.scene.getScene('Game');return s?.level?.id==='1-1'&&s?.player?.body&&s?.color&&(window.game.scene.isActive('Game')||window.game.scene.isPaused('Game'));},null,{timeout:120000});
   const setup=await page.evaluate(()=>{
    const game=window.game,s=game.scene.getScene('Game');
    if(game.scene.isActive('Dialogue'))game.scene.stop('Dialogue');
    if(game.scene.isPaused('Game'))game.scene.resume('Game');
    s.player.frozen=true;s.physics.world.pause();s.cameras.main.stopFollow();
    s.color.complete();s.color.update(1);
    const x=138*64+32,ground=s.surfaceBelow(x,0),y=ground-s.player.body.height/2;
    s.player.body.allowGravity=false;s.player.body.reset(x,y);s.player.syncView(0);
    s.cameras.main.centerOn(x,y);s.cameras.main.fadeEffect.reset();
    return {x,y,lighting:!!s.localMaterialLights,materials:s.data.get('pictorialMaterials'),renderer:game.renderer.gl?.getParameter(game.renderer.gl.RENDERER)};
   });
   if(setup.lighting!==enabled||!setup.materials?.count)throw Error('Benchmark setup mismatch '+JSON.stringify(setup));
   const repeats=[];
   for(let trial=0;trial<5;trial++){
    const sample=await page.evaluate(async()=>{
     const s=window.game.scene.getScene('Game');
     const tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
     for(let i=0;i<30;i++)await tick();
     const before=s.data.get('materialLightingPerf')??{updates:0,totalMs:0,pixels:0,uploadBytes:0,skipped:0};
     const intervals=[];let previous=await tick();
     for(let i=0;i<90;i++){const next=await tick();intervals.push(next-previous);previous=next;}
     const after=s.data.get('materialLightingPerf')??before;
     const delta=Object.fromEntries(['updates','totalMs','pixels','uploadBytes','skipped'].map(k=>[k,after[k]-before[k]]));
     return {intervals,delta};
    });
    repeats.push({frameMs:describe(sample.intervals),over33ms:sample.intervals.filter(n=>n>33.3).length,lighting:sample.delta});
   }
   if(errors.length)throw Error(errors.join('\n'));
   if(enabled&&!repeats.some(r=>r.lighting.updates>0&&r.lighting.pixels>0&&r.lighting.uploadBytes>0))throw Error('Benchmark did not exercise material lights');
   report.modes[mode]={setup,repeats,medianOfMediansMs:quantile(repeats.map(r=>r.frameMs.median),.5),medianP95Ms:quantile(repeats.map(r=>r.frameMs.p95),.5)};
   fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  }finally{await page.close();}
 }
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
