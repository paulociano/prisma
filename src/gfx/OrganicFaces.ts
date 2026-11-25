import type Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';

let serial = 0;
const noise = (c: number, r: number, seed: number) => {
  const v = Math.sin(c * 127.1 + r * 311.7 + seed * 74.7) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * Bake textured landmasses in world-space strips. The face is continuous across
 * tiles; only decorative bulges reach into empty space (max 10 px).
 * Top surfaces, slopes, islands, shadows and physics remain owned by Terrain/GameScene.
 * The original renderer is retained if the texture budget or canvas allocation fails.
 */
export function bakeOrganicFaces(scene: Phaser.Scene, level: LevelData, into: Phaser.GameObjects.Container,
  texture: string, block: (c: number, r: number) => boolean): boolean {
  const H = level.rows * TILE, W = level.cols * TILE;
  const pad = 12, stride = 16 * TILE;
  // Budget actual occupied bounds, not the empty sky of tall levels.
  const spans: { x0:number;width:number;c0:number;c1:number;y0:number;y1:number }[]=[];
  let bytes=0;
  for(let x0=0;x0<W;x0+=stride){
    const width=Math.min(stride,W-x0),c0=x0/TILE,c1=(x0+width)/TILE;
    let r0=level.rows,r1=-1;
    for(let r=0;r<level.rows;r++)for(let c=c0;c<c1;c++)if(block(c,r)){r0=Math.min(r0,r);r1=Math.max(r1,r);}
    if(r1<0)continue;
    const y0=r0*TILE,y1=(r1+1)*TILE;
    if(y1-y0+pad*2>2048)return false;
    bytes+=(width+pad*2)*(y1-y0+pad*2)*4;
    spans.push({x0,width,c0,c1,y0,y1});
  }
  if(bytes>64*1024*1024)return false;
  const source = scene.textures.get(texture).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const sw = source.width * .5, sh = source.height * .5;
  if (!sw || !sh) return false;
  const made: { key: string; image: Phaser.GameObjects.Image }[] = [];
  const empty = (c: number, r: number) => c >= 0 && c < level.cols && r >= 0 && r < level.rows && level.tiles[r][c] === T.Empty;
  const id = ++serial;
  try {
    for (const {x0,width,c0,c1,y0,y1} of spans) {
      const canvas = document.createElement('canvas');
      canvas.width = width + pad * 2; canvas.height = y1-y0 + pad * 2;
      const g = canvas.getContext('2d');
      if (!g) throw Error('canvas unavailable');
      g.translate(pad - x0, pad-y0);
      // Union of occupied cells and continuous outward-rounded decorative edges.
      g.beginPath();
      let count = 0;
      for (let r = 0; r < level.rows; r++) for (let c = c0; c < c1; c++) {
        if (!block(c,r)) continue;
        count++;
        const x = c*TILE, y = r*TILE, right=x+TILE, bottom=y+TILE;
        const top = r === 0 || !block(c,r-1);
        const l = empty(c-1,r) ? 4+noise(c,r,1)*6 : 0;
        const rr = empty(c+1,r) ? 4+noise(c,r,2)*6 : 0;
        const b = empty(c,r+1) ? 3+noise(c,r,3)*6 : 0;
        // Top 14 px remain under the original painted cap; contact plane is exact.
        g.moveTo(x,y+(top?12:0)); g.lineTo(right,y+(top?12:0));
        g.bezierCurveTo(right+rr,y+26,right+rr,y+46,right,bottom);
        g.bezierCurveTo(right-17,bottom+b,x+17,bottom+b,x,bottom);
        g.bezierCurveTo(x-l,y+46,x-l,y+26,x,y+(top?12:0)); g.closePath();
      }
      if(!count) continue;
      g.clip();
      // Texture is sampled at a stable world coordinate, never restarted on a cell/chunk.
      for(let y=Math.floor((y0-pad)/sh)*sh;y<y1+pad;y+=sh) for(let x=Math.floor((x0-pad)/sw)*sw;x<x0+width+pad;x+=sw)
        g.drawImage(source,x,y,sw,sh);
      // Large-scale light modulation across the rock, independent of the grid.
      // A constant vertical illumination avoids visible seams between strips.
      const vertical=g.createLinearGradient(0,0,0,H);
      vertical.addColorStop(0,'rgba(255,211,156,0.07)');
      vertical.addColorStop(.55,'rgba(255,226,178,0.025)');
      vertical.addColorStop(1,'rgba(53,25,49,0.13)');
      g.fillStyle=vertical;g.fillRect(x0-pad,y0-pad,width+pad*2,y1-y0+pad*2);
      const key='organic_face_'+id+'_'+c0;
      if(!scene.textures.addCanvas(key,canvas))throw Error('texture unavailable');
      const image=scene.add.image(x0-pad,y0-pad,key).setOrigin(0);
      into.add(image);made.push({key,image});
    }
    scene.events.once('shutdown',()=>{for(const m of made)scene.textures.remove(m.key);});
    return true;
  } catch {
    for(const m of made){m.image.destroy();scene.textures.remove(m.key);}
    return false;
  }
}
