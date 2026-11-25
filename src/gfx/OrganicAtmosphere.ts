import type Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';

const SUN='organic_atmosphere_sun_v1', MIST='organic_atmosphere_mist_v1';
const W=640,H=360;
/** Shared, immutable procedural textures (about 1.76 MiB RGBA in total).
 * No shader or per-frame texture writes. All art stays inside ColorRestore's
 * background container, behind the world and its interactable entities.
 */
function ensure(scene:Phaser.Scene,key:string,draw:(g:CanvasRenderingContext2D)=>void):boolean{
  if(scene.textures.exists(key))return true;
  const tex=scene.textures.createCanvas(key,W,H);
  if(!tex)return false;
  try{draw(tex.getContext());tex.refresh();return true;}
  catch{scene.textures.remove(key);return false;}
}
function sun(g:CanvasRenderingContext2D){
  // Soft warm airlight from above; avoid a second painted sun or bright beams.
  const glow=g.createRadialGradient(465,50,8,465,50,310);
  glow.addColorStop(0,'rgba(255,224,170,0.22)');
  glow.addColorStop(.38,'rgba(255,207,157,0.12)');
  glow.addColorStop(1,'rgba(255,207,157,0)');
  g.fillStyle=glow;g.fillRect(0,0,W,H);
  const wash=g.createLinearGradient(0,0,0,H);
  wash.addColorStop(0,'rgba(239,185,154,0.06)');
  wash.addColorStop(.75,'rgba(239,185,154,0)');
  g.fillStyle=wash;g.fillRect(0,0,W,H);
}
function mist(g:CanvasRenderingContext2D){
  // Broad low-contrast bands separate the distant mountains from nearby trees.
  // Nothing is drawn over gameplay geometry.
  const fog=g.createLinearGradient(0,0,0,H);
  fog.addColorStop(0,'rgba(206,167,193,0)');
  fog.addColorStop(.28,'rgba(206,167,193,0)');
  fog.addColorStop(.58,'rgba(230,190,195,0.16)');
  fog.addColorStop(.83,'rgba(213,176,199,0.10)');
  fog.addColorStop(1,'rgba(213,176,199,0)');
  g.fillStyle=fog;g.fillRect(0,0,W,H);
}
export function addOrganicAtmosphere(scene:Phaser.Scene,background:Phaser.GameObjects.Container,
  mid:Phaser.GameObjects.GameObject,near:Phaser.GameObjects.GameObject,quality:'medium'|'high'):number{
  if(!background.list.includes(mid)||!background.list.includes(near))return 0;
  let count=0;
  if(ensure(scene,SUN,sun)){
    const light=scene.add.image(0,0,SUN).setOrigin(0).setDisplaySize(GAME_W,GAME_H).setAlpha(quality==='high'?1:.65);
    background.addAt(light,background.getIndex(mid));count++;
  }
  if(ensure(scene,MIST,mist)){
    const air=scene.add.image(0,0,MIST).setOrigin(0).setDisplaySize(GAME_W,GAME_H).setAlpha(quality==='high'?1:.65);
    background.addAt(air,background.getIndex(near));count++;
  }
  return count;
}
