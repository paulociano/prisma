import test from 'node:test';
import assert from 'node:assert/strict';
import {lightRect,illuminatePatch} from '../.debug/material-lighting.mjs';
const light={x:4.5,y:4.5,radius:4,intensity:.5,color:[1,.7,.4]};
const map=(nx=128)=>({width:9,height:9,normals:Uint8ClampedArray.from(Array.from({length:81},()=>[nx,128,255,255]).flat()),elevation:new Float32Array(81)});
const rgba=()=>Uint8ClampedArray.from(Array.from({length:81},()=>[90,100,110,255]).flat());
test('intersection clips to texture and rejects distant light',()=>{
 assert.deepEqual(lightRect(light,0,0,9,9),{x:0,y:0,w:9,h:9});
 assert.equal(lightRect(light,100,0,9,9),undefined);
 assert.deepEqual(lightRect({...light,x:-2,y:4},0,0,9,9),{x:0,y:0,w:2,h:8});
});
test('point light has bounded falloff and preserves alpha and empty pixels',()=>{
 const a=rgba();a[3]=0;a[7]=100;const b=a.slice();
 const n=illuminatePatch(b,{x:0,y:0,w:9,h:9},0,0,9,9,map(),light);
 assert.ok(n>0);assert.deepEqual(b.slice(0,8),a.slice(0,8));
 for(let i=3;i<b.length;i+=4)assert.equal(b[i],a[i]);
 const center=(4*9+4)*4,edge=(4*9+7)*4;
 assert.ok(b[center]>b[edge]&&b[edge]>a[edge]);
 assert.ok(b[center]-a[center]>b[center+2]-a[center+2]);
 assert.deepEqual(b.slice(-4),a.slice(-4));
});
test('surface orientation changes diffuse response',()=>{
 const a=rgba(),b=a.slice(),r={x:0,y:0,w:9,h:9},l={...light,x:7.5};
 illuminatePatch(a,r,0,0,9,9,map(200),l);
 illuminatePatch(b,r,0,0,9,9,map(55),l);
 const i=(4*9+4)*4;assert.ok(a[i]>b[i]);
});
