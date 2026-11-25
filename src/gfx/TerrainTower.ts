import type Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { towerPillarPlans } from '../levels/ArtGeometry';

/** Replace only the exact pillar cells after validating both source textures.
 * A mismatch leaves the original terrain renderer untouched. */
export function paintTowerPillars(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container,covered:Set<number>):Set<number>{
  const cells=new Set<number>(),plans=towerPillarPlans(level);
  if(plans.length!==2||plans.some(p=>covered.has(p.col)))return cells;
  const key=(id:string)=>'w1_tower_'+id;
  try{
    for(const p of plans){
      if(!scene.textures.exists(key(p.id)))return cells;
      const src=scene.textures.get(key(p.id)).getSourceImage() as CanvasImageSource & {width:number;height:number};
      if(src.width!==p.width||src.height!==p.height)return cells;
      const canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;
      const g=canvas.getContext('2d');if(!g)return cells;g.drawImage(src,0,0);
      const pixels=g.getImageData(0,0,p.width,p.height).data;
      for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){
        const alpha=pixels[(y*p.width+x)*4+3];
        if(x>=8&&x<8+TILE){if(alpha<220)return cells;}
        else if(alpha>24&&level.tiles[p.row+Math.floor(y/TILE)]?.[p.col+(x<8?-1:1)]!==T.Empty)return cells;
      }
    }
    const added:Phaser.GameObjects.Image[]=[];
    try{
      for(const p of plans){const image=scene.add.image(p.x,p.y,key(p.id)).setOrigin(0).setData('terrainTower',p.id);added.push(image);into.add(image);}
    }catch{added.forEach(o=>o.destroy());return cells;}
    for(const p of plans)for(let r=p.row;r<p.row+p.length;r++)cells.add(r*level.cols+p.col);
    scene.data.set('terrainTowerPillars',plans);
  }catch{return new Set<number>();}
  return cells;
}
