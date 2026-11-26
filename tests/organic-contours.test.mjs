import test from 'node:test';
import assert from 'node:assert/strict';
import {contourOffset,planOrganicContours,CONTOUR_PAD} from '../.debug/organic-contours.mjs';
const fixture={schema:1,level:'fixture',surfaces:[{from:[64,192],to:[1344,192]}],walls:[
 {side:1,from:[1344,192],to:[1344,512]},
 {side:1,from:[1344,512],to:[1344,704]},
 {side:1,from:[1344,768],to:[1344,832]}
],ramps:[]};
test('curve plans merge artificial wall cuts but not real gaps',()=>{
 const p=planOrganicContours(fixture);
 assert.equal(p.length,3);
 assert.deepEqual(p[1].from,[1344,192]);assert.deepEqual(p[1].to,[1344,704]);
 assert.deepEqual(p[2].from,[1344,768]);
 assert.ok(contourOffset(p[1],512)>0);
});
test('world-space profile has bounded continuous offsets, stable across crop boundaries',()=>{
 for(const q of planOrganicContours(fixture)){
  const axis=q.axis==='top'?0:1, start=q.from[axis],end=q.to[axis];
  assert.equal(contourOffset(q,start),0);assert.equal(contourOffset(q,end),0);
  assert.equal(contourOffset(q,start-1),0);assert.equal(contourOffset(q,end+1),0);
  let prev=0;
  for(let x=start;x<=end;x++){
   const v=contourOffset(q,x);
   assert.ok(v>=0&&v<=CONTOUR_PAD);
   assert.ok(Math.abs(v-prev)<2);
   assert.equal(v,contourOffset({...q},x));
   prev=v;
  }
 }
 const top=planOrganicContours(fixture)[0];
 assert.ok(Math.abs(contourOffset(top,1280-.001)-contourOffset(top,1280+.001))<.01);
});
