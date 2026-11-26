import test from 'node:test';
import assert from 'node:assert/strict';
import {lanternAnnexPlan,annexOverhang} from '../.debug/lantern-annex.mjs';
const level=()=>{const rows=22,cols=32,tiles=Array.from({length:rows},()=>Array(cols).fill(0));for(let r=1;r<=16;r++)for(let dx=0;dx<14;dx++)if(r===1||r===8||(r<8&&(dx===0||dx===13))||(r>=9&&dx>=5&&dx<=8))tiles[r][dx+3]=1;for(let c=8;c<=11;c++)tiles[5][c]=2;tiles[7][9]=tiles[7][10]=3;return {id:'1-2',rows,cols,tiles};};
test('annex signature follows actual solid cells and preserves aperture',()=>{
 const l=level(),before=JSON.stringify(l),p=lanternAnnexPlan(l);
 assert.ok(p);assert.equal(p.col,3);assert.equal(p.width,896);assert.equal(p.height,1024);assert.equal(p.cells.size,72);assert.equal(JSON.stringify(l),before);
 l.tiles[3][9]=1;assert.equal(lanternAnnexPlan(l),undefined);
});
test('exterior relief is bounded and tapered at contact corners',()=>{
 for(const n of [256,512]){assert.equal(annexOverhang(0,n,3,36),0);assert.equal(annexOverhang(n,n,3,36),0);let prev=0;for(let x=1;x<n;x++){const a=annexOverhang(x,n,3,36);assert.ok(a>=0&&a<=36);assert.ok(Math.abs(a-prev)<3);prev=a;}}
});
