/** Derived material, not measured physical height. Normal RGB encodes
 * [-1,1], A stores local occlusion (255 = unoccluded). Height is separate. */
export interface ReliefMap {
  readonly width:number; readonly height:number;
  readonly normals:Uint8ClampedArray; readonly elevation:Float32Array;
}
export function deriveRelief(rgba:Uint8ClampedArray,w:number,h:number):ReliefMap{
  if(w<1||h<1||!Number.isInteger(w)||!Number.isInteger(h)||rgba.length!==w*h*4)throw Error('Invalid material input');
  const n=w*h,raw=new Float32Array(n),height=new Float32Array(n),normals=new Uint8ClampedArray(n*4);
  for(let i=0;i<n;i++)raw[i]=(rgba[i*4]*.2126+rgba[i*4+1]*.7152+rgba[i*4+2]*.0722)/255;
  const index=(x:number,y:number)=>Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x));
  const sample=(a:Float32Array,x:number,y:number,i:number)=>{
    const j=index(x,y);return rgba[j*4+3]>=220?a[j]:a[i];
  };
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;
    height[i]=(raw[i]*4+sample(raw,x-1,y,i)+sample(raw,x+1,y,i)+sample(raw,x,y-1,i)+sample(raw,x,y+1,i))/8;
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,j=i*4;
    if(rgba[j+3]<220){normals.set([128,128,255,255],j);continue;}
    const l=sample(height,x-1,y,i),r=sample(height,x+1,y,i),t=sample(height,x,y-1,i),b=sample(height,x,y+1,i);
    const nx=(l-r)*2.2,ny=(t-b)*2.2,len=Math.hypot(nx,ny,1);
    normals[j]=(nx/len*.5+.5)*255;normals[j+1]=(ny/len*.5+.5)*255;normals[j+2]=(1/len*.5+.5)*255;
    const concavity=Math.max(0,(l+r+t+b)/4-height[i]);
    normals[j+3]=255*(1-Math.min(.16,concavity*.9));
  }
  return {width:w,height:h,normals,elevation:height};
}
/** Small, neutral-centered diffuse/AO preview. Fade at crop boundaries
 * to keep the original continuous painting authoritative at seams. */
export function shadeRelief(rgba:Uint8ClampedArray,w:number,h:number,map:ReliefMap,strength:number,edgeFade:number,edgeStart=0,edgeEnd=w):Uint8ClampedArray{
  if(rgba.length!==w*h*4)throw Error('Invalid material target');
  const out=rgba.slice(),s=Math.max(0,Math.min(1,strength));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;if(!rgba[i+3])continue;
    const mx=Math.min(map.width-1,Math.floor(x*map.width/w)),my=Math.min(map.height-1,Math.floor(y*map.height/h)),j=(my*map.width+mx)*4;
    const nx=map.normals[j]/127.5-1,ny=map.normals[j+1]/127.5-1,nz=map.normals[j+2]/127.5-1;
    const diffuse=-.36*nx-.48*ny+.8*nz;
    const ao=map.normals[j+3]/255;
    const edge=edgeFade>0?Math.max(0,Math.min(1,(x-edgeStart)/edgeFade,(edgeEnd-1-x)/edgeFade)):1;
    const gain=1+s*edge*Math.max(-.24,Math.min(.20,(diffuse-.8)*.85+(ao-1)*.6));
    for(let k=0;k<3;k++)out[i+k]=rgba[i+k]*gain;
  }
  return out;
}

/** Broad mineral/temperature variation in world coordinates, independent of
 * crop boundaries. Modulate existing pigment; never invent rock geometry. */
export function gradePigments(data:Uint8ClampedArray,w:number,h:number,worldX:number,worldY:number):number{
  if(data.length!==w*h*4)throw Error('Invalid pigment target');
  const horizontal=new Float32Array(w),vertical=new Float32Array(h),warmth=new Float32Array(w);
  for(let x=0;x<w;x++){
    const wx=worldX+x+.5;
    horizontal[x]=.033*Math.sin(wx*.0031)+.022*Math.sin(wx*.0073+1.7);
    warmth[x]=.018*Math.sin(wx*.0019+.9);
  }
  for(let y=0;y<h;y++)vertical[y]=.013*Math.sin((worldY+y+.5)*.021);
  let changed=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;if(data[i+3]<220)continue;
    const r=data[i],g=data[i+1],b=data[i+2],l=.2126*r+.7152*g+.0722*b;
    // Keep red foliage distinctive; tame only the strongest chroma slightly.
    const saturation=(Math.max(r,g,b)-Math.min(r,g,b))/255;
    const mix=Math.max(0,(saturation-.60))*.11;
    const tone=horizontal[x]+vertical[y],t=warmth[x];
    data[i]=(r+(l-r)*mix)*(1+tone+t);
    data[i+1]=(g+(l-g)*mix)*(1+tone);
    data[i+2]=(b+(l-b)*mix)*(1+tone-t);
    if(data[i]!==r||data[i+1]!==g||data[i+2]!==b)changed++;
  }
  return changed;
}

/** Bound the full-resolution painted copies separately from derived maps.
 * Lanterns has taller crops; keep art resolution and reduce only relief data. */
export function materialBudget(level:string,quality:'low'|'medium'|'high'){
  return level==='1-2'?{pixelLimit:12_000_000,mapDivisor:quality==='high'?3:4}:{pixelLimit:10_000_000,mapDivisor:2};
}
