import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveRelief,shadeRelief,gradePigments} from '../.debug/pictorial-material.mjs';
const make=(w,h,fn)=>Uint8ClampedArray.from(Array.from({length:w*h},(_,i)=>fn(i%w,Math.floor(i/w))).flat());
test('flat painted material produces neutral normals and full occlusion channel',()=>{
 const a=make(5,5,()=>[130,130,130,255]);const m=deriveRelief(a,5,5);
 for(let i=0;i<m.normals.length;i+=4)assert.deepEqual([...m.normals.slice(i,i+4)],[128,128,255,255]);
 assert.deepEqual(shadeRelief(a,5,5,m,1,0),a);
});
test('directional luminance ramp creates normalized signed normals',()=>{
 const a=make(9,9,(x,y)=>[x*26,x*26,x*26,255]);const m=deriveRelief(a,9,9),i=(4*9+4)*4;
 assert.ok(m.normals[i]<128);assert.equal(m.normals[i+1],128);
 const xyz=[...m.normals.slice(i,i+3)].map(v=>v/127.5-1);
 assert.ok(Math.abs(Math.hypot(...xyz)-1)<.012);
});
test('transparent neighbors do not create dark halos in derived normals',()=>{
 const a=make(5,5,(x,y)=>x===0?[0,0,0,0]:[120,120,120,255]);const m=deriveRelief(a,5,5);
 assert.deepEqual([...m.normals.slice(4,8)],[128,128,255,255]);
 assert.deepEqual([...m.normals.slice(0,4)],[128,128,255,255]);
});
test('shading preserves every alpha byte and original crop edge colors',()=>{
 const a=make(24,8,(x,y)=>[(x*19+y*11)%255,(x*19+y*11)%255,(x*19+y*11)%255,y===0?0:y===1?80:255]);
 const m=deriveRelief(a,24,8),b=shadeRelief(a,24,8,m,1,4,2,22);
 assert.notDeepEqual(a,b);
 for(let y=0;y<8;y++)for(let x=0;x<24;x++){
  const i=(y*24+x)*4;assert.equal(a[i+3],b[i+3]);
  if(x<=2||x>=21)assert.deepEqual(a.slice(i,i+4),b.slice(i,i+4));
 }
 assert.deepEqual(shadeRelief(a,24,8,m,0,0),a);
});

test('world pigment field is crop invariant and leaves alpha intact',()=>{
 const w=32,h=12,a=make(w,h,(x,y)=>[130+x%5*15,80+y,45,x===0?80:255]),b=a.slice();
 assert.ok(gradePigments(b,w,h,1200,320)>0);
 const l=new Uint8ClampedArray(16*h*4),r=l.slice();
 for(let y=0;y<h;y++){l.set(a.slice(y*w*4,(y*w+16)*4),y*16*4);r.set(a.slice((y*w+16)*4,(y+1)*w*4),y*16*4);}
 gradePigments(l,16,h,1200,320);gradePigments(r,16,h,1216,320);
 for(let y=0;y<h;y++){
  assert.deepEqual(l.slice(y*64,(y+1)*64),b.slice(y*128,y*128+64));
  assert.deepEqual(r.slice(y*64,(y+1)*64),b.slice(y*128+64,(y+1)*128));
 }
 for(let i=3;i<a.length;i+=4)assert.equal(a[i],b[i]);
});
