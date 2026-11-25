import fs from 'node:fs';
import assert from 'node:assert/strict';
const summary=[];
for(const id of ['1-1','1-2','1-3','1-4']){
  const read=mode=>JSON.parse(fs.readFileSync('.debug/shots/'+mode+'/'+id+'_renderer.json','utf8'));
  const base=read('baseline'),organic=read('organic');
  assert.equal(base.id,id);assert.equal(organic.id,id);
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
    assert.deepEqual(organic.authoredIslands,base.islandCandidates,'authored islands not rendered '+id);
    if(id==='1-3'){assert.ok(organic.organicCoffer);assert.equal(organic.organicCofferSource,'authored','generated coffer not loaded');}
  }
  summary.push({id,staticBodies:base.staticGeometry.map(x=>x.length),mode:organic.organicMode,surfaceRuns:organic.organicSurfaces,estimatedFaceBytes:organic.organicFaceBytes,authoredIslands:organic.authoredIslands.length});
}
fs.writeFileSync('.debug/shots/world-one-parity.json',JSON.stringify(summary,null,2));
console.log('World 1 A/B physics parity:',JSON.stringify(summary));
