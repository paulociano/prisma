import test from 'node:test';
import assert from 'node:assert/strict';
import { artChunks, exposedWallRuns, tilePolygon, focusArtChunk, cofferPlan, organicWallSegments, organicRampPlans, organicRampY, organicCornerPlans, organicVistaPlan, foregroundVisibility, rootSanctuaryPlan, organicMacroPlans, terrainPlatePlan, terrainPlateGroups, terrainSeamCompatible, terrainArtChunks, towerPillarPlans, towerBridgePlans } from '../.debug/art-geometry.mjs';
const fixture={cols:5,rows:4,tiles:[[0,0,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]]};
test('chunks cover each column exactly once, including a short tail',()=>{const chunks=artChunks(fixture,2);assert.deepEqual(chunks.map(c=>[c.c0,c.c1,c.x,c.width]),[[0,2,0,128],[2,4,128,128],[4,5,256,64]]);assert.equal(chunks[0].height,256);assert.throws(()=>artChunks(fixture,0));});
test('walls form vertical runs without the top cap; deterministic and immutable',()=>{const before=JSON.stringify(fixture);assert.deepEqual(exposedWallRuns(fixture),[{col:2,r0:2,r1:3,side:'left'},{col:2,r0:2,r1:3,side:'right'}]);assert.equal(JSON.stringify(fixture),before);});
test('ramp endpoints and collision guides retain world coordinates',()=>{assert.deepEqual(tilePolygon(4,1,0),[[64,64],[64,64],[128,32],[128,64]]);assert.deepEqual(tilePolygon(2,0,0),[[0,0],[64,0],[64,16],[0,16]]);assert.deepEqual(tilePolygon(0,0,0),[]);});

test('focus guide clamps both ends and keeps world coordinates',()=>{assert.deepEqual([focusArtChunk(fixture,0,3).c0,focusArtChunk(fixture,4,3).c0],[0,2]);assert.equal(focusArtChunk(fixture,2,20).width,320);assert.equal(focusArtChunk(fixture,4,3).x,128);});

test('coffer replacement requires exact isolated geometry and matching gate',()=>{
  const tiles=Array.from({length:8},()=>Array(10).fill(0));
  const c=2,r=2;
  for(let dx=0;dx<4;dx++)tiles[r][c+dx]=1;
  for(let dx=0;dx<5;dx++)tiles[r+3][c+dx]=1;
  tiles[r+1][c]=tiles[r+2][c]=1;
  const level={id:'1-3',cols:10,rows:8,tiles,entities:[{type:'chest',col:c+1,row:r+2},{type:'colorgate',col:c+3,row:r+1}]};
  const before=JSON.stringify(level);
  const plan=cofferPlan(level);
  assert.equal(plan.col,c);assert.equal(plan.row,r);assert.equal(plan.cells.size,11);
  assert.equal(JSON.stringify(level),before);
  tiles[r+1][c+1]=1;assert.equal(cofferPlan(level),undefined);
});

test('organic walls split long thin pillars without painting twice',()=>{
 const tiles=Array.from({length:9},(_,r)=>[0,r<8?1:0,0]);
 const level={cols:3,rows:9,tiles};
 assert.deepEqual(organicWallSegments(level),[{col:1,r0:1,r1:3,side:'left'},{col:1,r0:4,r1:7,side:'left'}]);
});

test('ramp plans preserve paired tiles and exact contact geometry',()=>{
 const level={cols:6,rows:1,tiles:[[4,5,0,6,7,4]]};
 assert.deepEqual(organicRampPlans(level),[{col:0,row:0,up:true},{col:3,row:0,up:false}]);
 assert.deepEqual([0,64,128].map(x=>organicRampY(true,x)),[64,32,0]);
 assert.deepEqual([0,64,128].map(x=>organicRampY(false,x)),[0,32,64]);
});
test('corner transitions require three solid cells and leave the empty cell open',()=>{
 const level={cols:4,rows:4,tiles:[[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]]};
 const block=(c,r)=>level.tiles[r]?.[c]===1;
 assert.deepEqual(organicCornerPlans(level,block),[{col:2,row:1,side:'left'}]);
 level.tiles[2][2]=0;
 assert.deepEqual(organicCornerPlans(level,block),[]);
});

