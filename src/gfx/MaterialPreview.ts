import type Phaser from 'phaser';
import type { LevelData } from '../levels/LevelBuilder';
import { getSettings } from '../systems/Settings';
import { deriveRelief, shadeRelief, gradePigments, type ReliefMap } from '../world/PictorialMaterial';

interface MaterialStats {count:number;pixels:number;mapBytes:number;changed:number;failures:number;budgetSkips:number;graded:number}
interface MaterialPreview {canvas:HTMLCanvasElement;map:ReliefMap;changed:number;graded:number}
const materials=new WeakMap<Phaser.GameObjects.Image,ReliefMap>();
const sceneMaterials=new WeakMap<Phaser.Scene,Set<Phaser.GameObjects.Image>>();
export const registeredMaterialImages=(scene:Phaser.Scene)=>Array.from(sceneMaterials.get(scene)??[]);
const LIMIT=10_000_000;
export const materialOf=(image:Phaser.GameObjects.Image)=>materials.get(image);
export function materialEnabled(level:LevelData){
  const p=new URLSearchParams(window.location.search);
  return level.id==='1-1'&&getSettings().quality!=='low'&&p.get('materials')!=='0'&&p.get('organic')!=='0'&&p.get('plates')!=='0';
}
function stats(scene:Phaser.Scene):MaterialStats{
  let s=scene.data.get('pictorialMaterials') as MaterialStats|undefined;
  if(!s){s={count:0,pixels:0,mapBytes:0,changed:0,failures:0,budgetSkips:0,graded:0};scene.data.set('pictorialMaterials',s);}
  return s;
}
/** Generate maps from the final registered art, after warp and masking.
 * At most half-resolution material data; no per-frame readback or lighting
 * shader yet. The original texture is retained by the asset manager. */
export function bakeMaterial(scene:Phaser.Scene,level:LevelData,source:CanvasImageSource & {width:number;height:number},edgeFade=0,edgePad=0,anchor?:readonly [number,number]):MaterialPreview|undefined{
  if(!materialEnabled(level))return;
  const s=stats(scene),w=source.width,h=source.height;
  if(s.pixels+w*h>LIMIT){s.budgetSkips++;return;}
  try{
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const g=canvas.getContext('2d');if(!g)throw Error('material canvas unavailable');
    g.drawImage(source,0,0);const original=g.getImageData(0,0,w,h);
    const small=document.createElement('canvas');small.width=Math.ceil(w/2);small.height=Math.ceil(h/2);
    const sg=small.getContext('2d');if(!sg)throw Error('normal canvas unavailable');
    sg.drawImage(source,0,0,small.width,small.height);
    const map=deriveRelief(sg.getImageData(0,0,small.width,small.height).data,small.width,small.height);
    const shaded=shadeRelief(original.data,w,h,map,getSettings().quality==='high'?.7:.45,edgeFade,edgePad,w-edgePad);
    const graded=anchor&&new URLSearchParams(window.location.search).get('pigments')!=='0'?gradePigments(shaded,w,h,...anchor):0;
    let changed=0;for(let i=0;i<shaded.length;i+=4)if(shaded[i]!==original.data[i]||shaded[i+1]!==original.data[i+1]||shaded[i+2]!==original.data[i+2])changed++;
    original.data.set(shaded);g.putImageData(original,0,0);
    return {canvas,map,changed,graded};
  }catch{s.failures++;return;}
}
export function registerMaterial(scene:Phaser.Scene,image:Phaser.GameObjects.Image,p:MaterialPreview){
  const s=stats(scene);materials.set(image,p.map);
  let images=sceneMaterials.get(scene);
  if(!images){images=new Set();sceneMaterials.set(scene,images);scene.events.once('shutdown',()=>sceneMaterials.delete(scene));}
  images.add(image);
  image.once('destroy',()=>images?.delete(image));
  image.setData('pictorialMaterial',{width:p.map.width,height:p.map.height,changed:p.changed,encoding:'normal-rgb/occlusion-a'});
  s.count++;s.pixels+=p.canvas.width*p.canvas.height;s.mapBytes+=p.map.normals.byteLength+p.map.elevation.byteLength;s.changed+=p.changed;s.graded+=p.graded;
  scene.events.once('shutdown',()=>materials.delete(image));
}
