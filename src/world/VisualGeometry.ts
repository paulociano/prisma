import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { organicRampPlans, organicRampY, type OrganicRampPlan } from '../levels/ArtGeometry';

/** World-pixel contact data. The grid is only the current input adapter.
 * Renderers consume this immutable-by-contract snapshot, never mutate it. */
export type Contact = readonly [x:number,y:number];
export interface SurfaceRun {
  readonly c0:number; readonly c1:number; readonly row:number;
  readonly from:Contact; readonly to:Contact; readonly depths:readonly number[];
}
export interface WallFace {
  readonly col:number; readonly row:number; readonly rows:number; readonly side:-1|1;
  readonly from:Contact; readonly to:Contact;
}
export interface RampContact {readonly plan:OrganicRampPlan; readonly from:Contact; readonly to:Contact}
export interface LedgeRun {readonly col:number;readonly row:number;readonly length:number;readonly from:Contact;readonly to:Contact}
export interface VisualGeometry {
  readonly schema:1; readonly level:string;
  readonly surfaces:readonly SurfaceRun[]; readonly walls:readonly WallFace[];
  readonly ramps:readonly RampContact[];
}
export function planVisualGeometry(level:LevelData,covered:ReadonlySet<number>,islands:ReadonlySet<number>):VisualGeometry {
  const at=(c:number,r:number)=>level.tiles[r]?.[c];
  const block=(c:number,r:number)=>covered.has(c)&&at(c,r)===T.Solid&&!islands.has(r*level.cols+c);
  const surfaces:SurfaceRun[]=[],walls:WallFace[]=[],ramps:RampContact[]=[];
  for(let r=1;r<level.rows;r++)for(let c=0;c<level.cols;){
    if(!block(c,r)||at(c,r-1)!==T.Empty){c++;continue;}
    const c0=c;
    while(c<level.cols&&block(c,r)&&at(c,r-1)===T.Empty)c++;
    const depths=Array.from({length:c-c0},(_,i)=>{
      let bottom=r;while(bottom<level.rows&&block(c0+i,bottom))bottom++;
      return (bottom-r)*TILE;
    });
    surfaces.push({c0,c1:c-1,row:r,from:[c0*TILE,r*TILE],to:[c*TILE,r*TILE],depths});
  }
  for(let c=0;c<level.cols;c++)for(const side of [-1,1] as const){
    let r=1;
    while(r<level.rows){
      if(!block(c,r)||at(c+side,r)!==T.Empty){r++;continue;}
      const start=r;
      while(r<level.rows&&block(c,r)&&at(c+side,r)===T.Empty&&r-start<5)r++;
      const x=(side===-1?c:c+1)*TILE;
      walls.push({col:c,row:start,rows:r-start,side,from:[x,start*TILE],to:[x,r*TILE]});
    }
  }
  for(const q of organicRampPlans(level)){
    if(!covered.has(q.col)||!covered.has(q.col+1)||at(q.col,q.row-1)!==T.Empty||at(q.col+1,q.row-1)!==T.Empty)continue;
    ramps.push({plan:q,from:[q.col*TILE,q.row*TILE+organicRampY(q.up,0)],to:[(q.col+2)*TILE,q.row*TILE+organicRampY(q.up,2*TILE)]});
  }
  return {schema:1,level:level.id,surfaces,walls,ramps};
}
export function planVisualLedges(level:LevelData,excluded:ReadonlySet<number>):readonly LedgeRun[]{
  const at=(c:number,r:number)=>level.tiles[r]?.[c],out:LedgeRun[]=[];
  for(let r=1;r<level.rows-1;r++)for(let c=1;c<level.cols-1;){
    if(at(c,r)!==T.OneWay){c++;continue;}
    const start=c;while(c<level.cols&&at(c,r)===T.OneWay)c++;
    const length=c-start;
    if(length>8||at(start-1,r)!==T.Empty||at(c,r)!==T.Empty)continue;
    if(!Array.from({length},(_,i)=>at(start+i,r-1)===T.Empty&&at(start+i,r+1)===T.Empty&&!excluded.has(r*level.cols+start+i)).every(Boolean))continue;
    out.push({col:start,row:r,length,from:[start*TILE,r*TILE],to:[c*TILE,r*TILE]});
  }
  return out;
}
