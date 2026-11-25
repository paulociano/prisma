import { TILE } from '../config';
import { T, isRamp, rampHeights, type LevelData } from './LevelBuilder';

export interface WallRun { col: number; r0: number; r1: number; side: 'left' | 'right' }

/** Pure, deterministic presentation geometry. Never mutates LevelData. */
export function exposedWallRuns(level: LevelData, block?: (c: number, r: number) => boolean): WallRun[] {
  const { cols, rows, tiles } = level;
  const at = (c: number, r: number) => c < 0 || c >= cols ? T.Solid : r < 0 || r >= rows ? T.Empty : tiles[r][c];
  const isBlock = block ?? ((c, r) => at(c, r) === T.Solid);
  const out: WallRun[] = [];
  for (let c = 0; c < cols; c++) for (const side of ['left', 'right'] as const) {
    const neighbor = c + (side === 'left' ? -1 : 1);
    if (neighbor < 0 || neighbor >= cols) continue;
    let start = -1;
    for (let r = 0; r <= rows; r++) {
      const next = at(neighbor, r);
      const exposed = r < rows && isBlock(c, r) && at(c, r - 1) === T.Solid && next !== T.Solid && !isRamp(next);
      if (exposed && start < 0) start = r;
      if (!exposed && start >= 0) { out.push({ col: c, r0: start, r1: r - 1, side }); start = -1; }
    }
  }
  return out;
}

export interface ArtChunk { id: string; c0: number; c1: number; x: number; y: number; width: number; height: number }

/** Non-overlapping, half-open column ranges with exact world pixel bounds. */
export function artChunks(level: LevelData, columns = 20): ArtChunk[] {
  if (!Number.isInteger(columns) || columns < 1) throw new Error('Invalid chunk width');
  const chunks: ArtChunk[] = [];
  for (let c0 = 0; c0 < level.cols; c0 += columns) {
    const c1 = Math.min(level.cols, c0 + columns);
    chunks.push({ id: 'chunk_' + String(chunks.length + 1).padStart(3, '0'), c0, c1, x: c0 * TILE, y: 0, width: (c1 - c0) * TILE, height: level.rows * TILE });
  }
  return chunks;
}

/** Guide only: exact grid cells and ramp polygons, not dynamic entity hitboxes. */
export function tilePolygon(tile: T, c: number, r: number): [number, number][] {
  const x = c * TILE, y = r * TILE, b = y + TILE;
  if (tile === T.Empty) return [];
  if (isRamp(tile)) {
    const [a, z] = rampHeights(tile);
    return [[x, b], [x, b - a * TILE], [x + TILE, b - z * TILE], [x + TILE, b]];
  }
  if (tile === T.OneWay) return [[x,y],[x+TILE,y],[x+TILE,y+16],[x,y+16]];
  if (tile === T.Spike) return [[x+4,y+26],[x+TILE-4,y+26],[x+TILE-4,y+62],[x+4,y+62]];
  return [[x,y],[x+TILE,y],[x+TILE,b],[x,b]];
}

/** A camera-sized art reference centered on an entity in the final generated level. */
export function focusArtChunk(level: LevelData, col: number, columns = 20): ArtChunk {
  if (!Number.isInteger(columns) || columns < 1 || !Number.isFinite(col)) throw new Error('Invalid focus');
  const span = Math.min(columns, level.cols);
  const c0 = Math.max(0, Math.min(level.cols-span, Math.floor(col-span/2)));
  return { id:'focus',c0,c1:c0+span,x:c0*TILE,y:0,width:span*TILE,height:level.rows*TILE };
}

/** Match the authored C-shaped coffer after procedural extension, never by absolute column. */
export function cofferPlan(level: LevelData): { col:number; row:number; cells:Set<number> } | undefined {
  if(level.id!=='1-3')return;
  const at=(c:number,r:number)=>level.tiles[r]?.[c];
  for(const chest of level.entities.filter(e=>e.type==='chest')){
    const c=chest.col-1,r=chest.row-2;
    if(c<1||r<1||c+5>=level.cols||r+4>=level.rows)continue;
    if(!level.entities.some(e=>e.type==='colorgate'&&e.col===c+3&&e.row===r+1))continue;
    const cells=new Set<number>();let ok=true;
    for(let dy=-1;dy<=4;dy++)for(let dx=-1;dx<=5;dx++){
      const solid=(dy===0&&dx>=0&&dx<=3)||(dy===3&&dx>=0&&dx<=4)||((dy===1||dy===2)&&dx===0);
      if(solid){if(at(c+dx,r+dy)!==T.Solid)ok=false;cells.add((r+dy)*level.cols+c+dx);}
      else if(at(c+dx,r+dy)!==T.Empty)ok=false;
    }
    if(ok)return {col:c,row:r,cells};
  }
}

