import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=JSON.parse(fs.readFileSync('.debug/shots/baseline/1-3_renderer.json','utf8'));
const organic=JSON.parse(fs.readFileSync('.debug/shots/organic/1-3_renderer.json','utf8'));
assert.equal(base.id,organic.id);
assert.ok(base.staticGeometry[0].length>0&&base.staticGeometry[2].length>0,'missing solids or hazards');
assert.deepEqual(organic.staticGeometry,base.staticGeometry,'visual renderer must not change static collision geometry');
assert.ok(organic.organicSurfaces>0,'no organic surface runs');
console.log('A/B physics parity:',base.staticGeometry.map(x=>x.length),'organic surface runs:',organic.organicSurfaces);
