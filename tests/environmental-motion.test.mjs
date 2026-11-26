import test from 'node:test';
import assert from 'node:assert/strict';
import {windAt,plantAngle,pollenPose} from '../.debug/environmental-motion.mjs';
test('wind is deterministic, bounded and spatially coherent',()=>{
 for(let t=0;t<15;t+=.05){
  const w=windAt(512,t);
  assert.ok(Math.abs(w)<=1);
  assert.equal(w,windAt(512,t));
  assert.ok(Math.abs(w-windAt(513,t))<.01);
  assert.ok(Math.abs(w-windAt(512,t+.01))<.03);
 }
});
test('restoration controls sway without exceeding 3.5 degrees',()=>{
 for(let t=0;t<15;t+=.05){
  const a=plantAngle(900,t,0,5),b=plantAngle(900,t,1,5);
  assert.ok(Math.abs(a-5)<=1.2+1e-10);
  assert.ok(Math.abs(b-5)<=3.5+1e-10);
  assert.ok(Math.abs(a-5)<=Math.abs(b-5)+1e-10);
 }
});
test('pollen stays near its origin and fades at wrap',()=>{
 const seed=0;
 assert.equal(pollenPose(100,200,seed,0,1).alpha,0);
 assert.equal(pollenPose(100,200,seed,7,1).alpha,0);
 for(let t=0;t<30;t+=.05){
  const p=pollenPose(100,200,seed,t,1);
  assert.ok(Math.abs(p.x-100)<=34);
  assert.ok(p.y<=187&&p.y>=87);
  assert.ok(p.alpha>=0&&p.alpha<=.45);
  assert.ok(p.alpha>=pollenPose(100,200,seed,t,0).alpha);
 }
});
