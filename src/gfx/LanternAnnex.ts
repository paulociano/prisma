import type Phaser from 'phaser';
import {T} from '../levels/LevelBuilder';
import type {LevelData} from '../levels/LevelBuilder';
import {TILE} from '../config';
import type {TerrainPlatePlan} from '../levels/ArtGeometry';
import {annexOverhang,type LanternAnnexPlan} from '../world/LanternAnnex';
import {bakeMaterial,registerMaterial} from './MaterialPreview';
const PAD=40;
let serial=0;
type Source=CanvasImageSource;
/** The chamber and pedestal are composited from the validated painted master
 * in world space, not assembled from props. Keep the aperture untouched. */
export function buildLanternAnnex(scene:Phaser.Scene,level:LevelData,p:LanternAnnexPlan,entries:readonly {p:TerrainPlatePlan}[],sources:readonly Source[]){
  const canvas=document.createElement('canvas');canvas.width=p.width+PAD*2;canvas.height=p.height+PAD*2;
  const g=canvas.getContext('2d');if(!g)return;
  const {width:w,height:h}=canvas;
  for(let i=0;i<entries.length;i++){
    const q=entries[i].p;
    g.drawImage(sources[i],q.x-p.x+PAD,q.y-p.y+PAD);
  }
  const pixels=g.getImageData(0,0,w,h),a=pixels.data;
  // Copy only the exact component, leaving the opening and unrelated terrain clear.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const c=Math.floor((p.x+x-PAD)/TILE),r=Math.floor((p.y+y-PAD)/TILE);
    if(!p.cells.has(r*level.cols+c))a[(y*w+x)*4+3]=0;
  }
  const original=a.slice();
  let extended=0,graded=0;
  const extend=(x:number,y:number,sx:number,sy:number,alpha:number)=>{
    if(x<0||y<0||x>=w||y>=h||sx<0||sy<0||sx>=w||sy>=h)return;
    const wx=p.x+x-PAD,wy=p.y+y-PAD,c=Math.floor(wx/TILE),r=Math.floor(wy/TILE);
    if(level.tiles[r]?.[c]!==T.Empty)return;
    // No new paint in the room, even in otherwise empty cells.
    if(wx>=p.x+TILE&&wx<p.x+p.width-TILE&&wy>=2*TILE&&wy<8*TILE)return;
    const i=(y*w+x)*4,j=(sy*w+sx)*4;
    if(original[j+3]<220||a[i+3]>=220)return;
    const opacity=Math.round(original[j+3]*alpha);
    if(opacity<=a[i+3])return;
    if(!a[i+3])extended++;
    a[i]=original[j];a[i+1]=original[j+1];a[i+2]=original[j+2];a[i+3]=opacity;
  };
  // Exterior side contours and pedestal roots. The room's inner edge and
  // both walkable top lines stay intact. Existing pigment supplies all color.
  for(const [left,right,start,end,seed] of [[0,p.width,0,8*TILE,1],[5*TILE,9*TILE,8*TILE,p.height,3]]){
    for(let y=start;y<end;y++){
      for(const side of [-1,1]){
        const edge=side<0?left:right-1,n=annexOverhang(y-start+.5,end-start,seed+side,36);
        for(let d=1;d<=Math.ceil(n);d++)extend(PAD+edge+side*d,PAD+y,PAD+edge-side*Math.min(12,Math.floor(d*.5)),PAD+y,Math.min(1,n-d+1));
      }
    }
  }
  // Roots taper below the suspended pillar; max extension is less than a tile.
  for(let x=5*TILE;x<9*TILE;x++){
    const n=annexOverhang(x-5*TILE+.5,4*TILE,5,38);
    for(let d=1;d<=Math.ceil(n);d++)extend(PAD+x,PAD+p.height-1+d,PAD+x,PAD+p.height-1-Math.min(16,Math.floor(d*.6)),Math.min(1,n-d+1));
  }
  // One coherent light field across the entire construction, not separate
  // tint decisions per crop; shade the existing root/stone pigment only.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;if(a[i+3]<220)continue;
    const u=(x-PAD)/p.width,v=(y-PAD)/p.height;
    const k=1+.07*Math.sin(u*Math.PI*2+.4)-.06*v+.035*Math.sin((x-PAD)*.014+(y-PAD)*.009);
    for(let c=0;c<3;c++)a[i+c]*=k;
    graded++;
  }
  g.putImageData(pixels,0,0);
  const key='lantern_annex_'+(++serial);
  const material=bakeMaterial(scene,level,canvas,0,0,[p.x-PAD,p.y-PAD]);
  if(!scene.textures.addCanvas(key,material?.canvas??canvas))return;
  const view=scene.add.image(p.x-PAD,p.y-PAD,key).setOrigin(0).setData('lanternAnnex',true);
  if(material)registerMaterial(scene,view,material);
  return {view,key,pad:PAD,extended,graded};
}
