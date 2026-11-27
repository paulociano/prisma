import test from 'node:test';
import assert from 'node:assert/strict';
import {worldEpilogue,worldEpilogueWithFallback} from '../.debug/cutscene-worlds.mjs';
const items=['coração de cristal','faixa','insígnia','manto','bracelete','botas'];
test('outro, reward and departure appear in narrative order',()=>{
 for(let w=1;w<=7;w++){
  const slides=worldEpilogue(w);
  assert.deepEqual(slides.map(s=>s.tex),[`cs_w${w}_outro`,...(w<7?[`cs_w${w}_reward`,`cs_w${w}_transition`]:[])]);
  if(w<7)assert.ok(slides[1].text.includes(items[w-1]));
  assert.ok(slides.every(s=>s.fit==='contain'&&s.text.length>0));
 }
 assert.deepEqual(worldEpilogue(0),[]);
 assert.deepEqual(worldEpilogue(8),[]);
});
test('missing reward artwork retains narration using the current outro, not a new costume',()=>{
 const slides=worldEpilogueWithFallback(6,k=>k==='cs_w6_outro');
 assert.equal(slides.length,3);
 assert.equal(slides[1].tex,'cs_w6_outro');
 assert.equal(slides[1].text,worldEpilogue(6)[1].text);
 assert.deepEqual(worldEpilogueWithFallback(7,k=>k==='cs_w7_outro').map(s=>s.tex),['cs_w7_outro']);
});
test('fallback uses current map if next map is not loaded',()=>{
 assert.deepEqual(worldEpilogueWithFallback(3,k=>k==='w3_map').map(s=>s.tex),['w3_map','w3_map','w3_map']);
 assert.deepEqual(worldEpilogueWithFallback(3,k=>k==='w3_map'||k==='w4_map').map(s=>s.tex),['w3_map','w3_map','w4_map']);
 assert.deepEqual(worldEpilogueWithFallback(2,()=>true),worldEpilogue(2));
});
