import type Phaser from 'phaser';

const KEY='organic_lantern_glow_v1';
const anchors=new WeakMap<object,{x:number;y:number}>();
/** Determine the luminous center from the actual painted atlas frame, once.
 * The weighted centroid favors bright warm pixels in the upper lantern.
 * Fallback is deliberately conservative when a canvas cannot read the atlas.
 */
function anchor(f:Phaser.Textures.Frame):{x:number;y:number}{
  const cached=anchors.get(f);if(cached)return cached;
  let point={x:.5,y:.35};
  try{
    const canvas=document.createElement('canvas');canvas.width=48;canvas.height=64;
    const g=canvas.getContext('2d');
    if(g){
      g.drawImage(f.source.image as CanvasImageSource,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,48,64);
      const {data}=g.getImageData(0,0,48,64);
      let total=0,sx=0,sy=0;
      for(let y=2;y<42;y++)for(let x=1;x<47;x++){
        const i=(y*48+x)*4,r=data[i],gr=data[i+1],b=data[i+2],a=data[i+3]/255;
        const weight=a*Math.pow(Math.max(0,Math.min(r,gr)-155)/100,2)*Math.max(0,(r-b-10)/100);
        total+=weight;sx+=x*weight;sy+=y*weight;
      }
      if(total>1)point={x:(sx/total+.5)/48,y:(sy/total+.5)/64};
    }
  }catch{/* same-origin atlas unavailable: use static anchor */}
  anchors.set(f,point);return point;
}
function ensureGlow(scene:Phaser.Scene):boolean{
  if(scene.textures.exists(KEY))return true;
  const t=scene.textures.createCanvas(KEY,128,128);
  if(!t)return false;
  const g=t.getContext(),q=g.createRadialGradient(64,64,1,64,64,64);
  q.addColorStop(0,'rgba(255,225,164,.53)');
  q.addColorStop(.22,'rgba(255,191,106,.31)');
  q.addColorStop(.56,'rgba(255,153,74,.10)');
  q.addColorStop(1,'rgba(255,153,74,0)');
  g.fillStyle=q;g.fillRect(0,0,128,128);t.refresh();
  return true;
}
/** One soft, static glow, behind the prop and inside ColorRestore's world.
 * No light objects, blend modes, tweens, new physics or frame-time work.
 */
export function addLanternLight(scene:Phaser.Scene,decor:Phaser.GameObjects.Container,
  prop:Phaser.GameObjects.Image,quality:'medium'|'high'):boolean{
  if(!ensureGlow(scene))return false;
  const p=anchor(prop.frame),w=prop.displayWidth,h=prop.displayHeight;
  const x=prop.x+(p.x-prop.originX)*w,y=prop.y+(p.y-prop.originY)*h;
  const size=Math.max(85,Math.min(180,h*2.15));
  const light=scene.add.image(x,y,KEY).setDisplaySize(size,size).setAlpha(quality==='high'?.83:.57);
  light.setData('organicLight',true);
  decor.add(light);
  return true;
}
/** Ground architecture with a soft contact shadow behind its painted base. */
export function addArchitectureContact(scene:Phaser.Scene,decor:Phaser.GameObjects.Container,
  prop:Phaser.GameObjects.Image):boolean{
  if(!scene.textures.exists('soft_shadow'))return false;
  const shadow=scene.add.image(prop.x,prop.y-13,'soft_shadow')
    .setDisplaySize(Math.min(180,prop.displayWidth*.88),18).setAlpha(.37);
  shadow.setData('organicContact',true);decor.add(shadow);return true;
}
