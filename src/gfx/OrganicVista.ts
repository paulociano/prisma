import type Phaser from 'phaser';
import { TILE } from '../config';
import { organicVistaPlan, type OrganicVistaPlan } from '../levels/ArtGeometry';
import type { LevelData } from '../levels/LevelBuilder';

export interface OrganicVista {layer:Phaser.GameObjects.Container;plan:OrganicVistaPlan;objects:number}
/** Keep one opaque, world-anchored landmark. The painted parallax already
 * contains the distant vegetation; do not duplicate it as transparent props. */
export function composeOrganicVista(scene:Phaser.Scene,level:LevelData,landmark:Phaser.GameObjects.Image):OrganicVista|undefined {
  const plan=organicVistaPlan(level);
  if(!plan||!landmark.texture||!landmark.width||!landmark.height)return;
  const layer=scene.add.container(0,0).setDepth(-5);
  try{
    const x=(plan.col+.5)*TILE,y=plan.row*TILE+8;
    const width=plan.span*TILE-32;
    const scale=Math.min(width/landmark.width,265/landmark.height);
    const hero=scene.add.image(x,y,landmark.texture.key,landmark.frame.name)
      .setOrigin(.5,1).setScale(scale).setTint(0xe9dce0).setAlpha(1).setData('organicLandmark',true);
    layer.add(hero);
    scene.data.set('organicMacroPlans',[]);
    landmark.setVisible(false);
    return {layer,plan,objects:layer.length};
  }catch{
    layer.destroy();
    return undefined;
  }
}
