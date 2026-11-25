import type Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { organicWallSegments } from '../levels/ArtGeometry';

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
  scene.data.set('organicFaceBytes',bytes);
  const source = scene.textures.get(texture).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const sw = source.width * .5, sh = source.height * .5;
  if (!sw || !sh) return false;
  const made: { key: string; image: Phaser.GameObjects.Image }[] = [];
  const empty = (c: number, r: number) => c >= 0 && c < level.cols && r >= 0 && r < level.rows && level.tiles[r][c] === T.Empty;
  const id = ++serial;
  const wallKey='w'+level.world+'_organic_wall';
  const wallSource=scene.textures.exists(wallKey)?scene.textures.get(wallKey).getSourceImage() as HTMLImageElement|HTMLCanvasElement:undefined;
  const wallSegments=wallSource?organicWallSegments(level,block):[];
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
        // A coherent rock profile across rows, rather than one random bump per tile.
        // Retain the physical core and limit protrusions to 10 world pixels.
        const profile=(edge:number,yy:number)=>3+7*(.5+.5*Math.sin(yy*.012+edge*.74)*Math.cos(yy*.021-edge*.31));
        const leftOpen=empty(c-1,r),rightOpen=empty(c+1,r);
        // Carry the silhouette through adjoining exposed rows. Only a real
        // corner closes the contour, rather than every 64-pixel tile boundary.
        const edgeAt=(side:-1|1,otherRow:number,yy:number)=>{
          const neighbor=c+side,edge=side===-1?c:c+1;
          return empty(neighbor,r)&&block(c,otherRow)&&empty(neighbor,otherRow)?profile(edge,yy):0;
        };
        const lt=top?0:edgeAt(-1,r-1,y),rt=top?0:edgeAt(1,r-1,y);
        const lb=edgeAt(-1,r+1,bottom),rb=edgeAt(1,r+1,bottom);
        const l1=leftOpen?profile(c,y+21):0,l2=leftOpen?profile(c,y+43):0;
        const r1=rightOpen?profile(c+1,y+21):0,r2=rightOpen?profile(c+1,y+43):0;
        const b = empty(c,r+1) ? 3+noise(c,r,3)*6 : 0;
        // Preserve the solid core and the exact top contact; all variation is
        // outward, bounded by the original 10px decorative margin.
        const capY=y+(top?12:0);
        g.moveTo(x-lt,capY); g.lineTo(right+rt,capY);
        g.bezierCurveTo(right+r1,y+26,right+r2,y+46,right+rb,bottom);
        g.bezierCurveTo(right-17,bottom+b,x+17,bottom+b,x-lb,bottom);
        g.bezierCurveTo(x-l2,y+46,x-l1,y+26,x-lt,capY); g.closePath();
      }
      if(!count) continue;
      g.clip();
      // Texture is sampled at a stable world coordinate, never restarted on a cell/chunk.
      for(let y=Math.floor((y0-pad)/sh)*sh;y<y1+pad;y+=sh) for(let x=Math.floor((x0-pad)/sw)*sw;x<x0+width+pad;x+=sw)
        g.drawImage(source,x,y,sw,sh);
      // World-space jittered painted rock and root decals. Neighbor stamps
      // are sampled identically in both strips so their seams stay continuous.
      const decalKey='w'+level.world+'_decals';
      if(scene.textures.exists(decalKey)){
        const atlas=scene.textures.get(decalKey);
        const stamp=(frame:number,x:number,y:number,w:number,h:number,angle:number,alpha:number)=>{
          if(!atlas.has(String(frame)))return;
          const f=atlas.get(String(frame));
          g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha=alpha;
          g.drawImage(f.source.image as CanvasImageSource,f.cutX,f.cutY,f.cutWidth,f.cutHeight,-w/2,-h/2,w,h);g.restore();
        };
        for(let r=Math.max(0,Math.floor((y0-160)/128));r<=Math.ceil((y1+160)/128);r++){
          for(let c=Math.max(0,Math.floor((x0-180)/144));c<=Math.ceil((x0+width+180)/144);c++){
            const x=c*144+28+noise(c,r,4)*88,y=r*128+15+noise(c,r,5)*84;
            if(!block(Math.floor(x/TILE),Math.floor(y/TILE)))continue;
            const size=92+noise(c,r,6)*92;
            stamp(noise(c,r,7)>.45?0:1,x,y,size,size*.73,(noise(c,r,8)-.5)*.9,.79);
            if(noise(c,r,9)>.28)stamp(2,x+18,y+24,size*1.3,size*.53,(noise(c,r,10)-.5)*1.7,.88);
            if(noise(c,r,11)>.72)stamp(3,x-21,y-18,48,34,(noise(c,r,12)-.5)*.8,.8);
          }
        }
      }
      // Paint the illustrated face inside the existing solid mask.
      if(wallSource)for(const q of wallSegments){
        const x=q.side==='left'?q.col*TILE-12:(q.col+1)*TILE-84;
        const y=q.r0*TILE-6,w=96,h=(q.r1-q.r0+1)*TILE+12;
        if(x+w<x0-pad||x>x0+width+pad||y+h<y0-pad||y>y1+pad)continue;
        g.save();
        if(q.side==='right'){g.translate(x+w,y);g.scale(-1,1);g.drawImage(wallSource,0,0,w,h);}
        else g.drawImage(wallSource,x,y,w,h);
        g.restore();
      }
      // Local shading is clipped to the actual solid mass.
      for(let r=0;r<level.rows;r++)for(let c=c0;c<c1;c++){
        if(!block(c,r))continue;
        const x=c*TILE,y=r*TILE;
        if(!block(c,r-1)){
          const q=g.createLinearGradient(0,y+12,0,y+52);
          q.addColorStop(0,'rgba(44,23,29,.36)');q.addColorStop(1,'rgba(44,23,29,0)');
          g.fillStyle=q;g.fillRect(x,y+12,TILE,40);
        }
        if(empty(c,r+1)){
          const q=g.createLinearGradient(0,y+TILE-26,0,y+TILE+9);
          q.addColorStop(0,'rgba(34,17,29,0)');q.addColorStop(1,'rgba(34,17,29,.4)');
          g.fillStyle=q;g.fillRect(x,y+TILE-26,TILE,35);
        }
        if(empty(c-1,r)||empty(c+1,r)){
          const left=empty(c-1,r),q=g.createLinearGradient(left?x:x+TILE,y,left?x+30:x+TILE-30,y);
          q.addColorStop(0,'rgba(38,22,32,.31)');q.addColorStop(1,'rgba(38,22,32,0)');
          g.fillStyle=q;g.fillRect(left?x:x+TILE-30,y,30,TILE);
        }
      }
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
    scene.data.set('organicAuthoredWalls',wallSegments);
    return true;
  } catch {
    for(const m of made){m.image.destroy();scene.textures.remove(m.key);}
    scene.data.set('organicFaceBytes',0);
    return false;
  }
}
