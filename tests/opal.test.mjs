import test from 'node:test';
import assert from 'node:assert/strict';
import {OPAL_STAGES,newCrown,advanceCrown,hitCrown} from '../.debug/opal.mjs';
test('four authored previews with safe checkpoints and exits',()=>{
 assert.deepEqual(OPAL_STAGES.map(s=>s.id),[1,2,3,4]);
 for(const s of OPAL_STAGES){
  const floor=x=>s.slabs.some(b=>b.y===640&&x>=b.x+20&&x<=b.x+b.w-20);
  assert.ok(floor(150));assert.ok(floor(s.checkpoint));assert.ok(floor(s.exit));
  assert.ok(s.slabs.every(b=>b.x>=0&&b.x+b.w<=s.width&&b.w>0&&b.h>0));
  for(const f of s.foes)if(!f.air){assert.ok(floor(f.x-f.range));assert.ok(floor(f.x+f.range));}
 }
 assert.ok(OPAL_STAGES[1].slabs.some(b=>b.breakable));assert.ok(OPAL_STAGES[2].winds.length);
 assert.equal(OPAL_STAGES[3].boss,true);
});
test('Crown takes damage only in exposed windows and restores on sixth hit',()=>{
 let s=newCrown();assert.equal(hitCrown(s),s);
 for(let i=0;i<6;i++){
  s=advanceCrown(s,2);assert.equal(s.phase,'strike');assert.equal(hitCrown(s),s);
  s=advanceCrown(s,1);assert.equal(s.phase,'exposed');
  s=hitCrown(s);assert.equal(s.hp,5-i);
 }
 assert.equal(s.phase,'restored');assert.equal(advanceCrown(s,100),s);
});
