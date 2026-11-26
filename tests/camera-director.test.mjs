import test from 'node:test';
import assert from 'node:assert/strict';
import {CameraDirector,cameraZones,regionalZoom} from '../.debug/camera-director.mjs';
const input={x:0,vx:0,vy:0,grounded:true,frozen:false,reduced:false,dt:1/60};
test('authored and entity regions blend without changing level data',()=>{
 const entities=[{col:20,type:'shard'},{col:50,type:'spring'},{col:10,type:'coin'}],authored=[{c0:60,c1:70,zoom:.88}];
 const before=JSON.stringify([entities,authored]);const zones=cameraZones(authored,entities);
 assert.equal(zones.length,3);assert.equal(JSON.stringify([entities,authored]),before);
 assert.equal(regionalZoom(0,zones),1);assert.equal(regionalZoom(20*64,zones),.93);
 assert.equal(regionalZoom(65*64,zones),.88);
 for(let x=0;x<80*64;x++)assert.ok(Math.abs(regionalZoom(x+1,zones)-regionalZoom(x,zones))<.002);
});
test('anticipates velocity and returns smoothly after reversal',()=>{
 const d=new CameraDirector([]);
 for(let i=0;i<120;i++)d.step({...input,vx:340});
 assert.ok(d.pose.x< -125);assert.equal(d.pose.mode,'traverse');
 const old=d.pose.x;d.step({...input,vx:-340});
 assert.ok(d.pose.x>old&&d.pose.x<0);
 for(let i=0;i<120;i++)d.step({...input,vx:-340});
 assert.ok(d.pose.x>125&&d.pose.x<=130);
 for(let i=0;i<120;i++)d.step(input);
 assert.ok(Math.abs(d.pose.x)<1);assert.equal(d.pose.mode,'rest');
});
test('air framing is bounded and distinguishes ascent and descent',()=>{
 const a=new CameraDirector([]),b=new CameraDirector([]);
 for(let i=0;i<60;i++){a.step({...input,grounded:false,vy:-900});b.step({...input,grounded:false,vy:900});}
 assert.ok(a.pose.y>60&&a.pose.y<=122);assert.ok(b.pose.y<60&&b.pose.y>=-24);
 assert.equal(a.pose.mode,'air');assert.ok(a.pose.zoom<1&&a.pose.zoom>=.955);
});
test('frame-rate independent damping for fixed input',()=>{
 const a=new CameraDirector([]),b=new CameraDirector([]);
 for(let i=0;i<60;i++)a.step({...input,vx:340,dt:1/60});
 for(let i=0;i<30;i++)b.step({...input,vx:340,dt:1/30});
 assert.ok(Math.abs(a.pose.x-b.pose.x)<1e-9);
});
test('held state, accessible mode and respawn reset camera history',()=>{
 const d=new CameraDirector([{c0:10,c1:20,zoom:.9}]);
 d.step({...input,vx:340});const previous=d.pose;
 const held=d.step({...input,frozen:true,vx:-340});assert.deepEqual(held,{...previous,mode:'held'});
 assert.deepEqual(d.step({...input,reduced:true}),{x:0,y:60,zoom:1,mode:'accessible'});
 assert.deepEqual(d.reset(15*64),{x:0,y:60,zoom:.9,mode:'rest'});
 assert.deepEqual(d.reset(0,true),{x:0,y:60,zoom:1,mode:'accessible'});
});
