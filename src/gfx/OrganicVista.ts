import type Phaser from 'phaser';
import { TILE } from '../config';
import { F } from './art';
import { organicVistaPlan, organicMacroPlans, type OrganicVistaPlan } from '../levels/ArtGeometry';
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
    // A larger, recessive foliage silhouette supplies a distant
    // silhouette. It stays in the same world-anchored composition and never
    // participates in collision or covers the foreground.
    const distantFrame=String(F.w1Props.heartFlower);
    if(atlas.has(distantFrame)){
      const distant=scene.add.image(x-width*.34,y-18,key,distantFrame)
        .setOrigin(.5,1).setScale(.95).setTint(0x99899f).setAlpha(.32);
      layer.add(distant);
    }
    layer.add(hero);
    // Regional compositions share the painted atlas, but differ in rhythm,
    // species emphasis and silhouette. Keep all props behind gameplay.
    const profiles:Record<string,{frames:number[];placements:number[][];tint:number}>={
      '1-1':{frames:[F.w1Props.heartFlower,F.w1Props.berries,F.w1Props.heartFlower,F.w1Props.mushrooms],placements:[[-.43,.40],[-.28,.27],[.29,.38],[.44,.24]],tint:0xd9c5b5},
      '1-2':{frames:[F.w1Props.mushrooms,F.w1Props.mushrooms,F.w1Props.berries,F.w1Props.mushrooms],placements:[[-.44,.29],[-.33,.44],[.26,.25],[.43,.36]],tint:0xbfc3d1},
      '1-3':{frames:[F.w1Props.berries,F.w1Props.heartFlower,F.w1Props.mushrooms,F.w1Props.berries],placements:[[-.43,.38],[-.23,.25],[.34,.35],[.45,.28]],tint:0xcdb1bf}
    };
    const profile=profiles[level.id]??profiles['1-1'];
    const {frames,placements}=profile;
    for(let i=0;i<frames.length;i++){
      const frame=String(frames[i]);if(!atlas.has(frame))continue;
      const [dx,s]=placements[i];
      const p=scene.add.image(x+dx*width,y+3,key,frame).setOrigin(.5,1).setScale(s)
        .setTint(profile.tint).setAlpha(.75);
      p.setFlipX(i>=2);
      layer.add(p);
    }
    // Two additional ground-anchored environmental scenes, composed as
    // asymmetric groups rather than a repeated strip. The original landmark
    // stays unique. All objects are part of the same ColorRestore layer.
    const macros=organicMacroPlans(level);
    for(const [index,q] of macros.entries()){
      const cx=(q.col+.5)*TILE,base=q.row*TILE+5,span=q.span*TILE;
      const recipe=index===0
        ? [{f:F.w1Props.arch,dx:-.16,w:.62,h:230,a:.43},{f:F.w1Props.heartFlower,dx:.34,w:.31,h:190,a:.52},{f:F.w1Props.berries,dx:-.39,w:.22,h:95,a:.65}]
        : [{f:F.w1Props.log,dx:.04,w:.72,h:130,a:.52},{f:F.w1Props.mushrooms,dx:-.32,w:.34,h:210,a:.46},{f:F.w1Props.heartFlower,dx:.36,w:.24,h:145,a:.58}];
      for(const item of recipe){
        const frame=String(item.f);if(!atlas.has(frame))continue;
        const f=atlas.get(frame);
        const s=Math.min(span*item.w/f.width,item.h/f.height);
        const obj=scene.add.image(cx+span*item.dx,base,key,frame).setOrigin(.5,1)
          .setScale(s).setTint(profile.tint).setAlpha(item.a);
        obj.setData('organicMacro',index);
        layer.add(obj);
      }
    }
    scene.data.set('organicMacroPlans',macros);
    // Disable the old drifting landmark only after the replacement is ready.
    landmark.setVisible(false);
    return {layer,plan,objects:layer.length};
  }catch{
    layer.destroy();
    return undefined;
  }
}
