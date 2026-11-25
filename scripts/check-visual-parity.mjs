import fs from 'node:fs';
import assert from 'node:assert/strict';
const summary=[];
for(const id of ['1-1','1-2','1-3','1-4']){
  const read=mode=>JSON.parse(fs.readFileSync('.debug/shots/'+mode+'/'+id+'_renderer.json','utf8'));
  const base=read('baseline'),organic=read('organic');
  assert.equal(base.id,id);assert.equal(organic.id,id);
  assert.equal(base.atmosphereLayers,0);
  assert.equal(base.vista,null);assert.equal(base.vistaObjects,0);
  assert.equal(base.organicForeground,false);
  assert.equal(base.rootSanctuary,null);
  if(id==='1-3'){assert.ok(base.rootCandidate);assert.deepEqual(organic.rootSanctuary,base.rootCandidate);assert.equal(organic.rootSanctuaryBehind,true);assert.equal(organic.rootClearAlpha,0);}else{assert.equal(organic.rootSanctuary,null);}
  assert.equal(organic.organicForeground,id!=='1-4');
  if(id!=='1-4'){assert.ok(organic.foregroundBounds.top<=96);assert.ok(organic.foregroundBounds.bottom>=648);}
  if(id!=='1-4'&&base.vistaCandidate&&base.vistaLandmarkAvailable){assert.deepEqual(organic.vista,base.vistaCandidate);assert.ok(organic.vistaObjects>=1);}else{assert.equal(organic.vista,null);}
  assert.equal(base.lanternLights,0);assert.equal(base.architectureContacts,0);
  assert.equal(organic.lanternLights,id==='1-4'?0:base.lanternCandidates);
  assert.equal(organic.architectureContacts,id==='1-4'?0:base.architectureCandidates);
  assert.equal(organic.atmosphereLayers,id==='1-4'?0:2);
  assert.ok(base.staticGeometry[0].length>0,'missing solids '+id);
  assert.deepEqual(organic.staticGeometry,base.staticGeometry,'static geometry mismatch '+id);
  if(id==='1-4'){
    assert.equal(organic.organicMode,'painted-arena');
    assert.equal(base.organicMode,'painted-arena');
  }else{
    assert.equal(organic.organicMode,'organic');
    assert.ok(organic.organicSurfaces>0);
    assert.ok(organic.organicFaceBytes>0&&organic.organicFaceBytes<=64*1024*1024);
    assert.equal(base.organicMode,'legacy');
    assert.deepEqual(base.authoredIslands,[]);
    assert.deepEqual(base.authoredWalls,[]);
    assert.deepEqual(base.authoredGround,[]);
    assert.deepEqual(base.authoredRamps,[]);
    assert.deepEqual(base.authoredCorners,[]);
    assert.deepEqual(organic.authoredRamps,base.rampCandidates,'organic ramp coverage mismatch '+id);
    assert.deepEqual(organic.rampContacts,base.rampContacts,'ramp physics changed '+id);
    for(const [i,q] of organic.rampCandidates.entries()){
      const expected=[.5,32,63.5,64.5,96,127.5].map(dx=>q.row*64+(q.up?64-dx/2:dx/2));
      assert.ok(expected.every((v,j)=>Math.abs(v-organic.rampContacts[i][j])<.001),'ramp contact mismatch '+id);
    }
    assert.ok(organic.authoredGround.length>0,'missing authored ground '+id);
    assert.ok(organic.authoredGround.every(g=>g.length>=3),'invalid ground run');
    assert.ok(organic.authoredWalls.length>0,'missing authored walls '+id);
    assert.ok(organic.authoredWalls.every(w=>w.r1-w.r0+1>=2&&w.r1-w.r0+1<=5),'invalid authored wall segment');
    assert.deepEqual(organic.authoredIslands,base.islandCandidates,'authored islands not rendered '+id);
    if(id==='1-3'){assert.ok(organic.organicCoffer);assert.equal(organic.organicCofferSource,'authored','generated coffer not loaded');}
  }
  summary.push({id,staticBodies:base.staticGeometry.map(x=>x.length),mode:organic.organicMode,surfaceRuns:organic.organicSurfaces,estimatedFaceBytes:organic.organicFaceBytes,authoredIslands:organic.authoredIslands.length,authoredWalls:organic.authoredWalls.length,authoredGround:organic.authoredGround.length,authoredGroundCells:organic.authoredGround.reduce((n,g)=>n+g.length,0),authoredRamps:organic.authoredRamps.length,authoredCorners:organic.authoredCorners.length,atmosphereLayers:organic.atmosphereLayers,lanternLights:organic.lanternLights,architectureContacts:organic.architectureContacts,vista:organic.vista,vistaObjects:organic.vistaObjects,organicForeground:organic.organicForeground,foregroundBounds:organic.foregroundBounds,rootSanctuary:organic.rootSanctuary});
}
const low=JSON.parse(fs.readFileSync('.debug/shots/organic-low/1-1_renderer.json','utf8'));
const baseline=JSON.parse(fs.readFileSync('.debug/shots/baseline/1-1_renderer.json','utf8'));
assert.equal(low.organicMode,'organic');assert.equal(low.atmosphereLayers,0);
assert.equal(low.lanternLights,0);assert.equal(low.architectureContacts,0);
assert.equal(low.rootSanctuary,null);
assert.equal(low.vista,null);assert.equal(low.vistaObjects,0);assert.equal(low.organicForeground,false);
assert.ok(summary.some(s=>s.vista),'no organic vista rendered in world one');
assert.deepEqual(low.staticGeometry,baseline.staticGeometry,'low quality physics mismatch');
fs.writeFileSync('.debug/shots/world-one-parity.json',JSON.stringify(summary,null,2));
console.log('World 1 A/B physics parity:',JSON.stringify(summary));
