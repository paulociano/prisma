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