test('vista has clear air, a solid shelf, avoids critical entities and is deterministic',()=>{
 const tiles=Array.from({length:8},(_,r)=>Array(24).fill(r>=6?1:0));
 const level={cols:24,rows:8,tiles,entities:[{type:'checkpoint',col:10,row:5}]};
 const before=JSON.stringify(level);
 const p=organicVistaPlan(level);
 assert.ok(p);assert.equal(p.row,6);
 assert.ok(Math.abs(p.col-10)>Math.floor(p.span/2)+1);
 assert.deepEqual(organicVistaPlan(level),p);
 assert.equal(JSON.stringify(level),before);
 for(let c=0;c<24;c++)tiles[6][c]=3;
 assert.equal(organicVistaPlan(level),undefined);
});

test('foreground fades near player, remains bounded and respects quality',()=>{
 assert.equal(foregroundVisibility(96,720,'high').top,0);
 assert.equal(foregroundVisibility(648,720,'high').bottom,0);
 assert.deepEqual(foregroundVisibility(360,720,'high'),{top:.86,bottom:.78});
 const m=foregroundVisibility(360,720,'medium');
 assert.ok(m.top<.86&&m.bottom<.78);
 for(let y=-100;y<=820;y+=10){
   const a=foregroundVisibility(y,720,'high');
   assert.ok(a.top>=0&&a.top<=.86&&a.bottom>=0&&a.bottom<=.78);
 }
});

test('root sanctuary matches the real coffer envelope and refuses unsafe ground',()=>{
 const tiles=Array.from({length:22},(_,r)=>Array(32).fill(r>=20?1:0));
 const c=12,r=13;
 for(let dx=0;dx<4;dx++)tiles[r][c+dx]=1;
 for(let dx=0;dx<5;dx++)tiles[r+3][c+dx]=1;
 tiles[r+1][c]=tiles[r+2][c]=1;
 const level={id:'1-3',cols:32,rows:22,tiles,entities:[{type:'chest',col:c+1,row:r+2},{type:'colorgate',col:c+3,row:r+1}]};
 const before=JSON.stringify(level);
 assert.deepEqual(rootSanctuaryPlan(level),{x:448,y:648,width:960,height:640,groundRow:20,clear:{x:832,y:896,width:320,height:128}});
 assert.equal(JSON.stringify(level),before);
 tiles[20][c+7]=0;
 assert.equal(rootSanctuaryPlan(level),undefined);
});

test('macro scenes reserve the primary landmark and use separated clear shelves',()=>{
 const tiles=Array.from({length:9},(_,r)=>Array(180).fill(r>=7?1:0));
 const level={world:1,id:'1-1',cols:180,rows:9,tiles,entities:[]};
 const before=JSON.stringify(level),main=organicVistaPlan(level),plans=organicMacroPlans(level);
 assert.equal(plans.length,2);
 assert.ok(plans.every(p=>Math.abs(p.col-main.col)>=20&&p.row===7));
 assert.ok(Math.abs(plans[0].col-plans[1].col)>=20);
 assert.deepEqual(organicMacroPlans(level),plans);assert.equal(JSON.stringify(level),before);
 assert.deepEqual(organicMacroPlans({...level,arena:'boss'}),[]);
});

test('terrain plate first chunk has exact crop and preserves the three-column gap',()=>{
  const tiles=Array.from({length:12},(_,r)=>Array.from({length:40},(_,c)=>r>=10&&(c<17||c>=20)?1:0));
  const level={world:1,id:'1-1',cols:40,rows:12,tiles,entities:[]};
  const before=JSON.stringify(level),p=terrainPlatePlan(level,artChunks(level)[0]);
  assert.equal(p.width,1280);assert.equal(p.height,160);assert.equal(p.y,608);
  assert.equal(p.polygons.length,34);assert.equal(p.replaceable,true);
  assert.equal(JSON.stringify(level),before);
  tiles[10][19]=1;assert.equal(terrainPlatePlan(level,artChunks(level)[0]).replaceable,false);
});

