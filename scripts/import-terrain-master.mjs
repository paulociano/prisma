import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

// The master is one painting in world coordinates. Split only after every
// crop has passed validation; never stretch art or alter collision geometry.
export function validatePlatePixels(art,mask,w,h,x=0,y=0){
  const counts=new Map();
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const a=(j*w+i)*4+3;
    if(mask[a]>=250){
      const key=Math.floor((x+i)/64)+':'+Math.floor((y+j)/64);
      const count=counts.get(key)??[0,0];
      count[0]++;if(art[a]>=220)count[1]++;counts.set(key,count);
    }
    // Conservative authoring contract: no decorative overspill. This keeps
    // gaps, one-way platforms, and hazards clear without guessing geometry.
    if(mask[a]===0&&art[a]>24)throw Error('Paint outside terrain mask at '+i+','+j);
  }
  if(!counts.size||[...counts.values()].some(([n,k])=>k/n<.98))throw Error('Incomplete solid-cell coverage');
}
export function checkSeam(left,right){
  let total=0,count=0;
  const lo=Math.min(left.y,right.y),hi=Math.max(left.y+left.height,right.y+right.height);
  const pixel=(p,x,y,k)=>y<p.y||y>=p.y+p.height?0:p.data[((y-p.y)*p.width+x)*4+k];
  for(let y=lo;y<hi;y++){
    const a=pixel(left,left.width-1,y,3),b=pixel(right,0,y,3);
    if(left.mask&&right.mask){
      const m=(p,x,y)=>y<p.y||y>=p.y+p.height?0:p.mask[((y-p.y)*p.width+x)*4+3];
      const am=m(left,left.width-1,y),bm=m(right,0,y);
      if((am>=250&&bm===0)||(bm>=250&&am===0)){
        if(am>=250?(a<220||b>24):(b<220||a>24))throw Error('Seam geometry alpha mismatch at y='+y);
        continue;
      }
    }
    let d=Math.abs(a-b);
    for(let k=0;k<3;k++)d=Math.max(d,Math.abs(pixel(left,left.width-1,y,k)*a/255-pixel(right,0,y,k)*b/255));
    if(d>48)throw Error('Seam discontinuity at world-relative y='+y);
    if(a>24||b>24){total+=d;count++;}
  }
  if(!count||total/count>18)throw Error('Incompatible seam');
}
async function rgba(source){
  return sharp(source).toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true});
}
export async function importMaster(level,id,source,{write=false,overwrite=false}={}){
  if(!/^1-[123]$/.test(level)||!/^group_\d{3}_\d{3}$/.test(id))throw Error('Use a World 1 level and exported group ID');
  const dir=path.resolve('.debug/art-packs',level);
  const guide=JSON.parse(await fs.readFile(path.join(dir,id+'-master.json'),'utf8'));
  if(guide.schema!==1||guide.level!==level||guide.id!==id||guide.protectedArea||!guide.members?.length)throw Error('Invalid or protected group');
  const meta=await sharp(source).metadata();
  if(meta.format!=='png'||!meta.hasAlpha||meta.width!==guide.width||meta.height!==guide.height)throw Error('Master must be PNG RGBA at exact exported dimensions');
  const {data:master}=await rgba(source);
  if(guide.mask!==id+'-master-mask.png')throw Error('Invalid master mask name');
  const {data:masterMask,info:maskInfo}=await rgba(path.join(dir,guide.mask));
  if(maskInfo.width!==guide.width||maskInfo.height!==guide.height)throw Error('Master mask size mismatch');
  validatePlatePixels(master,masterMask,guide.width,guide.height,guide.x,guide.y);
  const output=path.resolve('assets/raw/w1/organic/terrain',level),prepared=[];
  let end=0;
  for(const p of guide.members){
    if(!/^chunk_\d{3}$/.test(p.id)||p.mask!==p.id+'-terrain-mask.png'||![p.x,p.y,p.width,p.height].every(Number.isInteger)||p.x!==end||p.y<0||p.width<=0||p.height<=0||p.x+p.width>guide.width||p.y+p.height>guide.height)throw Error('Invalid crop: '+p.id);
    end=p.x+p.width;
    const rect={left:p.x,top:p.y,width:p.width,height:p.height};
    const png=await sharp(master,{raw:{width:guide.width,height:guide.height,channels:4}}).extract(rect).png().toBuffer();
    const {data}=await rgba(png),{data:mask,info}=await rgba(path.join(dir,p.mask));
    if(info.width!==p.width||info.height!==p.height)throw Error('Mask size mismatch: '+p.id);
    validatePlatePixels(data,mask,p.width,p.height,guide.x+p.x,guide.y+p.y);
    const entry={...p,data,mask,png,target:path.join(output,p.id+'.png')};
    if(prepared.length)checkSeam(prepared.at(-1),entry);
    prepared.push(entry);
  }
  if(end!==guide.width)throw Error('Incomplete horizontal crop coverage');
  if(write){
    // Check every destination before writing any file. Stage all outputs in
    // the same directory, then rename; a failed validation never writes.
    await fs.mkdir(output,{recursive:true});
    if(!overwrite)for(const p of prepared){
      try{await fs.access(p.target);throw Error('Destination exists: '+p.target+' (use --overwrite)');}
      catch(e){if(e.code!=='ENOENT')throw e;}
    }
    const staged=[];
    try{
      for(const p of prepared){
        const temp=p.target+'.master-'+process.pid+'.tmp';
        await fs.writeFile(temp,p.png,{flag:'wx'});staged.push([temp,p.target]);
      }
      for(const [temp,target] of staged)await fs.rename(temp,target);
    }finally{await Promise.all(staged.map(([temp])=>fs.rm(temp,{force:true})));}
  }
  return {level,id,width:guide.width,height:guide.height,written:write,plates:prepared.map(p=>p.id)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [level,id,source,...flags]=process.argv.slice(2);
  if(!level||!id||!source||flags.some(x=>!['--write','--overwrite'].includes(x))){
    console.error('Usage: npm run art:import -- 1-2 group_003_004 painting.png [--write] [--overwrite]');
    process.exitCode=1;
  }else importMaster(level,id,source,{write:flags.includes('--write'),overwrite:flags.includes('--overwrite')})
    .then(result=>console.log(JSON.stringify(result,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