/** Art-only vertical sections. Prefer one face on thin pillars. */
export function organicWallSegments(level:LevelData,block?:(c:number,r:number)=>boolean):WallRun[]{
  const runs=exposedWallRuns(level,block).filter(w=>w.r1-w.r0+1>=2);
  const out:WallRun[]=[];
  for(const w of runs){
    if(w.side==='right'&&runs.some(l=>l.side==='left'&&l.col===w.col&&l.r0<=w.r1&&l.r1>=w.r0))continue;
    const count=w.r1-w.r0+1,n=Math.ceil(count/5);
    for(let i=0;i<n;i++)out.push({...w,r0:w.r0+Math.floor(i*count/n),r1:w.r0+Math.floor((i+1)*count/n)-1});
  }
  return out;
}

export interface OrganicRampPlan {col:number;row:number;up:boolean}
/** Match complete, authored two-cell ramps. Geometry remains read-only. */
export function organicRampPlans(level:LevelData):OrganicRampPlan[]{
  const out:OrganicRampPlan[]=[];
  for(let r=0;r<level.rows;r++)for(let c=0;c<level.cols-1;c++){
    const a=level.tiles[r][c],b=level.tiles[r][c+1];
    if(a===T.RampR1&&b===T.RampR2)out.push({col:c,row:r,up:true});
    if(a===T.RampL2&&b===T.RampL1)out.push({col:c,row:r,up:false});
  }
  return out;
}
/** Pixel offset relative to the top of the ramp row, at a local x in [0,128]. */
export function organicRampY(up:boolean,x:number):number{
  const u=Math.max(0,Math.min(1,x/(2*TILE)));
  return TILE*(up?1-u:u);
}
export interface OrganicCornerPlan {col:number;row:number;side:'left'|'right'}
/** Three occupied cells around an empty concave corner; never bridge a gap. */
export function organicCornerPlans(level:LevelData,block:(c:number,r:number)=>boolean):OrganicCornerPlan[]{
  const out:OrganicCornerPlan[]=[];
  for(let r=1;r<level.rows-1;r++)for(let c=1;c<level.cols-1;c++){
    if(level.tiles[r][c]!==T.Empty||!block(c,r+1))continue;
    for(const side of ['left','right'] as const){
      const n=c+(side==='left'?-1:1);
      if(block(n,r)&&block(n,r+1))out.push({col:c,row:r,side});
    }
  }
  return out;
}

export interface OrganicVistaPlan {col:number;row:number;span:number}
/** Select one calm, ground-anchored vista in the final map. The whole envelope
 * is checked against the tile grid, not against the pre-extension layout.
 * It is strictly decorative, with a preference for unoccupied scenery.
 */
export function organicVistaPlan(level:LevelData, fraction=.45, exclude:OrganicVistaPlan[]=[]):OrganicVistaPlan|undefined {
  if(level.arena)return;
  const target=Math.floor(level.cols*fraction);
  const forbidden=new Set(['player','exit','checkpoint','shard','chest','guardian','colorgate','gate','portal','mover','spring']);
  const entities=level.entities??[];
  let best:OrganicVistaPlan|undefined,score=Infinity;
  for(const span of [7,5]){
    const half=Math.floor(span/2);
    for(let r=4;r<level.rows;r++)for(let c=half+2;c<level.cols-half-2;c++){
      if(exclude.some(p=>Math.abs(p.col-c)<Math.max(20,(p.span+span)/2+6)))continue;
      let valid=true;
      for(let x=c-half;x<=c+half;x++){
        if(level.tiles[r][x]!==T.Solid){valid=false;break;}
        for(let y=r-4;y<r;y++)if(level.tiles[y][x]!==T.Empty){valid=false;break;}
        if(!valid)break;
      }
      if(!valid)continue;
      if(entities.some(e=>forbidden.has(e.type)&&Math.abs(e.col-c)<=half+1&&e.row>=r-5&&e.row<=r))continue;
      const density=entities.filter(e=>Math.abs(e.col-c)<=half+1&&e.row>=r-5&&e.row<=r).length;
      const cost=Math.abs(c-target)+density*7+(span===5?16:0);
      if(cost<score){best={col:c,row:r,span};score=cost;}
    }
  }
  return best;
}

/** Readability guard for the decorative foreground. Coordinates are in logical
 * screen pixels, after the camera zoom. No effect on world geometry. */
export function foregroundVisibility(screenY:number,height:number,quality:'medium'|'high'):{top:number;bottom:number}{
  const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
  const strength=quality==='high'?1:.72;
  return {
    top:strength*.86*smooth((screenY-96)/112),
    bottom:strength*.78*smooth((height-screenY-72)/112)
  };
}

