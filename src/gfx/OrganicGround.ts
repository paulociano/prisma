import type Phaser from 'phaser';
import { TILE } from '../config';

let serial=0;
const WIDTH=512, HEIGHT=160, CONTACT=48;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
/** Illustrated walkable ground, aligned to the existing physical contact.
 * Uses mirrored world-space sampling; only the face above/below the contact
 * is painted, and the depth mask is derived from contiguous solid cells.
 */
export function paintOrganicGround(scene:Phaser.Scene,into:Phaser.GameObjects.Container,
  key:string,c0:number,c1:number,y:number,rows:number,block:(c:number,r:number)=>boolean,surfaceOnly=false):boolean {
  if(!scene.textures.exists(key)||(!surfaceOnly&&c1-c0+1<3))return false;
  const src=scene.textures.get(key).getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  if(src.width!==1024||src.height!==320)return false;
  const width=(c1-c0+1)*TILE,start=c0*TILE,row=Math.floor(y/TILE);
  const depths:number[]=[];
  for(let c=c0;c<=c1;c++){
    let r=row;
    while(r<rows&&block(c,r))r++;
    depths.push((r-row)*TILE);
  }
  if(depths.some(d=>d<TILE))return false;
  const made:{key:string;image:Phaser.GameObjects.Image}[]=[];
  // All chunk boundaries share the same phase. The mirrored seam has equal pixels.
  try{
    for(let off=0;off<width;off+=WIDTH){
      const w=Math.min(WIDTH,width-off),gx=start+off;
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=HEIGHT;
      const g=canvas.getContext('2d');if(!g)throw Error('canvas unavailable');
      for(let i=Math.floor(gx/WIDTH);i*WIDTH<gx+w;i++){
        const x=i*WIDTH-gx;
        g.save();
        if(i%2){g.translate(x+WIDTH,0);g.scale(-1,1);g.drawImage(src,0,0,WIDTH,HEIGHT);}
        else g.drawImage(src,x,0,WIDTH,HEIGHT);
        g.restore();
      }
      const data=g.getImageData(0,0,w,HEIGHT);
      for(let x=0;x<w;x++){
        const offset=off+x,depth=depths[Math.min(depths.length-1,Math.floor(offset/TILE))];
        const fadeEnd=Math.min(surfaceOnly?52:HEIGHT-CONTACT-1,depth);
        const fadeStart=Math.max(14,fadeEnd-28);
        const edge=Math.min(offset,width-1-offset);
        for(let py=0;py<HEIGHT;py++){
          const dy=py-CONTACT;
          let a=clamp((fadeEnd-dy)/Math.max(1,fadeEnd-fadeStart));a=a*a*(3-2*a);
          if(dy>18)a*=1-(1-clamp(edge/16))*clamp((dy-18)/26)*.75;
          const idx=(py*w+x)*4;
          // Large-scale mineral and foliage variation, continuous in world
          // coordinates even across mirrored source and canvas boundaries.
          const wx=gx+x;
          const tone=Math.sin(wx*.0027+y*.0031)*.045+Math.sin(wx*.0071+1.4)*.025;
          const depthMix=clamp((dy+18)/70);
          data.data[idx]*=1+tone*(1+.35*depthMix);
          data.data[idx+1]*=1+tone*.72;
          data.data[idx+2]*=1-tone*.45;
          data.data[idx+3]*=a;
        }
      }
      g.putImageData(data,0,0);
      const k='organic_ground_'+(++serial);
      if(!scene.textures.addCanvas(k,canvas))throw Error('texture unavailable');
      const image=scene.add.image(gx,y-CONTACT,k).setOrigin(0);
      into.add(image);made.push({key:k,image});
    }
    scene.events.once('shutdown',()=>{for(const m of made)scene.textures.remove(m.key);});
    return true;
  }catch{
    for(const m of made){m.image.destroy();scene.textures.remove(m.key);}
    return false;
  }
}
