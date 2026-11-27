// Validate the published atlas contract, not merely the presence of source PNGs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='public/assets/';
const manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
const entries=new Map(manifest.sprites.map(s=>[s.key,s]));
for(let world=2;world<=7;world++){
 for(const [suffix,count] of [['idle',4],['jump',6]]){
  const key='w'+world+'_iris_'+suffix;
  const e=entries.get(key);
  assert.ok(e,key+' must be published, not silently fall back to original');
  assert.equal(e.frames,count,key+' frame count');
  const atlas=JSON.parse(fs.readFileSync(root+e.json,'utf8'));
  assert.ok(Array.from({length:count},(_,i)=>String(i)).every(k=>atlas.frames[k]),key+' exact frame IDs');
 }
}
const swim=entries.get('w5_iris_swim');
assert.ok(swim,'World 5 swim atlas');
assert.equal(swim.frames,6);
const atlas=JSON.parse(fs.readFileSync(root+swim.json,'utf8'));
const maxHeight=Math.max(...Object.values(atlas.frames).map(f=>f.frame.h))/swim.res;
assert.ok(Math.abs(maxHeight-110)<1,'swim nominal height '+maxHeight);
console.log('Wardrobe manifest: all world idle/jump atlases and normalized swim verified');