export interface RootSanctuaryPlan {x:number;y:number;width:number;height:number;groundRow:number;clear:{x:number;y:number;width:number;height:number}}
/** Stage-specific scenery: locate the exact coffer and a continuous ground
 * shelf under the full illustration. No hard-coded generated column. */
export function rootSanctuaryPlan(level:LevelData):RootSanctuaryPlan|undefined{
  const p=cofferPlan(level);if(!p)return;
  const start=p.col-5,end=p.col+9,groundRow=p.row+7;
  if(start<0||end>=level.cols||groundRow>=level.rows)return;
  for(let c=start;c<=end;c++){
    if(level.tiles[groundRow][c]!==T.Solid||level.tiles[groundRow-1][c]!==T.Empty)return;
  }
  const width=15*TILE,height=10*TILE,x=start*TILE,y=groundRow*TILE-height+8;
  if(y<0)return;
  return {x,y,width,height,groundRow,clear:{x:(p.col+1)*TILE,y:(p.row+1)*TILE,width:5*TILE,height:2*TILE}};
}

/** Secondary scenes use real ground shelves, separated by at least one camera.
 * Keep the sanctuary and main landmark as protected anchors. */
export function organicMacroPlans(level:LevelData):OrganicVistaPlan[]{
  if(level.arena||level.world!==1)return [];
  const main=organicVistaPlan(level);const sanctuary=rootSanctuaryPlan(level);
  const reserved:OrganicVistaPlan[]=main?[main]:[];
  if(sanctuary)reserved.push({col:(sanctuary.x+sanctuary.width/2)/TILE,row:sanctuary.groundRow,span:sanctuary.width/TILE});
  const result:OrganicVistaPlan[]=[];
  for(const fraction of [.19,.76]){
    const p=organicVistaPlan(level,fraction,[...reserved,...result]);
    if(p&&Math.abs(p.col-level.cols*fraction)<=level.cols*.18)result.push(p);
  }
  return result;
}

export interface TerrainPlatePlan extends ArtChunk { polygons:[number,number][][]; replaceable:boolean; leftConnected:boolean; rightConnected:boolean; protectedArea:boolean }
/** Same exact cropped bounds for export and runtime. Independent plate replacement
 * requires isolation; connected plans can only be accepted as a complete group. */
export function terrainPlatePlan(level:LevelData,ch:ArtChunk):TerrainPlatePlan|undefined{
  if(level.world!==1||level.arena)return;
  const occupied=(c:number,r:number)=>{const t=level.tiles[r]?.[c];return t===T.Solid||isRamp(t);};
  const polygons:[number,number][][]=[];
  for(let r=0;r<level.rows;r++)for(let c=ch.c0;c<ch.c1;c++)if(occupied(c,r))polygons.push(tilePolygon(level.tiles[r][c],c,r));
  if(!polygons.length)return;
  const y=Math.max(0,Math.min(...polygons.flat().map(p=>p[1]))-TILE/2);
  const bottom=Math.min(level.rows*TILE,Math.max(...polygons.flat().map(p=>p[1]))+TILE/2);
  const connected=(a:number,b:number)=>a>=0&&b<level.cols&&Array.from({length:level.rows},(_,r)=>r).some(r=>occupied(a,r)&&occupied(b,r));
  const sanctuary=rootSanctuaryPlan(level);
  const protectedArea=!!sanctuary&&ch.x<sanctuary.x+sanctuary.width&&ch.x+ch.width>sanctuary.x;
  const leftConnected=connected(ch.c0-1,ch.c0),rightConnected=connected(ch.c1-1,ch.c1);
  return {...ch,y,height:bottom-y,polygons,leftConnected,rightConnected,protectedArea,replaceable:!protectedArea&&!leftConnected&&!rightConnected};
}

/** Connected chunks are all-or-nothing: never mix authored and fallback art
 * at an artificial cut through a solid mass. */
/** Prefer real gaps close to the nominal 20-column boundary. Preserve the
 * established first Vale plate and never exceed the texture budget. */
