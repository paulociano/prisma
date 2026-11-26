import test from 'node:test';
import assert from 'node:assert/strict';
import {wardrobeStage,wardrobePrefix,wardrobeReward,WARDROBE_REWARDS} from '../.debug/wardrobe.mjs';
import {decorateAtlas} from '../scripts/wardrobe-art.mjs';
test('boss completion unlocks story wardrobe without changing saves',()=>{
 const completed=[];
 for(let w=1;w<=7;w++){assert.equal(wardrobeStage(w,completed),w-1);assert.equal(wardrobeReward(w,completed),WARDROBE_REWARDS[w-1].name);completed.push(w+'-4');assert.equal(wardrobeReward(w,completed),undefined);}
 assert.equal(wardrobeStage(7,completed),7);assert.equal(wardrobePrefix(7),'w7_final_');assert.equal(wardrobeStage(2,completed),1);assert.equal(wardrobeStage(4,['1-4']),0);assert.equal(wardrobeStage(1,completed),0);
});
test('provisional costume variants preserve every alpha, warm skin and frame layout',()=>{
 const w=80,h=80,px=new Uint8Array(w*h*4);
 for(let y=12;y<68;y++)for(let x=20;x<60;x++)px.set(y<30?[182,124,83,255]:[230,210,50,255],(y*w+x)*4);
 const frames={0:{frame:{x:0,y:0,w,h}}},original=JSON.stringify(frames);
 const all=[];
 for(let stage=1;stage<=7;stage++){const r=decorateAtlas(px,w,h,frames,stage);assert.ok(r.changed>0);assert.equal(r.decoratedFrames,1);assert.equal(r.pixels.length,px.length);assert.deepEqual(r.pixels,decorateAtlas(px,w,h,frames,stage).pixels);for(let i=0;i<px.length;i+=4){assert.equal(r.pixels[i+3],px[i+3]);if(px[i]===182)assert.deepEqual(r.pixels.slice(i,i+4),px.slice(i,i+4));}all.push(r.pixels);}
 assert.notDeepEqual(all[0],all[1]);assert.equal(JSON.stringify(frames),original);
});
