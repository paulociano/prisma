import type Phaser from 'phaser';
import { materialOf } from './MaterialPreview';
import { getSettings } from '../systems/Settings';
import { illuminatePatch, lightRect, type MaterialLight } from '../world/MaterialLighting';

type Image=Phaser.GameObjects.Image;
type Target={image:Image;texture:Phaser.Textures.CanvasTexture;map:NonNullable<ReturnType<typeof materialOf>>};
type Saved={target:Target;x:number;y:number;data:ImageData};
const MAX_PIXELS=160000,MAX_TARGETS=4,MAX_LIGHTS=4;
export function materialLightsEnabled(level:string){
  return level==='1-1'&&getSettings().quality!=='low'&&new URLSearchParams(window.location.search).get('lighting')!=='0';
}
export class LocalMaterialLights{
  private targets:Target[]=[];
  private saved:Saved[]=[];
  private elapsed=1;
  private stopped=false;
  constructor(private scene:Phaser.Scene,world:Phaser.GameObjects.Container){
    const visit=(obj:Phaser.GameObjects.GameObject)=>{
      if('list' in obj&&Array.isArray(obj.list)){for(const o of obj.list)visit(o);return;}
      if(!obj.getData('pictorialMaterial'))return;
      const image=obj as Image,map=materialOf(image),texture=image.texture as Phaser.Textures.CanvasTexture;
      if(map&&typeof texture.getContext==='function'&&typeof texture.refresh==='function')this.targets.push({image,texture,map});
    };
    visit(world);
    scene.data.set('materialLighting',{targets:this.targets.length,lights:0,changed:0,pixels:0,uploads:0});
    scene.events.once('shutdown',()=>{this.stopped=true;this.saved=[];this.targets=[];});
  }
  update(dt:number,lights:readonly MaterialLight[],focusX:number,focusY:number,force=false){
    if(this.stopped)return;
    this.elapsed+=dt;
    if(!force&&this.elapsed<.1)return;
    this.elapsed=0;
    const dirty=new Set<Target>();
    // Reverse order matters when two light patches overlap.
    for(let i=this.saved.length-1;i>=0;i--){const p=this.saved[i];if(p.target.image.active){p.target.texture.getContext().putImageData(p.data,p.x,p.y);dirty.add(p.target);}}
    this.saved=[];
    let pixels=0,changed=0,applied=0;
    const sources=lights.filter(l=>Math.hypot(l.x-focusX,l.y-focusY)<520&&l.radius>0&&l.radius<=180).slice().sort((a,b)=>Math.hypot(a.x-focusX,a.y-focusY)-Math.hypot(b.x-focusX,b.y-focusY)).slice(0,MAX_LIGHTS);
    const active=new Set<Target>();
    for(const light of sources){
      let used=false;
      for(const t of this.targets){
        const o=t.image;
        if(!o.active||!o.visible||o.scaleX!==1||o.scaleY!==1)continue;
        const w=o.width,h=o.height,left=o.x-w*o.originX,top=o.y-h*o.originY;
        const rect=lightRect(light,left,top,w,h);
        if(!rect||pixels+rect.w*rect.h>MAX_PIXELS||(!active.has(t)&&active.size>=MAX_TARGETS))continue;
        const ctx=t.texture.getContext();
        const original=ctx.getImageData(rect.x,rect.y,rect.w,rect.h);
        const patch=ctx.createImageData(rect.w,rect.h);patch.data.set(original.data);
        pixels+=rect.w*rect.h;
        const n=illuminatePatch(patch.data,rect,left,top,w,h,t.map,light);
        if(!n)continue;
        ctx.putImageData(patch,rect.x,rect.y);
        this.saved.push({target:t,x:rect.x,y:rect.y,data:original});
        active.add(t);dirty.add(t);changed+=n;used=true;
      }
      if(used)applied++;
    }
    for(const t of dirty)t.texture.refresh();
    this.scene.data.set('materialLighting',{targets:this.targets.length,lights:applied,changed,pixels,uploads:dirty.size});
  }
}
