import type Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { platformDepth, platformProfile, type PlatformKind } from '../world/PlatformProfile';
import { bakeMaterial, registerMaterial } from './MaterialPreview';

const ASSET='w1_organic_island';
let serial=0;
export function platformVolumesEnabled(level:LevelData){
  const params=new URLSearchParams(window.location.search);
  return level.id==='1-1'&&params.get('platforms')!=='0'&&params.get('organic')!=='0'&&params.get('plates')!=='0';
}
/** Same authored stone/moss material; one continuous shaped image per run.
 * Warp only the rock below its registered contact, not the physical surface.
 * The caller owns positions and physics. Static decoration is masked away
 * from all other occupied cells and hazards. */
export function createPlatformVolume(scene:Phaser.Scene,level:LevelData,kind:PlatformKind,
  cx:number,contactY:number,width:number):Phaser.GameObjects.Image|undefined{
  if(!platformVolumesEnabled(level)||!scene.textures.exists(ASSET)||width<64||width>512||!Number.isInteger(width))return;
  const src=scene.textures.get(ASSET).getSourceImage() as CanvasImageSource & {width:number;height:number};
  if(src.width!==448||src.height!==240)return;
  const left=cx-width/2,seed=Math.round(left/TILE)*31+Math.round(contactY/TILE)*17;
  // A second row below a solid island can be occupied. Do not let the
  // visual volume extend into it, even if a previous asset did.
  let clearance=Infinity;
  if(kind!=='mover'){
    const row=Math.floor(contactY/TILE);
    for(let c=Math.floor(left/TILE);c<Math.ceil((left+width)/TILE);c++){
      for(let dy=1;dy<=2;dy++)if(level.tiles[row+dy]?.[c]!==T.Empty){
        clearance=Math.min(clearance,dy*TILE-2);break;
      }
    }
  }
  const p=platformProfile(kind,width,seed,clearance);
  if(p.below<16)return;
  const w=width+2*p.margin,h=Math.ceil(p.above+p.below);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const g=canvas.getContext('2d');if(!g)return;
  const source=document.createElement('canvas');source.width=448;source.height=240;
  const sg=source.getContext('2d');if(!sg)return;
  let key='';
  try{
    if(p.flip){sg.translate(448,0);sg.scale(-1,1);}
    sg.drawImage(src,0,0);
    // Map the source's registered 384px playable core to the exact
    // world-space width; decorative margins stay independent.
    const base=document.createElement('canvas');base.width=w;base.height=240;
    const bg=base.getContext('2d');if(!bg)return;
    bg.drawImage(source,0,0,32,240,0,0,p.margin,240);
    bg.drawImage(source,32,0,384,240,p.margin,0,width,240);
    bg.drawImage(source,416,0,32,240,p.margin+width,0,p.margin,240);
    g.drawImage(base,0,0,w,48,0,0,w,p.above);
    for(let x=0;x<w;x++){
      const depth=platformDepth(p,(x+.5)/w);
      g.drawImage(base,x,48,1,192,x,p.above,1,depth);
    }
    if(kind!=='mover'){
      const image=g.getImageData(0,0,w,h),a=image.data;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const wx=left-p.margin+x,wy=contactY-p.above+y;
        const tile=level.tiles[Math.floor(wy/TILE)]?.[Math.floor(wx/TILE)];
        const own=wx>=left&&wx<left+width&&wy>=contactY&&wy<contactY+TILE&&tile===(kind==='solid'?T.Solid:T.OneWay);
        if(!own&&tile!==T.Empty)a[(y*w+x)*4+3]=0;
      }
      g.putImageData(image,0,0);
    }
    key='organic_platform_volume_'+(++serial);
    const material=bakeMaterial(scene,level,canvas,0,0,[left-p.margin,contactY-p.above]);
    if(!scene.textures.addCanvas(key,material?.canvas??canvas))return;
    const view=scene.add.image(cx,contactY,key).setOrigin(.5,p.above/h)
      .setData('platformVolume',{kind,width,above:p.above,below:p.below,seed,flip:p.flip});
    if(material)registerMaterial(scene,view,material);
    scene.events.once('shutdown',()=>scene.textures.remove(key));
    return view;
  }catch{
    if(key&&scene.textures.exists(key))scene.textures.remove(key);
    return;
  }
}
