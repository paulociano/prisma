import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { validatePlatePixels, checkSeam, importMaster } from '../scripts/import-terrain-master.mjs';
const rgba=(w,h,a=255,r=90)=>Uint8Array.from({length:w*h*4},(_,i)=>i%4===3?a:i%4===0?r:80);
test('master crop accepts opaque terrain and rejects gaps and incomplete cells',()=>{
  const w=64,h=64,mask=rgba(w,h),art=rgba(w,h);
  assert.doesNotThrow(()=>validatePlatePixels(art,mask,w,h));
  const hole=rgba(w,h);hole.fill(0,0,4*64);
  assert.throws(()=>validatePlatePixels(art,hole,w,h),/outside/);
  assert.throws(()=>validatePlatePixels(rgba(w,h,0),mask,w,h),/coverage/);
});
test('master crop cannot hide incomplete coverage in a different cell',()=>{
  const w=128,h=64,mask=rgba(w,h),art=rgba(w,h);
  for(let y=0;y<h;y++)for(let x=64;x<68;x++)art[(y*w+x)*4+3]=0;
  assert.throws(()=>validatePlatePixels(art,mask,w,h),/coverage/);
});
test('seam aligns at world Y, rejects color jumps and unmatched alpha',()=>{
  const left={y:0,width:2,height:2,data:rgba(2,2)};
  assert.doesNotThrow(()=>checkSeam(left,{...left}));
  assert.throws(()=>checkSeam(left,{...left,y:1}),/discontinuity/);
  assert.throws(()=>checkSeam(left,{...left,data:rgba(2,2,255,200)}),/discontinuity/);
});

test('import dry run, exact crop writes and overwrite protection',async()=>{
  const old=process.cwd(),tmp=await fs.mkdtemp(path.join(os.tmpdir(),'prisma-master-'));
  try{
    process.chdir(tmp);
    const dir='.debug/art-packs/1-2',id='group_001_002';
    await fs.mkdir(dir,{recursive:true});
    const mask=Buffer.from(rgba(128,64));
    const png=await sharp(mask,{raw:{width:128,height:64,channels:4}}).png().toBuffer();
    await fs.writeFile('master.png',png);
    await fs.writeFile(path.join(dir,id+'-master-mask.png'),png);
    const members=[0,64].map((x,i)=>({id:'chunk_00'+(i+1),x,y:0,width:64,height:64,mask:'chunk_00'+(i+1)+'-terrain-mask.png'}));
    for(const m of members)await sharp(png).extract({left:m.x,top:0,width:64,height:64}).png().toFile(path.join(dir,m.mask));
    await fs.writeFile(path.join(dir,id+'-master.json'),JSON.stringify({schema:1,level:'1-2',id,x:0,y:0,width:128,height:64,protectedArea:false,mask:id+'-master-mask.png',members}));
    const output='assets/raw/w1/organic/terrain/1-2';
    assert.equal((await importMaster('1-2',id,'master.png')).written,false);
    await assert.rejects(fs.access(output),{code:'ENOENT'});
    assert.equal((await importMaster('1-2',id,'master.png',{write:true})).written,true);
    for(const m of members){
      const result=await sharp(path.join(output,m.id+'.png')).metadata();
      assert.equal(result.width,64);assert.equal(result.height,64);assert.equal(result.hasAlpha,true);
    }
    await assert.rejects(importMaster('1-2',id,'master.png',{write:true}),/Destination exists/);
  }finally{process.chdir(old);await fs.rm(tmp,{recursive:true,force:true});}
});
