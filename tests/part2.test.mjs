import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePart2,finishPilot,grantWorldInsignia,hasInsignia,part2Unlocked,REGIONS,loadPart2,writePart2,PART2_KEY,opalPreviewUnlocked,finishOpalPreview,finishOpalWorld,amberPreviewUnlocked,finishAmberPreview,finishAmberWorld} from '../.debug/part2.mjs';
test('Chapter II requires the original ending and retains all seven world identities',()=>{
 assert.equal(part2Unlocked({finished:false}),false);assert.equal(part2Unlocked({finished:true}),true);
 assert.deepEqual(REGIONS.map(r=>r.id),[8,9,10,11,12,13,14]);
});
test('pilot completion does not grant a world insignia',()=>{
 const p=finishPilot(normalizePart2(null));assert.equal(p.pilotCleared,true);assert.deepEqual(p.completedWorlds,[]);assert.equal(hasInsignia(p,8),false);
});
test('insignias are ordered, idempotent and separate from wardrobe',()=>{
 let p=normalizePart2({completedWorlds:[9,8,8,14,'10']});
 assert.deepEqual(p.completedWorlds,[8,9]);
 assert.deepEqual(grantWorldInsignia(p,12),p);
 p=grantWorldInsignia(p,10);assert.equal(hasInsignia(p,10),true);assert.deepEqual(grantWorldInsignia(p,10),p);
});
test('Chapter II writes leave the original save unchanged',()=>{
 const data=new Map([['prisma-save-v1','original']]);
 globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 assert.equal(writePart2(finishPilot(loadPart2())),true);
 assert.equal(data.get('prisma-save-v1'),'original');assert.ok(data.has(PART2_KEY));assert.equal(loadPart2().pilotCleared,true);
});

test('Opala previews unlock in order, preserve legacy pilot and do not award an insignia',()=>{
 let p=normalizePart2({pilotCleared:true});assert.equal(p.pilotCleared,true);
 assert.equal(opalPreviewUnlocked(p,1),true);assert.equal(opalPreviewUnlocked(p,4),false);
 assert.deepEqual(finishOpalPreview(p,3),p);
 for(let i=1;i<=4;i++){assert.equal(opalPreviewUnlocked(p,i),true);p=finishOpalPreview(p,i);}
 assert.deepEqual(p.opalPreviewCleared,[1,2,3,4]);assert.deepEqual(p.completedWorlds,[]);assert.equal(hasInsignia(p,8),false);
 assert.deepEqual(finishOpalPreview(p,4),p);
});

test('Opala award requires restored boss, completed routes and authored finale',()=>{
 let p=normalizePart2({opalPreviewCleared:[1,2,3]});
 assert.deepEqual(finishOpalWorld(p,false,true),p);
 assert.deepEqual(finishOpalWorld(p,true,false),p);
 assert.deepEqual(finishOpalWorld(normalizePart2(null),true,true).completedWorlds,[]);
 p=finishOpalWorld(p,true,true);assert.deepEqual(p.completedWorlds,[8]);assert.deepEqual(p.opalPreviewCleared,[1,2,3,4]);
 assert.deepEqual(finishOpalWorld(p,true,true),p);
});

test('Amber unlocks only after Opala, and earns an independent collectible after its authored finale',()=>{
 const locked=normalizePart2({amberPreviewCleared:[1,2,3,4]});
 assert.deepEqual(locked.amberPreviewCleared,[]);
 assert.equal(amberPreviewUnlocked(locked,1),false);
 assert.deepEqual(finishAmberPreview(locked,1),locked);
 let p=normalizePart2({completedWorlds:[8],opalPreviewCleared:[1,2,3,4]});
 assert.equal(amberPreviewUnlocked(p,1),true);assert.equal(amberPreviewUnlocked(p,2),false);
 assert.deepEqual(finishAmberPreview(p,2),p);
 for(let i=1;i<=3;i++)p=finishAmberPreview(p,i);
 assert.deepEqual(finishAmberWorld(p,false,true),p);
 assert.deepEqual(finishAmberWorld(p,true,false),p);
 assert.equal(hasInsignia(finishAmberPreview(p,4),9),false);
 p=finishAmberWorld(p,true,true);
 assert.deepEqual(p.completedWorlds,[8,9]);assert.deepEqual(p.amberPreviewCleared,[1,2,3,4]);
 assert.deepEqual(p.opalPreviewCleared,[1,2,3,4]);
 assert.deepEqual(finishAmberWorld(p,true,true),p);
});
