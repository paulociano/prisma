import type Phaser from 'phaser';
import { type LevelData } from '../levels/LevelBuilder';
import { towerBridgePlans, type TowerBridgePlan } from '../levels/ArtGeometry';

/** Thin one-way art only. The original physics zones are still constructed
 * by GameScene. Refuse incomplete tower sets rather than mix incompatible skins. */
export function paintTowerBridges(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container):Set<number>{
  const cells=new Set<number>(),plans=towerBridgePlans(level);
  if(plans.length!==9||scene.data.get('terrainTowerPillars')?.length!==2)return cells;
  const keys=new Map<TowerBridgePlan['id'],string>();
  try{
    for(const p of plans){
      if(keys.has(p.id))continue;
      const key='w1_bridge_'+p.id;if(!scene.textures.exists(key))return cells;
      const src=scene.textures.get(key).getSourceImage() as CanvasImageSource & {width:number;height:number};
      if(src.width!==p.width||src.height!==p.height)return cells;
      const canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;
      const g=canvas.getContext('2d');if(!g)return cells;g.drawImage(src,0,0);
      const px=g.getImageData(0,0,p.width,p.height).data;let contact=0;
      for(let x=0;x<p.width;x++){
        let found=false;for(let y=0;y<14;y++)if(px[(y*p.width+x)*4+3]>128){found=true;break;}
        if(found)contact++;
      }
      if(contact/p.width<.98)return cells;
      keys.set(p.id,key);
    }
    const added:Phaser.GameObjects.Image[]=[];
    try{
      for(const p of plans){
        const image=scene.add.image(p.x,p.y,keys.get(p.id)!).setOrigin(0).setData('terrainBridge',p.id);
        added.push(image);into.add(image);
      }
    }catch{added.forEach(o=>o.destroy());return cells;}
    for(const p of plans)for(let c=p.col;c<p.col+p.length;c++)cells.add(p.row*level.cols+c);
    scene.data.set('terrainTowerBridges',plans);
  }catch{return new Set<number>();}
  return cells;
}
