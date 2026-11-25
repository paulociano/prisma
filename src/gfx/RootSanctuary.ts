import type Phaser from 'phaser';
import { rootSanctuaryPlan, type RootSanctuaryPlan } from '../levels/ArtGeometry';
import type { LevelData } from '../levels/LevelBuilder';
let serial=0;
const KEY='w1_organic_sanctuary';
/** Exclusive scenery below gameplay art in the world container. The alpha
 * mask keeps the coffer chamber and entry visually clear, with a soft edge. */
export function composeRootSanctuary(scene:Phaser.Scene,world:Phaser.GameObjects.Container,level:LevelData):RootSanctuaryPlan|undefined{
  const plan=rootSanctuaryPlan(level);
  if(!plan||!scene.textures.exists(KEY))return;
  const src=scene.textures.get(KEY).getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  if(src.width!==1536||src.height!==1024)return;
  const canvas=document.createElement('canvas');canvas.width=plan.width;canvas.height=plan.height;
  const g=canvas.getContext('2d');if(!g)return;
  const key='organic_sanctuary_'+(++serial);
  try{
    g.drawImage(src,0,0,plan.width,plan.height);
    const p=g.getImageData(0,0,plan.width,plan.height);
    const a=plan.clear,x0=a.x-plan.x,y0=a.y-plan.y,x1=x0+a.width,y1=y0+a.height;
    const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
    for(let y=0;y<plan.height;y++)for(let x=0;x<plan.width;x++){
      const dx=Math.max(x0-x,0,x-x1),dy=Math.max(y0-y,0,y-y1);
      const opening=smooth(Math.hypot(dx,dy)/28);
      const edge=smooth(Math.min(x,plan.width-1-x)/26);
      p.data[(y*plan.width+x)*4+3]*=opening*edge;
    }
    g.putImageData(p,0,0);
    if(!scene.textures.addCanvas(key,canvas))return;
    const img=scene.add.image(plan.x,plan.y,key).setOrigin(0).setTint(0xc9b2b9).setAlpha(.78);
    img.setData('rootSanctuary',true);
    world.addAt(img,0);
    scene.events.once('shutdown',()=>scene.textures.remove(key));
    return plan;
  }catch{
    if(scene.textures.exists(key))scene.textures.remove(key);
    return undefined;
  }
}
