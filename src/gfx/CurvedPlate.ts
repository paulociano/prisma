import { CONTOUR_PAD, contourOffset, type OrganicContour } from '../world/OrganicContours';
import type { TerrainPlatePlan } from '../levels/ArtGeometry';
import { T, type LevelData } from '../levels/LevelBuilder';
import { TILE } from '../config';

export interface ContourRaster {canvas:HTMLCanvasElement;pad:number;pixels:number}
/** Extend the painted edge into safe empty space, preserving the opaque
 * core. Source colors are sampled from the same master, never from a new
 * decorative tile. Work is restricted to narrow bands near exposed edges. */
export function rasterCurvedPlate(source:CanvasImageSource,p:TerrainPlatePlan,level:LevelData,curves:readonly OrganicContour[]):ContourRaster{
  const pad=CONTOUR_PAD,w=p.width+2*pad,h=p.height+2*pad;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('contour canvas unavailable');
  ctx.drawImage(source,pad,pad);
  const img=ctx.getImageData(0,0,w,h);
  const data=img.data,original=data.slice();
  let pixels=0;
  const write=(wx:number,wy:number,sx:number,sy:number,alpha:number)=>{
    // Do not paint over spikes, ledges, other solids or outside the level.
    if(level.tiles[Math.floor(wy/TILE)]?.[Math.floor(wx/TILE)]!==T.Empty)return;
    const x=wx-p.x+pad,y=wy-p.y+pad,ix=sx-p.x+pad,iy=sy-p.y+pad;
    if(x<0||x>=w||y<0||y>=h||ix<pad||ix>=w-pad||iy<pad||iy>=h-pad)return;
    const a=(y*w+x)*4,b=(iy*w+ix)*4;
    if(original[b+3]<220||data[a+3]>=220)return;
    const opacity=Math.round(original[b+3]*alpha);
    if(opacity<=data[a+3])return;
    if(data[a+3]===0)pixels++;
    data[a]=original[b];data[a+1]=original[b+1];data[a+2]=original[b+2];data[a+3]=opacity;
  };
  for(const q of curves){
    if(q.axis==='top'){
      const y=q.from[1];
      if(y<p.y||y>=p.y+p.height)continue;
      for(let x=Math.max(q.from[0],p.x);x<Math.min(q.to[0],p.x+p.width);x++){
        const offset=contourOffset(q,x+.5);
        for(let d=1;d<=Math.ceil(offset);d++)write(x,y-d,x,y+Math.min(7,Math.floor(d/2)),Math.min(1,offset-d+1));
      }
    }else{
      const x=q.from[0],inside=q.side===-1?x:x-1;
      if(inside<p.x||inside>=p.x+p.width)continue;
      for(let y=Math.max(q.from[1],p.y);y<Math.min(q.to[1],p.y+p.height);y++){
        const offset=contourOffset(q,y+.5);
        for(let d=1;d<=Math.ceil(offset);d++){
          const target=q.side===-1?x-d:x+d-1;
          const sample=inside-q.side*Math.min(7,Math.floor(d/2));
          write(target,y,sample,y,Math.min(1,offset-d+1));
        }
      }
    }
  }
  ctx.putImageData(img,0,0);
  return {canvas,pad,pixels};
}
