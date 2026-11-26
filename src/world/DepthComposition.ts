/** Ordered pictorial planes. Screen-space sampling is separate from
 * world-space objects, whose camera transform must remain unmodified. */
export const VALE_DEPTH = {
  far:{factor:.08,space:'screen'},
  mid:{factor:.27,space:'screen'},
  near:{factor:.66,space:'screen'},
  architecture:{factor:1,space:'world',depth:-5},
  terrain:{factor:1,space:'world',depth:0},
  foregroundTop:{factor:1.12,space:'screen',band:48},
  foregroundBottom:{factor:1.24,space:'screen',band:44},
} as const;
export interface DepthBounds {readonly x:number;readonly y:number;readonly width:number;readonly height:number}
export interface DepthFrameInput {
  readonly scrollX:number;readonly scrollY:number;readonly zoom:number;
  readonly width:number;readonly height:number;readonly playerX:number;readonly playerY:number;
  readonly protectedPoints:readonly (readonly [number,number])[];
  readonly protectedBounds?:readonly DepthBounds[];
}
export function projectDepthPoint(x:number,y:number,f:DepthFrameInput):readonly [number,number]{
  return [(x-f.scrollX-f.width/2)*f.zoom+f.width/2,(y-f.scrollY-f.height/2)*f.zoom+f.height/2];
}
export function depthFrame(f:DepthFrameInput){
  const top=VALE_DEPTH.foregroundTop.band,bottom=VALE_DEPTH.foregroundBottom.band;
  // A foreground silhouette is either present or absent. It is never
  // a ghosted prop. Hide the strip if it would cover a player or hazard.
  const [px,py]=projectDepthPoint(f.playerX,f.playerY,f);
  let hideTop=py-72*f.zoom<top+12,hideBottom=py+48*f.zoom>f.height-bottom-12;
  for(const [x,y] of f.protectedPoints){
    const [sx,sy]=projectDepthPoint(x,y,f);
    if(sx< -48*f.zoom||sx>f.width+48*f.zoom)continue;
    if(sy+32*f.zoom>=0&&sy-32*f.zoom<top+8)hideTop=true;
    if(sy-32*f.zoom<=f.height&&sy+32*f.zoom>f.height-bottom-8)hideBottom=true;
  }
  for(const b of f.protectedBounds??[]){
    const [x0,y0]=projectDepthPoint(b.x,b.y,f);
    const [x1,y1]=projectDepthPoint(b.x+b.width,b.y+b.height,f);
    if(x1<0||x0>f.width||y1<0||y0>f.height)continue;
    if(y0<top+8)hideTop=true;
    if(y1>f.height-bottom-8)hideBottom=true;
  }
  return {far:f.scrollX*VALE_DEPTH.far.factor,mid:f.scrollX*VALE_DEPTH.mid.factor,near:f.scrollX*VALE_DEPTH.near.factor,
    foregroundTop:f.scrollX*VALE_DEPTH.foregroundTop.factor,foregroundBottom:f.scrollX*VALE_DEPTH.foregroundBottom.factor+700,
    showTop:!hideTop,showBottom:!hideBottom,playerScreen:[px,py] as const};
}
