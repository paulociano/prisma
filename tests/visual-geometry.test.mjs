import test from 'node:test';
import assert from 'node:assert/strict';
import {planVisualGeometry,planVisualLedges} from '../.debug/visual-geometry.mjs';
const fixture=()=>({id:'fixture',cols:8,rows:5,tiles:[
  [0,0,0,0,0,0,0,0],
  [0,2,2,0,0,0,0,0],
  [0,0,0,0,4,5,0,0],
  [0,1,1,0,1,1,1,0],
  [0,1,1,0,1,1,1,0]
]});
const all=()=>new Set([0,1,2,3,4,5,6,7]);
test('contact runs are world-space, deterministic and do not mutate gameplay data',()=>{
  const l=fixture(),before=JSON.stringify(l);
  const plan=planVisualGeometry(l,all(),new Set());
  assert.deepEqual(plan,planVisualGeometry(l,all(),new Set()));
  assert.equal(JSON.stringify(l),before);
  assert.equal(plan.schema,1);
  assert.deepEqual(plan.surfaces.map(q=>[q.from,q.to,q.depths]),[
    [[64,192],[192,192],[128,128]],
    [[384,192],[448,192],[128]]
  ]);
  assert.deepEqual(plan.ramps.map(q=>[q.from,q.to]),[[[256,192],[384,128]]]);
  assert.ok(plan.walls.some(q=>q.side===1&&q.col===2&&q.rows===2));
});
test('missing plates and separately rendered island cells do not receive surface finishes',()=>{
  const l=fixture(),covered=new Set([1,2]),islands=new Set([25,33]);
  const p=planVisualGeometry(l,covered,islands);
  assert.deepEqual(p.surfaces.map(q=>q.from),[[128,192]]);
  assert.equal(p.ramps.length,0);
  assert.equal(planVisualGeometry(l,new Set(),new Set()).surfaces.length,0);
});
test('one-way runs retain contact coordinates and honor reserved bridges and hazards',()=>{
  const l=fixture();
  assert.deepEqual(planVisualLedges(l,new Set()),[{col:1,row:1,length:2,from:[64,64],to:[192,64]}]);
  assert.deepEqual(planVisualLedges(l,new Set([9])),[]);
  l.tiles[2][1]=3;
  assert.deepEqual(planVisualLedges(l,new Set()),[]);
});
