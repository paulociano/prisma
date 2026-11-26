/** Camera intent only. World pixels, seconds; Phaser owns bounds/follow.
 * The director never moves the player or writes gameplay state. */
export interface CameraZone {readonly c0:number;readonly c1:number;readonly zoom:number}
export interface CameraInput {
  readonly x:number;readonly vx:number;readonly vy:number;readonly grounded:boolean;
  readonly frozen:boolean;readonly reduced:boolean;readonly dt:number;
}
export interface CameraPose {readonly x:number;readonly y:number;readonly zoom:number;readonly mode:'rest'|'traverse'|'air'|'held'|'accessible'}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const smooth=(v:number)=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
const ease=(from:number,to:number,dt:number,rate:number)=>from+(to-from)*(1-Math.exp(-dt*rate));
export function regionalZoom(x:number,zones:readonly CameraZone[],tile=64):number{
  let zoom=1;
  const col=x/tile;
  for(const z of zones){
    const weight=smooth((col-z.c0+4)/4)*smooth((z.c1+4-col)/4);
    zoom=Math.min(zoom,1+(clamp(z.zoom,.86,1)-1)*weight);
  }
  return zoom;
}
export function cameraZones(authored:readonly CameraZone[],entities:readonly {col:number;type:string}[]):CameraZone[]{
  return [...authored,...entities.filter(e=>e.type==='shard'||e.type==='spring').map(e=>({c0:e.col-4,c1:e.col+4,zoom:.93}))];
}
export class CameraDirector{
  pose:CameraPose={x:0,y:60,zoom:1,mode:'rest'};
  constructor(readonly zones:readonly CameraZone[]){}
  reset(x:number,reduced=false){
    this.pose={x:0,y:60,zoom:reduced?1:regionalZoom(x,this.zones),mode:reduced?'accessible':'rest'};
    return this.pose;
  }
  step(i:CameraInput):CameraPose{
    if(i.reduced){this.pose={x:0,y:60,zoom:1,mode:'accessible'};return this.pose;}
    if(i.frozen){this.pose={...this.pose,mode:'held'};return this.pose;}
    const dt=clamp(i.dt,0,.1),speed=clamp(i.vx/340,-1,1);
    const air=!i.grounded;
    const mode=air?'air':Math.abs(i.vx)>35?'traverse':'rest';
    const targetX=-130*speed;
    // Look above while ascending and toward the landing while falling.
    const targetY=air?clamp(60-i.vy*.075,-24,122):60;
    const zoom=Math.min(regionalZoom(i.x,this.zones),air?1-.045*clamp(Math.abs(i.vy)/900,0,1):1);
    this.pose={x:ease(this.pose.x,targetX,dt,3.6),y:ease(this.pose.y,targetY,dt,4.2),
      zoom:ease(this.pose.zoom,zoom,dt,2),mode};
    return this.pose;
  }
}
