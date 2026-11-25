import type Phaser from 'phaser';
import { TILE } from '../config';
import { F } from './art';

let serial=0;
/** Foliage edge blended into baked rock. Contact plane stays unchanged. */
export function buildOrganicSurface(scene:Phaser.Scene,into:Phaser.GameObjects.Container,
  strip:string,tiles:string,c0:number,c1:number,y:number,sink:number,openL:boolean,openR:boolean):boolean {
  const f=scene.textures.getFrame(tiles,String(F.w1Tiles.top));
  const src=scene.textures.get(strip).getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  if(!f||!src.width||!src.height)return false;
  const pivot=(f.customPivot?f.pivotY:0)*f.height/2;
  const top=y-sink-pivot, h=src.height/2;
  const width=(c1-c0+1)*TILE, start=c0*TILE;
  const keep=Math.min(h,Math.max(40,pivot+sink+30));
  const made:{key:string;image:Phaser.GameObjects.Image}[]=[];
  try{
    for(let off=0;off<width;off+=8*TILE){
      const w=Math.min(8*TILE,width-off),x=start+off;
      const canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=Math.ceil(keep*2);
      const g=canvas.getContext('2d');if(!g)throw Error('canvas');
      for(let u=-((x*2)%src.width);u<canvas.width;u+=src.width)g.drawImage(src,u,0);
      const data=g.getImageData(0,0,canvas.width,canvas.height);
      for(let px=0;px<canvas.width;px++){
        const gx=x+px/2;
        const wave=5*Math.sin(gx*.043)+3*Math.sin(gx*.093+1.3);
        const fadeEnd=Math.min(keep-1,pivot+sink+30+wave);
        const fadeStart=Math.min(fadeEnd-9,pivot+sink+12+wave);
        const edge=Math.min(openL?gx-start:1000,openR?start+width-gx:1000);
        for(let py=0;py<canvas.height;py++){
          const yy=py/2;
          let a=Math.max(0,Math.min(1,(fadeEnd-yy)/(fadeEnd-fadeStart)));
          a=a*a*(3-2*a);
          if(edge<10&&yy>pivot+sink+12)a*=.5+.5*Math.max(0,edge/10);
          data.data[(py*canvas.width+px)*4+3]*=a;
        }
      }
      g.putImageData(data,0,0);
      const key='organic_surface_'+(++serial);
      if(!scene.textures.addCanvas(key,canvas))throw Error('texture');
      const image=scene.add.image(x,top,key).setOrigin(0).setScale(.5);
      into.add(image);made.push({key,image});
    }
    scene.events.once('shutdown',()=>{for(const o of made)scene.textures.remove(o.key);});
    return true;
  }catch{
    for(const o of made){o.image.destroy();scene.textures.remove(o.key);}
    return false;
  }
}
