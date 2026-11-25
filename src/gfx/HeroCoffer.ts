import type Phaser from 'phaser';
import { TILE } from '../config';
import { F } from './art';

let serial=0;
/** Hero composition for the suspended coffer: 1 continuous silhouette, existing painted materials.
 * All coordinates relative to the 4x4/5-tile C-shape. Collision is never touched.
 * The inner opening stays clear; roots extend only on outer decorative margins.
 */
export function buildHeroCoffer(scene: Phaser.Scene, plan:{col:number;row:number}, material:string, tiles:string, into:Phaser.GameObjects.Container):boolean{
  const pad=48,w=5*TILE+pad*2,h=4*TILE+pad*2;
  const canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h*2;
  const g=canvas.getContext('2d');if(!g)return false;
  const key='organic_coffer_'+(++serial);
  try{
    const tex=scene.textures.get(material).getSourceImage() as HTMLImageElement|HTMLCanvasElement;
    if(!tex.width||!tex.height)return false;
    g.scale(2,2);g.translate(pad,pad);
    const form=new Path2D();
    // Walkable contact planes at y=0 and y=192; top art rises ~14 px as in Terrain.
    form.moveTo(-9,-12);
    form.bezierCurveTo(38,-20,70,-10,105,-14);
    form.bezierCurveTo(157,-18,207,-15,252,-12);
    form.bezierCurveTo(267,-11,274,8,263,31);
    form.bezierCurveTo(259,47,251,60,256,64);
    form.bezierCurveTo(212,73,170,63,138,65);
    form.bezierCurveTo(109,65,81,67,64,64);
    form.lineTo(64,180);
    form.bezierCurveTo(116,174,145,183,184,179);
    form.bezierCurveTo(226,175,273,185,318,179);
    form.bezierCurveTo(332,186,332,215,318,239);
    form.bezierCurveTo(306,253,280,256,250,259);
    form.bezierCurveTo(194,267,131,260,91,273);
    form.bezierCurveTo(44,280,-6,273,-16,248);
    form.bezierCurveTo(-30,213,-18,190,-21,150);
    form.bezierCurveTo(-23,109,-9,87,-24,48);
    form.bezierCurveTo(-34,13,-26,-4,-9,-12);form.closePath();
    g.save();g.clip(form);
    // Paint a broad material face, not 64px repetitions.
    g.drawImage(tex,0,0,tex.width,tex.height,-48,-48,w,h);
    const light=g.createLinearGradient(-20,0,315,245);
    light.addColorStop(0,'rgba(44,20,35,.38)');light.addColorStop(.38,'rgba(228,168,105,.12)');light.addColorStop(.72,'rgba(255,212,155,.16)');light.addColorStop(1,'rgba(35,16,30,.36)');
    g.fillStyle=light;g.fillRect(-48,-48,w,h);
    // Broad contact shadows follow the cave rim, not rectangular tiles.
    g.lineWidth=17;g.strokeStyle='rgba(47,23,29,.35)';g.stroke(form);
    const stone=scene.textures.getFrame(tiles,String(F.w1Tiles.top));
    if(stone){
      const src=stone.source.image as CanvasImageSource;
      const pivot=stone.customPivot?stone.pivotY*stone.cutHeight:0;
      const crop=Math.min(stone.cutHeight,Math.max(24,pivot+30));
      // Existing crimson foliage with a shallow crop: avoid reintroducing masonry blocks.
      for(const [x0,x1,y] of [[-12,260,-14],[64,326,178]]){
        for(let x=x0;x<x1;x+=55){
          const width=Math.min(65,x1-x);
          g.drawImage(src,stone.cutX,stone.cutY,stone.cutWidth,crop,x,y-pivot*.5+Math.sin(x*.08)*2,width,crop*.5);
        }
      }
    }
    // Sunlit timber roots winding over the existing geological texture.
    const root=(points:number[],size:number)=>{
      const p=new Path2D();p.moveTo(points[0],points[1]);
      for(let i=2;i+5<points.length;i+=6)p.bezierCurveTo(points[i],points[i+1],points[i+2],points[i+3],points[i+4],points[i+5]);
      g.lineCap='round';g.lineJoin='round';
      g.lineWidth=size+4;g.strokeStyle='rgba(40,18,22,.55)';g.stroke(p);
      const wood=g.createLinearGradient(-20,0,320,280);wood.addColorStop(0,'#8b5b43');wood.addColorStop(.32,'#b0825a');wood.addColorStop(.6,'#77503d');wood.addColorStop(1,'#a2754e');
      g.lineWidth=size;g.strokeStyle=wood;g.stroke(p);
      g.save();g.translate(-1.5,-2);g.lineWidth=Math.max(1,size*.16);g.strokeStyle='rgba(241,190,126,.48)';g.stroke(p);g.restore();
    };
    root([12,8,-3,48,35,79,20,117,2,158,8,209,50,247,94,277,165,226,219,246,254,258,282,247,307,236],18);
    root([36,16,58,38,43,81,39,108,33,140,48,164,34,196,27,228,64,248,99,258],11);
    root([45,211,84,196,114,223,150,218,185,213,219,238,258,218],9);
    root([25,49,79,27,124,40,168,28,200,20,228,36,251,31],8);
    g.restore();
    // Delicate hanging roots stay outside the traversable inner chamber.
    const tendril=(x:number,y:number,len:number,phase:number)=>{
      const p=new Path2D();p.moveTo(x,y);p.bezierCurveTo(x-9,y+len*.3,x+12*Math.sin(phase),y+len*.75,x+5,y+len);
      g.lineCap='round';g.lineWidth=4;g.strokeStyle='#54352f';g.stroke(p);g.lineWidth=1.2;g.strokeStyle='#b58762';g.stroke(p);
    };
    for(let i=0;i<8;i++)tendril(20+i*36,255+Math.sin(i*2)*5,13+(i*17%23),i);
    if(!scene.textures.addCanvas(key,canvas))return false;
    const image=scene.add.image(plan.col*TILE-pad,plan.row*TILE-pad,key).setOrigin(0).setScale(.5);
    into.add(image);
    scene.events.once('shutdown',()=>scene.textures.remove(key));
    return true;
  }catch{
    if(scene.textures.exists(key))scene.textures.remove(key);
    return false;
  }
}
