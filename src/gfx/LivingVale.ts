import type Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { getSettings } from '../systems/Settings';
import { plantAngle, pollenPose } from '../world/EnvironmentalMotion';

type Plant={image:Phaser.GameObjects.Image;angle:number;x:number;y:number};
type Pollen={image:Phaser.GameObjects.Image;x:number;y:number;seed:number};
export function livingValeEnabled(level:string){
  const p=new URLSearchParams(window.location.search),s=getSettings();
  return level==='1-1'&&s.quality!=='low'&&!s.reduceMotion&&p.get('life')!=='0'&&p.get('organic')!=='0'&&p.get('plates')!=='0';
}
/** One bounded set of existing planted props plus world-anchored pollen.
 * No duplicates of plants, no bodies, no animation of structural roots. */
export class LivingVale{
  private plants:Plant[]=[];
  private pollen:Pollen[]=[];
  private layer:Phaser.GameObjects.Container;
  private time=0;
  private debug=new URLSearchParams(window.location.search).has('debug');
  constructor(private scene:Phaser.Scene,private level:LevelData,decor:Phaser.GameObjects.Container){
    this.layer=scene.add.container(0,0).setDepth(-3);
    const quality=getSettings().quality;
    const candidates=decor.list.filter(o=>o.getData('livingPlant')) as Phaser.GameObjects.Image[];
    this.plants=candidates.map(image=>({image,angle:image.angle,x:image.x,y:image.y}));
    const count=quality==='high'?36:18;
    if(scene.textures.exists('fx_glow')){
      const eligible=this.plants.filter(p=>level.tiles[Math.floor((p.y-32)/TILE)]?.[Math.floor(p.x/TILE)]===T.Empty);
      const step=Math.max(1,Math.ceil(eligible.length/count));
      for(let i=0;i<eligible.length&&this.pollen.length<count;i+=step){
        const p=eligible[i],seed=Math.round(p.x/TILE)*17+Math.round(p.y/TILE)*11;
        const image=scene.add.image(p.x,p.y-24,'fx_glow').setDisplaySize(5,5).setTint(0xffdfaa).setAlpha(0).setData('livingPollen',true);
        this.layer.add(image);this.pollen.push({image,x:p.x,y:p.y-24,seed});
      }
    }
    scene.data.set('livingVale',{plants:this.plants.length,pollen:this.pollen.length,depth:this.layer.depth});
    scene.events.once('shutdown',()=>{this.plants=[];this.pollen=[];});
  }
  update(dt:number,focusX:number,life:number){
    this.time+=Math.max(0,Math.min(.1,dt));
    const reduce=getSettings().reduceMotion;
    let moving=0,visible=0;
    for(const p of this.plants){
      if(!p.image.active)continue;
      const nearby=Math.abs(p.x-focusX)<1050;
      p.image.setAngle(!reduce&&nearby?plantAngle(p.x,this.time,life,p.angle):p.angle);
      if(nearby&&!reduce)moving++;
    }
    for(const p of this.pollen){
      const q=pollenPose(p.x,p.y,p.seed,this.time,life);
      const safe=this.level.tiles[Math.floor(q.y/TILE)]?.[Math.floor(q.x/TILE)]===T.Empty;
      const show=!reduce&&safe&&Math.abs(q.x-focusX)<1050;
      p.image.setVisible(show);
      if(show){p.image.setPosition(q.x,q.y).setAlpha(q.alpha);visible++;}
    }
    if(this.debug)this.scene.data.set('livingValeFrame',{time:this.time,moving,visible});
  }
}
