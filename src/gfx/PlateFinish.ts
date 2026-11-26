import type Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { organicRampPlans } from '../levels/ArtGeometry';
import { paintOrganicGround } from './OrganicGround';
import { paintOrganicRamp } from './OrganicTransitions';

let serial=0;
/** Add illustrated caps and exposed root silhouettes over accepted plates.
 * The masters remain intact as fallback. Decorative overhang is restricted
 * to empty neighbors; these images never create physics bodies. */
export function paintPlateEdges(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container,covered:Set<number>,islands:Set<number>){
  const at=(c:number,r:number)=>level.tiles[r]?.[c];
  const block=(c:number,r:number)=>covered.has(c)&&at(c,r)===T.Solid&&!islands.has(r*level.cols+c);
  const stats={tops:0,walls:0,ramps:0,islandCells:islands.size};
  const wallKey='w1_organic_wall';
  if(scene.textures.exists(wallKey)){
    const src=scene.textures.get(wallKey).getSourceImage() as CanvasImageSource;
    for(let c=0;c<level.cols;c++)for(const side of [-1,1] as const){
      let r=1;
      while(r<level.rows){
        if(!block(c,r)||at(c+side,r)!==T.Empty){r++;continue;}
        const start=r;
        while(r<level.rows&&block(c,r)&&at(c+side,r)===T.Empty&&r-start<5)r++;
        const h=(r-start)*TILE,w=74;
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
  }
  for(let r=1;r<level.rows;r++)for(let c=0;c<level.cols;){
    if(!block(c,r)||at(c,r-1)!==T.Empty){c++;continue;}
    const start=c;
    while(c<level.cols&&block(c,r)&&at(c,r-1)===T.Empty)c++;
    if(paintOrganicGround(scene,into,'w1_organic_ground',start,c-1,r*TILE,level.rows,block,true))stats.tops++;
  }
  for(const q of organicRampPlans(level)){
    if(!covered.has(q.col)||!covered.has(q.col+1)||at(q.col,q.row-1)!==T.Empty||at(q.col+1,q.row-1)!==T.Empty)continue;
    if(paintOrganicRamp(scene,into,'w1_organic_ground',q))stats.ramps++;
  }
  scene.data.set('terrainFinish',stats);
}
