import type Phaser from 'phaser';
import { rootSanctuaryPlan, type RootSanctuaryPlan } from '../levels/ArtGeometry';
import { T, type LevelData } from '../levels/LevelBuilder';
import { TILE } from '../config';
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
    // The terrain owns the foreground contact; reuse the same painting for a
    // soft root-coloured contact shadow, strictly below the walkable plane.
    // Insert above terrain fills but below its decorative and gameplay layers.
    const contact=scene.add.graphics();
    const floor=plan.groundRow*TILE;
    const left=plan.x+70, right=plan.x+330;
    for(let i=0;i<8;i++){
      contact.fillStyle(0x251c2a,.035);
      contact.fillEllipse((left+right)/2,floor+19, (right-left)+i*12, 12+i*3);
    }
    // The ellipse stays below the physical surface and inside the verified shelf.
    contact.setData('rootSanctuaryContact',true);
    world.addAt(contact,3);
    // Continue the painted trunk into the rock using a narrow, irregular
    // projection of its existing lower edge. Only occupied solid pixels can
    // receive paint; the walkable surface and the coffer opening stay intact.
    const skirt=document.createElement('canvas');
    skirt.width=plan.width;skirt.height=TILE;
    const sg=skirt.getContext('2d');
    if(sg){
      const seam=floor-plan.y;
      sg.drawImage(canvas,0,seam-54,plan.width,54,0,0,plan.width,TILE);
      const pixels=sg.getImageData(0,0,skirt.width,skirt.height);
      for(let x=0;x<skirt.width;x++){
        const c=Math.floor((plan.x+x)/TILE);
        const taper=22+12*Math.sin(x*.027)+7*Math.sin(x*.071+1.2);
        for(let y=0;y<skirt.height;y++){
          const solid=level.tiles[Math.floor((floor+y)/TILE)]?.[c]===T.Solid;
          const side=smooth((x-24)/45)*smooth((390-x)/90);
          const fade=smooth((taper-y)/20)*smooth(y/5);
          pixels.data[(y*skirt.width+x)*4+3]*=solid?side*fade:0;
        }
      }
      sg.putImageData(pixels,0,0);
      const skirtKey=key+'_roots';
      if(scene.textures.addCanvas(skirtKey,skirt)){
        const roots=scene.add.image(plan.x,floor,skirtKey).setOrigin(0).setTint(0xc9b2b9).setAlpha(.82);
        roots.setData('rootSanctuarySkirt',true);
        world.addAt(roots,4);
        scene.events.once('shutdown',()=>scene.textures.remove(skirtKey));
      }
    }
    scene.events.once('shutdown',()=>scene.textures.remove(key));
    return plan;
  }catch{
    if(scene.textures.exists(key))scene.textures.remove(key);
    return undefined;
  }
}
