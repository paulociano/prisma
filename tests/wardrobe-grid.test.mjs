import test from 'node:test';
import assert from 'node:assert/strict';
import {wardrobeGrid} from '../scripts/wardrobe-grid.mjs';
function fixture(cols,rows){
 const w=cols*100,h=rows*120,data=new Uint8Array(w*h*4);
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)
  for(let y=r*120+15;y<r*120+100;y++)for(let x=c*100+18;x<c*100+82;x++)data[(y*w+x)*4+3]=255;
 return {w,h,data};
}
test('recognizes four horizontal idle poses without splitting characters',()=>{
 const g=wardrobeGrid(fixture(4,1),[2,2],4);
 assert.equal(g.cols,4);assert.equal(g.rows,1);assert.equal(g.seam,0);assert.equal(g.cells.length,4);
});
test('preserves the normal two-by-two idle and three-by-two jump layouts',()=>{
 for(const [c,r] of [[2,2],[3,2]]){
  const g=wardrobeGrid(fixture(c,r),[c,r],c*r);
  assert.equal(g.cols,c);assert.equal(g.rows,r);assert.equal(g.seam,0);
 }
});
test('tolerates narrow bridges between poses without merging entire cells',()=>{
 const img=fixture(3,2);
 for(let x=75;x<125;x++)img.data[(55*img.w+x)*4+3]=255;
 const g=wardrobeGrid(img,[3,2],6);
 assert.equal(g.cols,3);assert.equal(g.rows,2);assert.equal(g.cells.length,6);assert.ok(g.seam<.18);
});
