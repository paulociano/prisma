import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlatePixels, checkSeam } from '../scripts/import-terrain-master.mjs';
const rgba=(w,h,a=255,r=90)=>Uint8Array.from({length:w*h*4},(_,i)=>i%4===3?a:i%4===0?r:80);
test('master crop accepts opaque terrain and rejects gaps and incomplete cells',()=>{
  const w=64,h=64,mask=rgba(w,h),art=rgba(w,h);
  assert.doesNotThrow(()=>validatePlatePixels(art,mask,w,h));
  const hole=rgba(w,h);hole.fill(0,0,4*64);
  assert.throws(()=>validatePlatePixels(art,hole,w,h),/outside/);
  assert.throws(()=>validatePlatePixels(rgba(w,h,0),mask,w,h),/coverage/);
});
test('master crop cannot hide incomplete coverage in a different cell',()=>{
  const w=128,h=64,mask=rgba(w,h),art=rgba(w,h);
  for(let y=0;y<h;y++)for(let x=64;x<68;x++)art[(y*w+x)*4+3]=0;
  assert.throws(()=>validatePlatePixels(art,mask,w,h),/coverage/);
});
test('seam aligns at world Y, rejects color jumps and unmatched alpha',()=>{
  const left={y:0,width:2,height:2,data:rgba(2,2)};
  assert.doesNotThrow(()=>checkSeam(left,{...left}));
  assert.throws(()=>checkSeam(left,{...left,y:1}),/discontinuity/);
  assert.throws(()=>checkSeam(left,{...left,data:rgba(2,2,255,200)}),/discontinuity/);
});
