import type Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { planVisualGeometry, planVisualLedges, type Contact } from '../world/VisualGeometry';
import { paintOrganicGround } from './OrganicGround';
import { paintOrganicRamp } from './OrganicTransitions';

let serial=0;
/** Debug-only line overlay; does not modify physics or production art. */
function drawContacts(scene:Phaser.Scene,into:Phaser.GameObjects.Container,lines:readonly {from:Contact;to:Contact}[],color:number){
  if(new URLSearchParams(window.location.search).get('geometry')!=='1'||!lines.length)return;
  const g=scene.add.graphics().lineStyle(2,color,1);
  for(const q of lines){g.beginPath();g.moveTo(...q.from);g.lineTo(...q.to);g.strokePath();}
  into.add(g);
}
/** Add illustrated caps and exposed root silhouettes over accepted plates.
 * The masters remain intact as fallback. Decorative overhang is restricted
 * to empty neighbors; these images never create physics bodies. */
export function paintPlateEdges(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container,covered:Set<number>,islands:Set<number>){
  const geometry=planVisualGeometry(level,covered,islands);
  scene.data.set('visualGeometry',geometry);
  const block=(c:number,r:number)=>covered.has(c)&&level.tiles[r]?.[c]===T.Solid&&!islands.has(r*level.cols+c);
  const stats={tops:0,walls:0,ramps:0,islandCells:islands.size};
  const wallKey='w1_organic_wall';
  if(scene.textures.exists(wallKey)){
    const src=scene.textures.get(wallKey).getSourceImage() as CanvasImageSource;
    for(const face of geometry.walls){
        const {col:c,side,row:start,rows}=face;
        const h=rows*TILE,w=74;
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const g=canvas.getContext('2d');if(!g)continue;
        try{
          if(side===1){g.translate(w,0);g.scale(-1,1);}
          g.drawImage(src,0,0,w,h);
          g.globalCompositeOperation='destination-in';
          const fade=g.createLinearGradient(0,0,w,0);
          fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(.42,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,0)');
          g.fillStyle=fade;g.fillRect(0,0,w,h);
          const key='plate_wall_finish_'+(++serial);
          if(!scene.textures.addCanvas(key,canvas))continue;
          const x=side===-1?c*TILE-10:(c+1)*TILE-w+10;
          into.add(scene.add.image(x,start*TILE,key).setOrigin(0).setData('plateWallFinish',true));
          scene.events.once('shutdown',()=>scene.textures.remove(key));
          stats.walls++;
        }catch{ /* keep the validated master */ }
    }
  }
  for(const q of geometry.surfaces){
    if(paintOrganicGround(scene,into,'w1_organic_ground',q.c0,q.c1,q.from[1],level.rows,block,true))stats.tops++;
  }
  for(const q of geometry.ramps){
    if(paintOrganicRamp(scene,into,'w1_organic_ground',q.plan))stats.ramps++;
  }
  scene.data.set('terrainFinish',stats);
  drawContacts(scene,into,geometry.surfaces,0x55ff99);
  drawContacts(scene,into,geometry.walls,0xffb45c);
  drawContacts(scene,into,geometry.ramps,0x66c8ff);
}

/** One-way ledges are shallower than solid islands and retain their original
 * collision zone. Wall-attached ledges, hazards and authored bridges stay intact. */
export function paintOrganicOneWays(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container,excluded:Set<number>):Set<number>{
  const cells=new Set<number>(),key='w1_organic_island';
  if(!scene.textures.exists(key))return cells;
  const src=scene.textures.get(key).getSourceImage();
  if(src.width!==448||src.height!==240)return cells;
  const ledges=planVisualLedges(level,excluded);
  scene.data.set('visualLedges',ledges);
  for(const {col:start,row:r,length:len} of ledges){
    const scale=len*TILE/384,h=60;
    into.add(scene.add.image(start*TILE-32*scale,r*TILE-h*.2,key).setOrigin(0).setDisplaySize(448*scale,h).setData('organicOneWay',true));
    for(let i=start;i<start+len;i++)cells.add(r*level.cols+i);
  }
  scene.data.set('organicOneWayCells',cells.size);
  drawContacts(scene,into,ledges,0xe8aaff);
  return cells;
}
