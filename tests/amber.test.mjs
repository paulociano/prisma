import test from 'node:test';
import assert from 'node:assert/strict';
import {AMBER_STAGES,ventPhase,shuttleX,newFurnace,advanceFurnace,hitFurnace} from '../.debug/amber.mjs';
test('Amber routes have grounded spawn, checkpoint, exit and ground foe patrols',()=>{
 assert.deepEqual(AMBER_STAGES.map(s=>s.id),[1,2,3,4]);
 for(const s of AMBER_STAGES){
  const floor=x=>s.slabs.some(b=>b.y===640&&x>=b.x+20&&x<=b.x+b.w-20);
  assert.ok([150,s.checkpoint,s.exit].every(floor),s.name);
  assert.ok(s.slabs.every(b=>b.x>=0&&b.x+b.w<=s.width&&b.w>0&&b.h>0));
  for(const f of s.foes)if(!f.air)assert.ok(floor(f.x-f.range)&&floor(f.x+f.range),s.name);
  for(const v of s.vents){assert.ok(v.period>0&&v.width>0);assert.ok(Math.abs(v.x-s.checkpoint)>v.width/2+35);}
  for(const m of s.shuttles)assert.ok(m.period>0&&m.fromX-m.width/2>=0&&m.toX+m.width/2<=s.width);
 }
 assert.equal(AMBER_STAGES[3].boss,true);
});
test('vents warn before erupting; shuttle completes a continuous round trip',()=>{
 const v={x:300,width:100,offset:0,period:5};
 assert.equal(ventPhase(v,0),'cool');assert.equal(ventPhase(v,3),'warning');assert.equal(ventPhase(v,4),'eruption');assert.equal(ventPhase(v,5),'cool');
 const m={fromX:100,toX:400,y:500,width:120,period:4};
 assert.equal(shuttleX(m,0),100);assert.equal(shuttleX(m,2),400);assert.equal(shuttleX(m,4),100);
});
test('furnace builds heat, warns, vents, and only accepts one hit per exposed window',()=>{
 let s=newFurnace();
 for(let i=0;i<8;i++){
  assert.equal(hitFurnace(s),s);s=advanceFurnace(s,.8);assert.ok(s.heat>0&&s.heat<100);
  s=advanceFurnace(s,.81);assert.equal(s.phase,'warning');assert.equal(s.heat,100);assert.equal(hitFurnace(s),s);
  s=advanceFurnace(s,.9);assert.equal(s.phase,'venting');assert.equal(hitFurnace(s),s);
  s=advanceFurnace(s,.65);assert.equal(s.phase,'exposed');assert.equal(s.heat,0);
  s=hitFurnace(s);assert.equal(s.hp,7-i);assert.equal(hitFurnace(s),s);
 }
 assert.equal(s.phase,'restored');assert.equal(advanceFurnace(s,50),s);
});
test('elapsed time is carried over; invalid delta does not corrupt state',()=>{
 const s=newFurnace();assert.equal(advanceFurnace(s,NaN),s);assert.equal(advanceFurnace(s,-1),s);
 const a=advanceFurnace(s,3.3);assert.equal(a.phase,'exposed');assert.ok(Math.abs(a.elapsed-.15)<1e-8);
});
