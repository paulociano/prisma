import test from 'node:test';
import assert from 'node:assert/strict';
import {GROVE_STAGES,lightPhase,activateRelay,relaysReady,newBloom,lightBloom,advanceBloom,hitBloom} from '../.debug/grove.mjs';
test('grove route geometry and relay identities',()=>{
 assert.deepEqual(GROVE_STAGES.map(s=>s.id),[1,2,3,4]);
 for(const s of GROVE_STAGES){
  const floor=x=>s.slabs.some(b=>b.y===640&&x>=b.x+20&&x<=b.x+b.w-20);
  assert.ok([150,s.checkpoint,s.exit].every(floor),s.name);
  assert.ok(s.slabs.every(b=>b.x>=0&&b.x+b.w<=s.width&&b.w>0&&b.h>0));
  for(const f of s.foes)if(!f.air)assert.ok(floor(f.x-f.range)&&floor(f.x+f.range),s.name);
  assert.equal(new Set(s.relays.map(r=>r.id)).size,s.relays.length);
 }
 assert.equal(GROVE_STAGES[2].relays.length,3);
});
test('light platforms warn before dimming; relays are valid and idempotent',()=>{
 const p={x:100,y:500,width:120,period:5,offset:0};
 assert.equal(lightPhase(p,0),'bright');assert.equal(lightPhase(p,3),'fading');assert.equal(lightPhase(p,4),'dim');
 const r=GROVE_STAGES[2].relays;let lit=activateRelay(r,[],'invalid');assert.deepEqual(lit,[]);
 for(const a of r)lit=activateRelay(r,lit,a.id);
 assert.equal(relaysReady(r,lit),true);assert.deepEqual(activateRelay(r,lit,r[0].id),lit);
});
test('Bloom requires two lights, exposes for four seconds and closes on hit',()=>{
 let s=newBloom();assert.equal(hitBloom(s),s);
 s=lightBloom(s,'left');assert.equal(s.phase,'sealed');s=lightBloom(s,'right');assert.equal(s.phase,'open');
 s=advanceBloom(s,4.1);assert.equal(s.phase,'sealed');assert.deepEqual(s.lit,[]);
 for(let i=0;i<6;i++){s=lightBloom(lightBloom(s,'left'),'right');assert.equal(s.phase,'open');s=hitBloom(s);assert.equal(s.hp,5-i);}
 assert.equal(s.phase,'restored');assert.equal(advanceBloom(s,100),s);
});
test('sealed Bloom telegraphs its pulse before returning to protection',()=>{
 let s=newBloom();s=advanceBloom(s,2.1);assert.equal(s.phase,'warning');s=advanceBloom(s,.9);assert.equal(s.phase,'pulse');s=advanceBloom(s,.5);assert.equal(s.phase,'sealed');
});
