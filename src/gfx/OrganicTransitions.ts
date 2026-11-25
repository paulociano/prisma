import type Phaser from 'phaser';
import { TILE } from '../config';
import { organicRampY, type OrganicRampPlan, type OrganicCornerPlan } from '../levels/ArtGeometry';

let serial=0;
function addTexture(scene:Phaser.Scene,into:Phaser.GameObjects.Container,canvas:HTMLCanvasElement,x:number,y:number):boolean{
  const key='organic_transition_'+(++serial);
  try{
    if(!scene.textures.addCanvas(key,canvas))return false;
    into.add(scene.add.image(x,y,key).setOrigin(0));
    scene.events.once('shutdown',()=>scene.textures.remove(key));
    return true;
  }catch{
    if(scene.textures.exists(key))scene.textures.remove(key);
    return false;
  }
}
/** Reuse the path painting without rotating its light direction.
 * Shear each vertical slice to the physical ramp, with a tight decorative margin.
 */
export function paintOrganicRamp(scene:Phaser.Scene,into:Phaser.GameObjects.Container,key:string,q:OrganicRampPlan):boolean{
  if(!scene.textures.exists(key))return false;
  const src=scene.textures.get(key).getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  if(src.width!==1024||src.height!==320)return false;
  const w=2*TILE,margin=24,h=TILE+margin;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const g=canvas.getContext('2d');if(!g)return false;
  try{
    const crop=(q.col*128)%769;
    g.save();
    g.transform(1,q.up?-.5:.5,0,1,0,margin+organicRampY(q.up,0)-48);
    g.drawImage(src,crop,0,256,320,0,0,w,160);
    g.restore();
    const pixels=g.getImageData(0,0,w,h);
    for(let x=0;x<w;x++){
      const contact=margin+organicRampY(q.up,x+.5);
      for(let y=0;y<h;y++){
        const a=Math.max(0,Math.min(1,(y-contact+margin)/7));
        pixels.data[(y*w+x)*4+3]*=a;
      }
    }
    g.putImageData(pixels,0,0);
    return addTexture(scene,into,canvas,q.col*TILE,q.row*TILE-margin);
  }catch{return false;}
}
/** Blend an existing painted root into the three solid cells of a corner.
 * The empty cell is explicitly clipped out; no false step is introduced.
 */
export function paintOrganicCorner(scene:Phaser.Scene,into:Phaser.GameObjects.Container,key:string,q:OrganicCornerPlan):boolean{
  if(!scene.textures.exists(key))return false;
  const atlas=scene.textures.get(key);
  if(!atlas.has('2'))return false;
  const f=atlas.get('2'),w=2*TILE;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=w;
  const g=canvas.getContext('2d');if(!g)return false;
  const left=q.side==='left';
  try{
    g.save();
    g.beginPath();g.rect(left?0:TILE,0,TILE,TILE);g.rect(0,TILE,w,TILE);g.clip();
    g.translate(TILE,TILE);g.rotate(left?.62:-.62);
    g.drawImage(f.source.image as CanvasImageSource,f.cutX,f.cutY,f.cutWidth,f.cutHeight,-86,-42,172,84);
    g.restore();
    g.globalCompositeOperation='destination-in';
    const fade=g.createRadialGradient(TILE,TILE,8,TILE,TILE,85);
    fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(.65,'rgba(0,0,0,.9)');fade.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=fade;g.fillRect(0,0,w,w);
    return addTexture(scene,into,canvas,(q.col-(left?1:0))*TILE,q.row*TILE);
  }catch{return false;}
}
