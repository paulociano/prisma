import { organicSculpturePilot } from '../world/OrganicPilot';
import { lanternAnnexPlan } from '../world/LanternAnnex';
import { buildLanternAnnex } from './LanternAnnex';
import type Phaser from 'phaser';
import { TILE } from '../config';
import { planVisualGeometry } from '../world/VisualGeometry';
import { planOrganicContours } from '../world/OrganicContours';
import { rasterCurvedPlate } from './CurvedPlate';
import { bakeMaterial, registerMaterial } from './MaterialPreview';
import { T, type LevelData } from '../levels/LevelBuilder';
import { terrainPlateGroups, terrainSeamCompatible, plateIslandRuns, type TerrainPlatePlan } from '../levels/ArtGeometry';

let finishSerial=0;

/** Only accepted plates replace the legacy presentation; physics still uses LevelData.
 * Runtime rejection leaves the previous organic renderer untouched. */
export function paintTerrainPlates(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container):Set<number>{
  const columns=new Set<number>();const accepted:string[]=[];const rejected:string[]=[];
  const islandCells=new Set<number>();
  const annexCells=new Set<number>();
  scene.data.set('lanternAnnex',null);
  scene.data.set('lanternAnnexCells',annexCells);
  const params=new URLSearchParams(window.location.search);
  const pilot=organicSculpturePilot(level.id,params);
  const curved=pilot&&params.get('contours')!=='0';
  const sculpt=curved&&new URLSearchParams(window.location.search).get('sculpt')!=='0';
  const contourStats={enabled:curved,sculpt,plates:0,pixels:0,recessed:0,curves:0,failures:0};
  const islandTexture=scene.textures.exists('w1_organic_island')?scene.textures.get('w1_organic_island').getSourceImage():undefined;
  const canReplace=!!islandTexture&&islandTexture.width===448&&islandTexture.height===240;
  for(const group of terrainPlateGroups(level)){
    const entries=group.map(p=>({p,key:'w1_plate_'+level.id+'_'+p.id}));
    const present=entries.filter(e=>scene.textures.exists(e.key));
    if(!present.length)continue;
    const reject=(reason:string)=>present.forEach(e=>rejected.push(e.p.id+':'+reason));
    if(group.some(p=>p.protectedArea)){reject('geometry');continue;}
    if(present.length!==entries.length){reject('missing-neighbor');continue;}
    const added:Phaser.GameObjects.Image[]=[];const generated:string[]=[];
    try{
      const sources=entries.map(e=>scene.textures.get(e.key).getSourceImage() as CanvasImageSource & {width:number;height:number});
      if(entries.some(({p},i)=>sources[i].width!==p.width||sources[i].height!==p.height||!validAlpha(sources[i],p,level))){
        reject('alpha-or-size');continue;
      }
      if(entries.some(({p},i)=>i>0&&!terrainSeamCompatible(readEdge(sources[i-1],entries[i-1].p,true),readEdge(sources[i],p,false)))){
        reject('seam');continue;
      }
      const groupCols=new Set<number>();
      for(const {p} of entries)for(let c=p.c0;c<p.c1;c++)groupCols.add(c);
      const wide=pilot&&params.get('sculpt')!=='0'&&params.get('platforms')!=='0';
      const islands=canReplace?plateIslandRuns(level,groupCols,wide?8:4):[];
      const cutCells=new Set<number>();
      for(const q of islands)for(let c=q.col;c<q.col+q.length;c++)cutCells.add(q.row*level.cols+c);
      const plan=pilot&&level.id==='1-2'&&params.get('annex')!=='0'?lanternAnnexPlan(level):undefined;
      const annex=plan&&Array.from({length:14},(_,i)=>groupCols.has(plan.col+i)).every(Boolean)?buildLanternAnnex(scene,level,plan,entries,sources):undefined;
      if(annex){added.push(annex.view);generated.push(annex.key);}
      const excluded=new Set([...cutCells,...(annex&&plan?plan.cells:[])]);
      const curves=curved?planOrganicContours(planVisualGeometry(level,groupCols,excluded)):[];
      let groupPixels=0,groupPlates=0,groupRecessed=0;
      for(const {p,key} of entries){
        const cuts=islands.filter(q=>q.col<p.c1&&q.col+q.length>p.c0);
        let renderKey=key,offset=0;
        let source=scene.textures.get(key).getSourceImage() as CanvasImageSource;
        const annexCut=!!annex&&!!plan&&p.x<plan.x+plan.width&&p.x+p.width>plan.x;
        if(cuts.length||annexCut){
          const canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;
          const g=canvas.getContext('2d');if(!g)throw Error('island canvas unavailable');
          g.drawImage(scene.textures.get(key).getSourceImage() as CanvasImageSource,0,0);
          for(const q of cuts)g.clearRect(q.col*TILE-p.x,q.row*TILE-p.y,q.length*TILE,TILE);
          if(annexCut&&plan)g.clearRect(plan.x-p.x,plan.y-p.y,plan.width,plan.height);
          source=canvas;
        }
        if(curved&&curves.length){
          try{
            const result=rasterCurvedPlate(source,p,level,curves,sculpt);
            if(result.pixels||result.recessed){source=result.canvas;offset=result.pad;groupPixels+=result.pixels;groupRecessed+=result.recessed;groupPlates++;}
          }catch{contourStats.failures++;}
        }
        const material=bakeMaterial(scene,level,source as CanvasImageSource & {width:number;height:number},16,offset,[p.x-offset,p.y-offset]);
        if(material)source=material.canvas;
        if(cuts.length||annexCut||offset||material){
          renderKey='terrain_plate_finish_'+(++finishSerial);
          if(!scene.textures.addCanvas(renderKey,source as HTMLCanvasElement))throw Error('finish texture unavailable');
          generated.push(renderKey);
        }
        const image=scene.add.image(p.x-offset,p.y-offset,renderKey).setOrigin(0).setData('terrainPlate',p.id).setData('organicContour',offset>0);
        if(material)registerMaterial(scene,image,material);
        added.push(image);into.add(image);
      }
      if(annex&&plan){
        into.add(annex.view);
        for(const cell of plan.cells)annexCells.add(cell);
        scene.data.set('lanternAnnex',{col:plan.col,row:plan.row,x:plan.x,y:plan.y,width:plan.width,height:plan.height,bottomRow:plan.bottomRow,cells:plan.cells.size,pad:annex.pad,extended:annex.extended,graded:annex.graded});
      }
      for(const q of islands)for(let c=q.col;c<q.col+q.length;c++)islandCells.add(q.row*level.cols+c);
      contourStats.recessed+=groupRecessed;contourStats.pixels+=groupPixels;contourStats.plates+=groupPlates;contourStats.curves+=curves.length;
      if(generated.length)scene.events.once('shutdown',()=>{for(const key of generated)scene.textures.remove(key);});
      for(const {p} of entries){
        for(let c=p.c0;c<p.c1;c++)columns.add(c);
        accepted.push(p.id);
      }
    }catch{added.forEach(image=>image.destroy());generated.forEach(key=>scene.textures.remove(key));reject('render');}
  }
  scene.data.set('organicContours',contourStats);
  scene.data.set('terrainPlateIslandCells',islandCells);
  scene.data.set('terrainPlates',accepted);scene.data.set('terrainPlateRejected',rejected);
  return columns;
}
function readEdge(source:CanvasImageSource,p:TerrainPlatePlan,right:boolean){
  const canvas=document.createElement('canvas');canvas.width=1;canvas.height=p.height;
  const g=canvas.getContext('2d');if(!g)throw Error('edge canvas unavailable');
  g.drawImage(source,right?p.width-1:0,0,1,p.height,0,0,1,p.height);
  const rgba=g.getImageData(0,0,1,p.height).data;
  g.clearRect(0,0,1,p.height);g.fillStyle='#fff';
  const edgeX=p.x+(right?p.width-1:0);
  for(const poly of p.polygons){
    g.beginPath();poly.forEach(([x,y],i)=>i?g.lineTo(x-edgeX,y-p.y):g.moveTo(x-edgeX,y-p.y));g.closePath();g.fill();
  }
  const mask=g.getImageData(0,0,1,p.height).data.filter((_,i)=>i%4===3);
  return {y:p.y,rgba,mask};
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

/** Preview an individually authored end of a connected terrain group.
 * Keep the original terrain beneath the new art; never suppress geometry.
 * Only explicitly commissioned sections may use this transitional mode. */
export function paintTerrainBlend(scene:Phaser.Scene,level:LevelData,into:Phaser.GameObjects.Container){
  if(level.id!=='1-2')return;
  const id='chunk_007',key='w1_plate_'+level.id+'_'+id;
  const p=terrainPlateGroups(level).flat().find(q=>q.id===id);
  const rejected=scene.data.get('terrainPlateRejected') as string[];
  if(!p||p.protectedArea||!p.leftConnected||p.rightConnected||!rejected.includes(id+':missing-neighbor')||!scene.textures.exists(key))return;
  const source=scene.textures.get(key).getSourceImage() as CanvasImageSource & {width:number;height:number};
  const blendKey=key+'_blend_v1',fade=96;
  try{
    if(source.width!==p.width||source.height!==p.height||!validAlpha(source,p,level))return;
    if(!scene.textures.exists(blendKey)){
      const tex=scene.textures.createCanvas(blendKey,p.width,p.height);
      if(!tex)return;
      const g=tex.getContext();
      g.drawImage(source,0,0);
      g.globalCompositeOperation='destination-in';
      const gradient=g.createLinearGradient(0,0,fade,0);
      gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(1,'rgba(0,0,0,1)');
      g.fillStyle=gradient;g.fillRect(0,0,p.width,p.height);
      g.globalCompositeOperation='source-over';tex.refresh();
    }
    into.add(scene.add.image(p.x,p.y,blendKey).setOrigin(0).setData('terrainBlend',id));
    scene.data.set('terrainBlends',[{id,x:p.x,y:p.y,fade,key:blendKey}]);
  }catch{scene.data.set('terrainBlends',[]);}
}