export function terrainArtChunks(level:LevelData):ArtChunk[]{
  const out:ArtChunk[]=[];
  const occupied=(c:number,r:number)=>{const t=level.tiles[r]?.[c];return t===T.Solid||isRamp(t);};
  for(let c0=0;c0<level.cols;){
    let c1=Math.min(level.cols,c0+20);
    if(c1<level.cols){
      for(let cut=c1;cut>=c0+12;cut--){
        if(!Array.from({length:level.rows},(_,r)=>r).some(r=>occupied(cut-1,r)&&occupied(cut,r))){c1=cut;break;}
      }
    }
    out.push({id:'chunk_'+String(out.length+1).padStart(3,'0'),c0,c1,x:c0*TILE,y:0,width:(c1-c0)*TILE,height:level.rows*TILE});
    c0=c1;
  }
  return out;
}
export function terrainPlateGroups(level:LevelData):TerrainPlatePlan[][]{
  const groups:TerrainPlatePlan[][]=[];
  for(const chunk of terrainArtChunks(level)){
    const plan=terrainPlatePlan(level,chunk);if(!plan)continue;
    const group=groups[groups.length-1],prev=group?.[group.length-1];
    if(prev&&prev.c1===plan.c0&&prev.rightConnected&&plan.leftConnected)group.push(plan);
    else groups.push([plan]);
  }
  return groups;
}
export interface PlateEdge {y:number;rgba:Uint8ClampedArray}
/** Compare edges at world-space Y, using premultiplied RGB to ignore hidden
 * colors in transparent pixels. Tolerance accommodates WebP quantization. */
export function terrainSeamCompatible(a:PlateEdge,b:PlateEdge):boolean{
  const start=Math.min(a.y,b.y),end=Math.max(a.y+a.rgba.length/4,b.y+b.rgba.length/4);
  let total=0,count=0;
  const get=(e:PlateEdge,y:number,k:number)=>e.rgba[(y-e.y)*4+k]??0;
  for(let y=start;y<end;y++){
    const aa=get(a,y,3),ba=get(b,y,3);
    const delta=Math.max(Math.abs(aa-ba),...[0,1,2].map(k=>Math.abs(get(a,y,k)*aa/255-get(b,y,k)*ba/255)));
    if(delta>48)return false;
    if(aa>24||ba>24){total+=delta;count++;}
  }
  return count>0&&total/count<=18;
}

export interface TowerPillarPlan {id:'suspended'|'anchored';col:number;row:number;length:number;x:number;y:number;width:number;height:number}
/** Identify the matching tower silhouette, not an absolute generated column. */
export function towerPillarPlans(level:LevelData):TowerPillarPlan[]{
  if(level.id!=='1-3'||level.arena)return [];
  const at=(c:number,r:number)=>level.tiles[r]?.[c];
  const single=(c:number,r:number)=>at(c,r)===T.Solid&&[at(c-1,r),at(c+1,r)].every(t=>t===T.Empty||t===T.OneWay);
  for(let c=1;c+12<level.cols;c++)for(let r=1;r+17<level.rows;r++){
    const right=c+11;
    if(at(c,r-1)!==T.Empty||at(right,r-1)!==T.OneWay||at(c,r+12)!==T.Empty)continue;
    if(!Array.from({length:12},(_,i)=>single(c,r+i)).every(Boolean)||!Array.from({length:17},(_,i)=>single(right,r+i)).every(Boolean))continue;
    if(![right-1,right,right+1].every(x=>at(x,r+17)===T.Solid))continue;
    // Signature: one-way ledges on opposite sides, leaving a climbing corridor.
    if(at(c+1,r+3)!==T.OneWay||at(c+6,r+1)!==T.OneWay)continue;
    const make=(id:TowerPillarPlan['id'],col:number,length:number):TowerPillarPlan=>({id,col,row:r,length,x:col*TILE-8,y:r*TILE,width:TILE+16,height:length*TILE});
    return [make('suspended',c,12),make('anchored',right,17)];
  }
  return [];
}

export interface TowerBridgePlan {id:'canopy'|'ruby'|'moss';col:number;row:number;length:number;x:number;y:number;width:number;height:number}
/** Keep every walkable contact within an existing one-way run. No new bridge
 * geometry; the alternate ledges and top passage belong to the tower signature. */
export function towerBridgePlans(level:LevelData):TowerBridgePlan[]{
  const pillars=towerPillarPlans(level);if(pillars.length!==2)return [];
  const {col,row}=pillars[0],at=(c:number,r:number)=>level.tiles[r]?.[c];
  const plans:TowerBridgePlan[]=[];
  const add=(id:TowerBridgePlan['id'],c:number,r:number,length:number)=>{
    if(at(c-1,r)===T.OneWay||at(c+length,r)===T.OneWay)return;
    for(let i=c;i<c+length;i++)if(at(i,r)!==T.OneWay||at(i,r-1)!==T.Empty)return;
    plans.push({id,col:c,row:r,length,x:c*TILE,y:r*TILE-8,width:length*TILE,height:32});
  };
  add('canopy',col+1,row-1,14);
  for(let i=0;i<8;i++)add(i%2===0?'ruby':'moss',col+(i%2===0?6:1),row+1+i*2,3);
  return plans;
}
