import type Phaser from 'phaser';
import { TILE } from '../config';
import { F } from './art';
import { organicVistaPlan, type OrganicVistaPlan } from '../levels/ArtGeometry';
import type { LevelData } from '../levels/LevelBuilder';

export interface OrganicVista {layer:Phaser.GameObjects.Container;plan:OrganicVistaPlan;objects:number}
/** A place in the world, not a camera-relative sticker. The existing phase
 * landmark is recomposed with painted foliage from the same atlas.
 * Everything is behind the terrain, and participates in ColorRestore.
 */
export function composeOrganicVista(scene:Phaser.Scene,level:LevelData,landmark:Phaser.GameObjects.Image):OrganicVista|undefined {
  const plan=organicVistaPlan(level);
  if(!plan||!landmark.texture||!landmark.width||!landmark.height)return;
  const key='w'+level.world+'_props',atlas=scene.textures.get(key);
  if(!scene.textures.exists(key))return;
  const layer=scene.add.container(0,0).setDepth(-5);
  try{
    const x=(plan.col+.5)*TILE,y=plan.row*TILE+8;
    const width=plan.span*TILE-32;
    const scale=Math.min(width/landmark.width,265/landmark.height);
    const hero=scene.add.image(x,y,landmark.texture.key,landmark.frame.name)
      .setOrigin(.5,1).setScale(scale).setTint(0xd8c2c8).setAlpha(.88);
    layer.add(hero);
    const frames=[F.w1Props.heartFlower,F.w1Props.berries,F.w1Props.mushrooms,F.w1Props.heartFlower];
    const placements=[[-.43,.42],[-.29,.30],[.31,.31],[.43,.40]];
    for(let i=0;i<frames.length;i++){
      const frame=String(frames[i]);if(!atlas.has(frame))continue;
      const [dx,s]=placements[i];
      const p=scene.add.image(x+dx*width,y+3,key,frame).setOrigin(.5,1).setScale(s)
        .setTint(0xc8b5c0).setAlpha(.75);
      p.setFlipX(i>=2);
      layer.add(p);
    }
    // Disable the old drifting landmark only after the replacement is ready.
    landmark.setVisible(false);
    return {layer,plan,objects:layer.length};
  }catch{
    layer.destroy();
    return undefined;
  }
}
