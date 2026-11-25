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
  // Optional authored asset already checked by the build pipeline. No collision changes.
  const authored='w1_organic_coffer';
  if(scene.textures.exists(authored)){
    const image=scene.add.image(plan.col*TILE-pad,plan.row*TILE-pad,authored).setOrigin(0).setDisplaySize(w,h);
    into.add(image);scene.data.set('organicCofferSource','authored');return true;
  }
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
    // Paint rock faces from existing atlas, at irregular scales; clip to the one continuous mass.
    const decal='w1_decals';
    const stamp=(key:string,frame:number,x:number,y:number,width:number,height:number,angle=0,alpha=1)=>{
      if(!scene.textures.exists(key)||!scene.textures.get(key).has(String(frame)))return;
      const f=scene.textures.getFrame(key,String(frame));
      g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha=alpha;
      g.drawImage(f.source.image as CanvasImageSource,f.cutX,f.cutY,f.cutWidth,f.cutHeight,-width/2,-height/2,width,height);g.restore();
    };
    // Large painted boulders and uneven rock clusters break the horizontal soil bands.
    for(const [x,y,s,a] of [[37,33,94,-.18],[110,27,105,.12],[202,27,112,-.16],[30,99,85,.31],[22,159,94,-.23],[31,219,112,.2],[108,225,119,-.12],[199,222,122,.14],[285,217,94,-.24]])
      stamp(decal,0,x,y,s,s*.77,a,.88);
    for(const [x,y,s,a] of [[75,44,87,.3],[169,40,100,-.2],[40,136,72,.5],[65,246,95,-.4],[158,246,95,.1],[253,245,105,-.3]])
      stamp(decal,1,x,y,s,s*.6,a,.85);
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
    // Real painted root decals instead of flat, outlined vector strokes.
    // Their rotation follows the outer rock face; clipping protects the opening.
    for(const [x,y,w,h,a] of [[27,75,112,48,1.36],[21,157,112,46,1.68],[45,225,115,56,.72],[123,245,125,55,-.12],[238,237,132,54,-.22],[110,41,120,42,-.08]])
      stamp(decal,2,x,y,w,h,a,.96);
    // Small vegetation clusters sit in cracks, not in a repeated border.
    for(const [x,y,s,a] of [[8,19,37,-.4],[56,12,42,.1],[176,9,39,-.2],[244,12,36,.1],[16,107,31,.7],[14,196,38,-.7],[89,188,40,-.1],[214,188,42,.2],[306,187,38,-.3]])
      stamp(decal,3,x,y,s,s*.72,a,.9);
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
    scene.data.set('organicCofferSource','painted-atlas');
    return true;
  }catch{
    if(scene.textures.exists(key))scene.textures.remove(key);
    return false;
  }
}
