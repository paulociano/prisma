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
