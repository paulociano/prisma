import type Phaser from 'phaser';
import { organicSculpturePilot } from '../world/OrganicPilot';
import { materialOf, registeredMaterialImages } from './MaterialPreview';
import { getSettings } from '../systems/Settings';
import { illuminatePatch, lightRect, type MaterialLight } from '../world/MaterialLighting';

type Image=Phaser.GameObjects.Image;
type Target={image:Image;texture:Phaser.Textures.CanvasTexture;map:NonNullable<ReturnType<typeof materialOf>>};
type Saved={target:Target;x:number;y:number;data:ImageData};
const MAX_PIXELS=160000,MAX_TARGETS=4,MAX_LIGHTS=4;
export function materialLightsEnabled(level:string){
  const p=new URLSearchParams(window.location.search);
  return organicSculpturePilot(level,p)&&getSettings().quality!=='low'&&p.get('materials')!=='0'&&p.get('lighting')!=='0';
}
export class LocalMaterialLights{
  private targets:Target[]=[];
  private saved:Saved[]=[];
  private elapsed=1;
  private stopped=false;
  private debug=new URLSearchParams(window.location.search).has('debug');
  private cacheEnabled=new URLSearchParams(window.location.search).get('lightcache')!=='0';
  private previousSignature:string|undefined;
  private samples={updates:0,totalMs:0,maxMs:0,pixels:0,uploadBytes:0,skipped:0};
  constructor(private scene:Phaser.Scene,world:Phaser.GameObjects.Container){
    // Use the explicit scene registration rather than inferring material
    // ownership from nested display lists (moving views may live outside world).
    for(const image of registeredMaterialImages(scene)){
      const map=materialOf(image),texture=image.texture as Phaser.Textures.CanvasTexture;
      if(image.active&&map&&typeof texture.getContext==='function'&&typeof texture.refresh==='function')this.targets.push({image,texture,map});
    }
    void world;
    scene.data.set('materialLighting',{targets:this.targets.length,lights:0,changed:0,pixels:0,uploads:0});
    scene.events.once('shutdown',()=>{this.stopped=true;this.saved=[];this.targets=[];});
  }
  update(dt:number,lights:readonly MaterialLight[],focusX:number,focusY:number,force=false){
    if(this.stopped)return;
    this.elapsed+=dt;
    if(!force&&this.elapsed<.1)return;
    this.elapsed=0;
    const started=this.debug?performance.now():0;
    const sources=lights.filter(l=>Math.hypot(l.x-focusX,l.y-focusY)<520&&l.radius>0&&l.radius<=180).slice().sort((a,b)=>Math.hypot(a.x-focusX,a.y-focusY)-Math.hypot(b.x-focusX,b.y-focusY)).slice(0,MAX_LIGHTS);
    // Exact reuse only: all effective lights, target transforms, active and
    // visible state must match. No quantization of moving lights or colors.
    const signature=this.cacheEnabled?JSON.stringify([
      sources.map(l=>[l.x,l.y,l.radius,l.intensity,...l.color]),
      this.targets.map(({image:o})=>[o.active,o.visible,o.x,o.y,o.width,o.height,o.originX,o.originY,o.scaleX,o.scaleY,o.texture.key])
    ]):undefined;
    if(signature!==undefined&&signature===this.previousSignature){
      if(this.debug){this.samples.skipped++;this.scene.data.set('materialLightingPerf',{...this.samples});}
      return;
    }
    this.previousSignature=signature;
    const dirty=new Set<Target>();
    // Reverse order matters when two light patches overlap.
    for(let i=this.saved.length-1;i>=0;i--){const p=this.saved[i];if(p.target.image.active){p.target.texture.getContext().putImageData(p.data,p.x,p.y);dirty.add(p.target);}}
    this.saved=[];
    let pixels=0,changed=0,applied=0;

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
    let uploadBytes=0;
    for(const t of dirty){t.texture.refresh();uploadBytes+=t.image.width*t.image.height*4;}
    if(this.debug){
      const ms=performance.now()-started,s=this.samples;
      s.updates++;s.totalMs+=ms;s.maxMs=Math.max(s.maxMs,ms);s.pixels+=pixels;s.uploadBytes+=uploadBytes;
      this.scene.data.set('materialLightingPerf',{...s});
    }
    this.scene.data.set('materialLighting',{targets:this.targets.length,lights:applied,changed,pixels,uploads:dirty.size});
  }
}
