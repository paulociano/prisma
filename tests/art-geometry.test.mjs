import test from 'node:test';
import assert from 'node:assert/strict';
import { artChunks, exposedWallRuns, tilePolygon, focusArtChunk } from '../.debug/art-geometry.mjs';
const fixture={cols:5,rows:4,tiles:[[0,0,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]]};
test('chunks cover each column exactly once, including a short tail',()=>{const chunks=artChunks(fixture,2);assert.deepEqual(chunks.map(c=>[c.c0,c.c1,c.x,c.width]),[[0,2,0,128],[2,4,128,128],[4,5,256,64]]);assert.equal(chunks[0].height,256);assert.throws(()=>artChunks(fixture,0));});
test('walls form vertical runs without the top cap; deterministic and immutable',()=>{const before=JSON.stringify(fixture);assert.deepEqual(exposedWallRuns(fixture),[{col:2,r0:2,r1:3,side:'left'},{col:2,r0:2,r1:3,side:'right'}]);assert.equal(JSON.stringify(fixture),before);});
test('ramp endpoints and collision guides retain world coordinates',()=>{assert.deepEqual(tilePolygon(4,1,0),[[64,64],[64,64],[128,32],[128,64]]);assert.deepEqual(tilePolygon(2,0,0),[[0,0],[64,0],[64,16],[0,16]]);assert.deepEqual(tilePolygon(0,0,0),[]);});

test('focus guide clamps both ends and keeps world coordinates',()=>{assert.deepEqual([focusArtChunk(fixture,0,3).c0,focusArtChunk(fixture,4,3).c0],[0,2]);assert.equal(focusArtChunk(fixture,2,20).width,320);assert.equal(focusArtChunk(fixture,4,3).x,128);});