test('connected terrain plates group atomically and separate at real gaps',()=>{
  const tiles=Array.from({length:12},(_,r)=>Array.from({length:80},(_,c)=>r>=10&&(c<17||(c>=20&&c<58)||c>=60)?1:0));
  const level={world:1,id:'1-1',cols:80,rows:12,tiles,entities:[]};
  assert.deepEqual(terrainPlateGroups(level).map(g=>g.map(p=>p.id)),[['chunk_001'],['chunk_002','chunk_003'],['chunk_004']]);
  assert.equal(terrainPlateGroups(level)[1][0].rightConnected,true);
});
test('terrain seam matches world-space alpha and color, rejects hard discontinuities',()=>{
  const e=(y,rgba)=>({y,rgba:new Uint8ClampedArray(rgba)});
  const a=e(10,[100,70,40,255,90,60,30,255]);
  assert.equal(terrainSeamCompatible(a,e(9,[255,0,255,0,105,73,44,255,88,64,32,255])),true);
  assert.equal(terrainSeamCompatible(a,e(10,[100,70,40,0,90,60,30,255])),false);
  assert.equal(terrainSeamCompatible(a,e(10,[240,220,200,255,240,220,200,255])),false);
  assert.equal(terrainSeamCompatible(a,e(11,[100,70,40,255,90,60,30,255])),false);
});

test('terrain plate boundaries prefer gaps and preserve opening masses',()=>{
  const tiles=Array.from({length:22},(_,r)=>Array.from({length:60},(_,c)=>r>=20&&(c<13||(c>=16&&c<28)||c>=38)?1:0));
  const level={world:1,id:'1-2',cols:60,rows:22,tiles,entities:[]};
  const chunks=terrainArtChunks(level);
  assert.deepEqual(chunks.slice(0,2).map(p=>[p.c0,p.c1,p.width]),[[0,16,1024],[16,36,1280]]);
  assert.deepEqual(terrainPlateGroups(level).slice(0,2).map(g=>g.map(p=>[p.id,p.y,p.height,p.replaceable])),[[['chunk_001',1248,160,true]],[['chunk_002',1248,160,true]]]);
  assert.equal(chunks.at(-1).c1,level.cols);
});

test('tower pillar plan matches paired vertical geometry and refuses changed passage',()=>{
  const tiles=Array.from({length:22},(_,r)=>Array(30).fill(r>=20?1:0));
  for(let r=3;r<=14;r++)tiles[r][6]=1;
  for(let r=3;r<=19;r++)tiles[r][17]=1;
  tiles[6][7]=2;tiles[4][12]=2;tiles[2][17]=2;
  const level={world:1,id:'1-3',cols:30,rows:22,tiles,entities:[]};
  const before=JSON.stringify(level);
  assert.deepEqual(towerPillarPlans(level).map(p=>[p.id,p.col,p.row,p.width,p.height]),[['suspended',6,3,80,768],['anchored',17,3,80,1088]]);
  assert.equal(JSON.stringify(level),before);
  tiles[8][7]=1;assert.deepEqual(towerPillarPlans(level),[]);
});

test('painted tower bridge plan covers exactly the original one-way runs',()=>{
  const tiles=Array.from({length:22},(_,r)=>Array(30).fill(r>=20?1:0));
  for(let r=3;r<=14;r++)tiles[r][6]=1;
  for(let r=3;r<=19;r++)tiles[r][17]=1;
  for(let c=7;c<21;c++)tiles[2][c]=2;
  for(let i=0;i<8;i++)for(let c=6+(i%2===0?6:1);c<6+(i%2===0?6:1)+3;c++)tiles[4+i*2][c]=2;
  const level={world:1,id:'1-3',cols:30,rows:22,tiles,entities:[]};
  const before=JSON.stringify(level),plans=towerBridgePlans(level);
  assert.equal(plans.length,9);assert.equal(plans.reduce((n,p)=>n+p.length,0),38);
  assert.deepEqual(plans[0],{id:'canopy',col:7,row:2,length:14,x:448,y:120,width:896,height:32});
  assert.ok(plans.every(p=>Array.from({length:p.length},(_,i)=>tiles[p.row][p.col+i]===2).every(Boolean)));
  assert.equal(JSON.stringify(level),before);
  tiles[8][12]=0;assert.equal(towerBridgePlans(level).length,8);
});
