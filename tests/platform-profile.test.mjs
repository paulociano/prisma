import test from 'node:test';
import assert from 'node:assert/strict';
import {platformProfile,platformDepth} from '../.debug/platform-profile.mjs';
test('solid, ledge and mover have distinct depths and fixed contact registration',()=>{
 const a=platformProfile('solid',128,10),b=platformProfile('ledge',128,10),c=platformProfile('mover',128,10);
 assert.equal(a.width,b.width);assert.equal(b.width,c.width);
 assert.ok(a.below>b.below&&b.below>c.below);
 assert.equal(a.above,24);assert.equal(b.above,16);assert.equal(c.above,12);
 assert.ok([a,b,c].every(p=>p.margin<=10));
});
test('depth respects clearance and varies continuously without changing width',()=>{
 for(const kind of ['solid','ledge','mover']){
  const p=platformProfile(kind,192,13,62);
  assert.ok(p.below<=62);assert.equal(p.width,192);
  let previous=platformDepth(p,0);
  for(let i=1;i<=192;i++){
   const v=platformDepth(p,i/192);
   assert.ok(v>=0&&v<=p.below);assert.ok(Math.abs(v-previous)<2);previous=v;
  }
 }
});
test('regional variants are deterministic and preserve physical width',()=>{
 const a=platformProfile('solid',192,21),b=platformProfile('solid',192,22);
 assert.deepEqual(a,platformProfile('solid',192,21));
 assert.notEqual(a.flip,b.flip);assert.notEqual(a.below,b.below);
 assert.equal(a.width,b.width);
 assert.throws(()=>platformProfile('solid',0,1));
 assert.throws(()=>platformProfile('solid',513,1));
});
