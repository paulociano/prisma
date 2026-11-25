import type Phaser from 'phaser';
import { TILE } from '../config';
import { type LevelData } from '../levels/LevelBuilder';
import { towerMacroPlan } from '../levels/ArtGeometry';

/** One image replaces only the tower visual cells. The ground remains behind
 * the softly blended base. Decorative connections have no collision. */
export function paintTowerMacro(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container,covered:Set<number>){
  const p=towerMacroPlan(level),key='w1_tower_macro';
  if(!p||p.pillars.some(q=>covered.has(q.col))||!scene.textures.exists(key))return;
  try{
    const src=scene.textures.get(key).getSourceImage() as CanvasImageSource & {width:number;height:number};
    if(src.width!==p.width||src.height!==p.height)return;
    const canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;
    const g=canvas.getContext('2d');if(!g)return;
    g.drawImage(src,0,0);
    const px=g.getImageData(0,0,p.width,p.height).data;
    const a=(x:number,y:number)=>px[(y*p.width+x)*4+3];
    for(const i of [...p.solids,...p.oneways]){
      const x=(i%level.cols-p.c0)*TILE,y=(Math.floor(i/level.cols)-p.r0)*TILE,h=p.solids.has(i)?TILE:16;
      let opaque=0;for(let dy=0;dy<h;dy++)for(let dx=0;dx<TILE;dx++)if(a(x+dx,y+dy)>=220)opaque++;
      if(opaque/(TILE*h)<.98)return;
    }
    // Central climb corridor remains fully open; authored decoration is
    // restricted to the side structures and ground.
    for(let y=144;y<1152;y++)for(let x=350;x<420;x++)if(a(x,y)>24)return;
    const image=scene.add.image(p.x,p.y,key).setOrigin(0).setData('terrainMacro','root-tower');
    try{into.add(image);}catch{image.destroy();return;}
    scene.data.set('terrainTowerMacro',{x:p.x,y:p.y,width:p.width,height:p.height,solidCells:p.solids.size,onewayCells:p.oneways.size});
    return {image,solids:p.solids,oneways:p.oneways};
  }catch{return;}
}
