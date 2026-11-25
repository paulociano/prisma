import type Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { artChunks, terrainPlatePlan, type TerrainPlatePlan } from '../levels/ArtGeometry';

/** Only accepted plates replace the legacy presentation; physics still uses LevelData.
 * Runtime rejection leaves the previous organic renderer untouched. */
export function paintTerrainPlates(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container):Set<number>{
  const columns=new Set<number>();const accepted:string[]=[];const rejected:string[]=[];
  for(const ch of artChunks(level)){
    const key='w1_plate_'+level.id+'_'+ch.id;
    if(!scene.textures.exists(key))continue;
    const p=terrainPlatePlan(level,ch);
    if(!p?.replaceable){rejected.push(ch.id+':geometry');continue;}
    try{
      const source=scene.textures.get(key).getSourceImage() as CanvasImageSource & {width:number;height:number};
      if(source.width!==p.width||source.height!==p.height||!validAlpha(source,p,level)){
        rejected.push(ch.id+':alpha-or-size');continue;
      }
      into.add(scene.add.image(p.x,p.y,key).setOrigin(0).setData('terrainPlate',ch.id));
      for(let c=p.c0;c<p.c1;c++)columns.add(c);
      accepted.push(ch.id);
    }catch{rejected.push(ch.id+':render');}
  }
  scene.data.set('terrainPlates',accepted);scene.data.set('terrainPlateRejected',rejected);
  return columns;
}
function validAlpha(source:CanvasImageSource,p:TerrainPlatePlan,level:LevelData):boolean{
  const {width:w,height:h}=p;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const g=canvas.getContext('2d');if(!g)return false;
  g.drawImage(source,0,0);
  const art=g.getImageData(0,0,w,h).data;
  g.clearRect(0,0,w,h);g.fillStyle='#fff';
  for(const poly of p.polygons){
    g.beginPath();poly.forEach(([x,y],i)=>i?g.lineTo(x-p.x,y-p.y):g.moveTo(x-p.x,y-p.y));g.closePath();g.fill();
  }
  const mask=g.getImageData(0,0,w,h).data;
  const at=(x:number,y:number)=>x>=0&&x<w&&y>=0&&y<h&&mask[(y*w+x)*4+3]>0;
  const counts=new Map<number,[number,number]>();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4+3;
    const c=Math.floor((p.x+x)/TILE),r=Math.floor((p.y+y)/TILE);
    if(mask[i]>=250){
      const cell=r*level.cols+c,v=counts.get(cell)??[0,0];v[0]++;if(art[i]>=220)v[1]++;counts.set(cell,v);
    }
    if(art[i]<=24||mask[i]>0)continue;
    if(level.tiles[r]?.[c]===T.Spike||level.tiles[r]?.[c]===T.OneWay)return false;
    // Decorative allowance: 32 pixels above the contact, 10 on sides.
    let near=false;
    for(const dy of [0,8,16,24,32])for(const dx of [-10,0,10])if(at(x+dx,y+dy))near=true;
    if(!near)return false;
  }
  return counts.size>0&&Array.from(counts.values()).every(([n,covered])=>covered/n>=.98);
}
