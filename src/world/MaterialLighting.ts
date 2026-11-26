import type { ReliefMap } from './PictorialMaterial';
export interface MaterialLight {
  readonly x:number;readonly y:number;readonly radius:number;
  readonly intensity:number;readonly color:readonly [number,number,number];
}
export interface LightRect {readonly x:number;readonly y:number;readonly w:number;readonly h:number}
export function lightRect(light:MaterialLight,left:number,top:number,w:number,h:number):LightRect|undefined{
  const x=Math.max(0,Math.floor(light.x-light.radius-left)),y=Math.max(0,Math.floor(light.y-light.radius-top));
  const x1=Math.min(w,Math.ceil(light.x+light.radius-left)),y1=Math.min(h,Math.ceil(light.y+light.radius-top));
  if(x1<=x||y1<=y)return;
  return {x,y,w:x1-x,h:y1-y};
}
/** Local diffuse response from the registered normal map. Pixel RGB is
 * lit in place; alpha and empty pixels are never modified. */
export function illuminatePatch(data:Uint8ClampedArray,rect:LightRect,left:number,top:number,w:number,h:number,map:ReliefMap,light:MaterialLight):number{
  let changed=0;
  const radius=light.radius,rz=radius*.58;
  for(let y=0;y<rect.h;y++)for(let x=0;x<rect.w;x++){
    const i=(y*rect.w+x)*4;if(data[i+3]<220)continue;
    const u=rect.x+x,v=rect.y+y;
    const dx=light.x-(left+u+.5),dy=light.y-(top+v+.5),d2=dx*dx+dy*dy;
    if(d2>=radius*radius)continue;
    const mx=Math.min(map.width-1,Math.floor(u*map.width/w)),my=Math.min(map.height-1,Math.floor(v*map.height/h)),j=(my*map.width+mx)*4;
    const nx=map.normals[j]/127.5-1,ny=map.normals[j+1]/127.5-1,nz=map.normals[j+2]/127.5-1;
    const dot=Math.max(0,(nx*dx+ny*dy+nz*rz)/Math.sqrt(d2+rz*rz));
    const attenuation=1-d2/(radius*radius);
    const edge=Math.min(1,Math.max(0,Math.min(u,w-1-u)/8));
    // Fade only the relief-dependent part at an artificial crop edge.
    const response=(.55+.45*(.75+(dot-.75)*edge))*(map.normals[j+3]/255);
    const gain=Math.min(.45,light.intensity*attenuation*attenuation*response);
    let hit=false;
    for(let k=0;k<3;k++){const old=data[i+k];data[i+k]=old+(255-old)*gain*light.color[k];hit ||= data[i+k]!==old;}
    if(hit)changed++;
  }
  return changed;
}
