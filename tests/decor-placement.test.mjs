import test from 'node:test';
import assert from 'node:assert/strict';
import {groundedDecorRow} from '../.debug/decor-placement.mjs';
const level={cols:7,rows:7,tiles:[
 [0,0,0,0,0,0,0],
 [0,0,0,0,0,0,0],
 [0,0,1,1,0,0,0],
 [0,0,0,0,0,0,0],
 [0,1,1,1,1,0,0],
 [0,1,1,1,1,0,0],
 [1,1,1,1,1,1,1]
]};
test('isolated upper island is skipped in favor of supported ground',()=>{
 assert.equal(groundedDecorRow(level,2),4);
 assert.equal(groundedDecorRow(level,2,true),4);
});
test('wide decor requires full footing and avoids level boundaries',()=>{
 assert.equal(groundedDecorRow(level,4),4);
 assert.equal(groundedDecorRow(level,4,true),-1);
 assert.equal(groundedDecorRow(level,0),-1);
 assert.equal(groundedDecorRow(level,5),-1);
});
test('occupied space above a support is not an anchor',()=>{
 const copy={...level,tiles:level.tiles.map(row=>row.slice())};
 copy.tiles[3][2]=3;
 assert.equal(groundedDecorRow(copy,2),-1);
});
