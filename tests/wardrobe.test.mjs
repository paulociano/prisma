import test from 'node:test';
import assert from 'node:assert/strict';
import {wardrobeStage,wardrobePrefix,wardrobeReward,WARDROBE_REWARDS} from '../.debug/wardrobe.mjs';
import {wardrobeSheetPlan} from '../scripts/wardrobe-plan.mjs';
test('world numbers map directly to authored costumes; no post-ending costume',()=>{
 const completed=[];
 for(let w=1;w<=7;w++){
  assert.equal(wardrobeStage(w),w);
  assert.equal(wardrobePrefix(w),w===1?'':'w'+w+'_');
  assert.equal(wardrobeReward(w,completed),WARDROBE_REWARDS[w-1]?.name);
  completed.push(w+'-4');assert.equal(wardrobeReward(w,completed),undefined);
 }
 assert.equal(wardrobeStage(0),1);assert.equal(wardrobeStage(8),1);
 assert.equal(wardrobePrefix(8),'');assert.equal(WARDROBE_REWARDS.length,6);
});
test('only worlds 2–7 use authored packs; swim only world 5; pound shares source',()=>{
 const sheets=[
  {key:'iris_idle',src:'personagens/iris_idle.png',expect:4,grid:[2,2]},
  {key:'iris_swim',src:'personagens/iris_swim.png',expect:6},
  {key:'iris_pound_air',src:'personagens/iris_pound.png',expect:4},
  {key:'iris_pound_land',src:'personagens/iris_pound.png',expect:2},
  {key:'iris_portraits',src:'00_estilo/iris_ref_sheet.png'},
  {key:'spark_anim',src:'personagens/spark_anim.png'}
 ];
 const p=wardrobeSheetPlan(sheets);
 assert.equal(p.length,19);
 assert.equal(p.filter(s=>s.baseKey==='iris_swim').length,1);
 assert.equal(p.find(s=>s.baseKey==='iris_swim').key,'w5_iris_swim');
 assert.equal(p.find(s=>s.key==='w2_iris_idle').src,'personagens/figurinos/stage_2/iris_idle.png');
 assert.deepEqual(p.find(s=>s.key==='w7_iris_idle').grid,[2,2]);
 assert.equal(p.find(s=>s.key==='w7_iris_pound_air').src,p.find(s=>s.key==='w7_iris_pound_land').src);
 assert.ok(p.every(s=>s.world>=2&&s.world<=7&&s.authoredWardrobe));
 assert.equal(new Set(p.map(s=>s.key)).size,p.length);
});
