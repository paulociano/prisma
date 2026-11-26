import test from 'node:test';
import assert from 'node:assert/strict';
import { VALE_DEPTH, depthFrame, projectDepthPoint } from '../.debug/depth-composition.mjs';
const base={scrollX:0,scrollY:0,zoom:1,width:1280,height:720,playerX:640,playerY:360,protectedPoints:[]};
test('planes have ordered parallax rates and fixed world-space anchors',()=>{
 const a=depthFrame(base),b=depthFrame({...base,scrollX:100});
 const d=[b.far-a.far,b.mid-a.mid,b.near-a.near,100,b.foregroundTop-a.foregroundTop,b.foregroundBottom-a.foregroundBottom];
 assert.ok(d.every((x,i)=>i===0||x>d[i-1]));
 assert.equal(VALE_DEPTH.architecture.space,'world');assert.ok(VALE_DEPTH.architecture.depth<VALE_DEPTH.terrain.depth);
});
test('zoom projects about viewport center',()=>{
 assert.deepEqual(projectDepthPoint(640,360,{...base,zoom:2}),[640,360]);
 assert.deepEqual(projectDepthPoint(740,410,{...base,zoom:2}),[840,460]);
 assert.deepEqual(projectDepthPoint(740,410,{...base,scrollX:100,scrollY:50,zoom:2}),[640,360]);
});
test('foreground hides at player and hazard bands rather than becoming transparent',()=>{
 assert.equal(depthFrame(base).showTop,true);assert.equal(depthFrame(base).showBottom,true);
 assert.equal(depthFrame({...base,playerY:80}).showTop,false);
 assert.equal(depthFrame({...base,playerY:650}).showBottom,false);
 assert.equal(depthFrame({...base,protectedPoints:[[600,30]]}).showTop,false);
 assert.equal(depthFrame({...base,protectedPoints:[[600,690]]}).showBottom,false);
 assert.equal(depthFrame({...base,protectedPoints:[[3000,690]]}).showBottom,true);
 assert.equal(depthFrame({...base,zoom:2,playerY:230}).showTop,false);
});
