import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ISLAND_SEEDS,renderIsland,validateIsland } from '../scripts/prerender-islands.mjs';
test('three reproducible orthographic mesh sprites satisfy the platform contract',()=>{
  const all=ISLAND_SEEDS.map(seed=>{const r=renderIsland(seed);const q=validateIsland(r);assert.ok(q.coverage>=.98);assert.deepEqual(r.pixels,renderIsland(seed).pixels);return r.pixels;});
  assert.notDeepEqual(all[0],all[1]);assert.notDeepEqual(all[1],all[2]);
});
