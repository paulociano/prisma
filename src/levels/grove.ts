// World 10: light, visibility and organic movement. Pure simulation, no Phaser dependencies.
import {shuttleX,type Surface,type Shuttle,type AmberFoe} from './amber';
export type LightPlatform={x:number;y:number;width:number;period:number;offset:number};
export type LightRelay={id:string;x:number;y:number};
export interface GroveStage{
 id:1|2|3|4;name:string;brief:string;width:number;slabs:Surface[];
 lights:LightPlatform[];roots:Shuttle[];relays:LightRelay[];foes:AmberFoe[];
 checkpoint:number;exit:number;boss?:boolean;
}
const floor=(x:number,w:number):Surface=>({x,y:640,w,h:80});
const ledge=(x:number,y:number,w:number):Surface=>({x,y,w,h:24});
const ground=(x:number,range=60):AmberFoe=>({x,y:640,air:false,range});
const air=(x:number,y:number,range=45):AmberFoe=>({x,y,air:true,range});
export const GROVE_STAGES:GroveStage[]=[
 {id:1,name:'Trilha dos Vagalumes',brief:'Observe as plataformas luminosas antes de saltar. As silhuetas nunca desaparecem por completo.',width:3584,
 slabs:[floor(0,780),floor(960,840),floor(1990,1594),ledge(480,490,160),ledge(1220,470,180),ledge(2500,460,190)],
 lights:[{x:810,y:510,width:120,period:5,offset:0},{x:1830,y:500,width:130,period:5,offset:1.5}],
 roots:[],relays:[],foes:[air(610,450),ground(1150),air(1560,430),ground(2370),air(3000,455)],checkpoint:1640,exit:3380},
 {id:2,name:'Raízes do Despertar',brief:'Atravesse os vãos nas raízes móveis e evite ficar sobre as criaturas terrestres.',width:3904,
 slabs:[floor(0,820),floor(1180,800),floor(2310,790),floor(3390,514),ledge(520,480,180),ledge(1430,470,170),ledge(2630,450,180)],
 lights:[],roots:[{fromX:850,toX:1150,y:510,width:160,period:5},{fromX:2010,toX:2280,y:500,width:150,period:5.4},{fromX:3130,toX:3360,y:510,width:145,period:4.6}],
 relays:[],foes:[ground(640),air(1050,420),ground(1530),air(2150,410),ground(2780),air(3250,435)],checkpoint:1810,exit:3730},
 {id:3,name:'Clareira das Luzes',brief:'Acenda os três cristais com o Bastão da Aliança para abrir a passagem.',width:4352,
 slabs:[floor(0,760),floor(940,780),floor(1910,800),floor(2890,680),floor(3750,602),ledge(490,465,180),ledge(1350,470,165),ledge(2340,465,180),ledge(3250,465,170)],
 lights:[{x:790,y:510,width:120,period:5.2,offset:0},{x:2730,y:510,width:130,period:5.2,offset:2}],
 roots:[],relays:[{id:'l1',x:590,y:410},{id:'l2',x:1430,y:420},{id:'l3',x:3330,y:410}],
 foes:[air(640,380),ground(1200),air(2200,435),ground(2490),ground(3150),air(3950,430)],checkpoint:2100,exit:4160},
 {id:4,name:'Santuário do Desabrochar',brief:'Ilumine os dois cristais do santuário para abrir as pétalas da Flor do Silêncio.',width:1280,
 slabs:[floor(0,1280),ledge(245,475,160),ledge(550,400,155),ledge(850,475,165)],
 lights:[],roots:[],relays:[{id:'left',x:325,y:425},{id:'right',x:630,y:350}],foes:[],checkpoint:150,exit:1180,boss:true}
];
export const groveStage=(id:number)=>GROVE_STAGES.find(s=>s.id===id);
export type LightPhase='bright'|'fading'|'dim';
/** Fade warning precedes the dim phase. Dim geometry retains a readable silhouette. */
export function lightPhase(p:LightPlatform,time:number):LightPhase{
 const t=((time+p.offset)%p.period+p.period)%p.period/p.period;
 return t<.56?'bright':t<.76?'fading':'dim';
}
export const rootX=shuttleX;
export function activateRelay(relays:LightRelay[],lit:readonly string[],id:string):string[]{
 return relays.some(r=>r.id===id)&&!lit.includes(id)?[...lit,id]:[...lit];
}
export function relaysReady(relays:LightRelay[],lit:readonly string[]):boolean{
 return relays.every(r=>lit.includes(r.id));
}
export type BloomPhase='sealed'|'warning'|'pulse'|'open'|'restored';
export type BloomState={hp:number;phase:BloomPhase;remaining:number;lit:string[]};
export const BLOOM_RELAYS=GROVE_STAGES[3].relays;
export function newBloom():BloomState{return {hp:6,phase:'sealed',remaining:2,lit:[]};}
/** The player opens petals through two light relays, not by forcing damage into a shield. */
export function lightBloom(s:BloomState,id:string):BloomState{
 if(s.phase==='restored'||s.phase==='open')return s;
 const lit=activateRelay(BLOOM_RELAYS,s.lit,id);
 return relaysReady(BLOOM_RELAYS,lit)?{...s,lit,phase:'open',remaining:4}:{...s,lit};
}
export function advanceBloom(s:BloomState,dt:number):BloomState{
 if(s.phase==='restored'||!Number.isFinite(dt)||dt<=0)return s;
 let next=s,t=Math.min(dt,60);
 while(next.phase!=='restored'&&t>=next.remaining){
  t-=next.remaining;
  if(next.phase==='sealed')next={...next,phase:'warning',remaining:.9};
  else if(next.phase==='warning')next={...next,phase:'pulse',remaining:.5};
  else if(next.phase==='pulse')next={...next,phase:'sealed',remaining:2};
  else next={...next,phase:'sealed',remaining:2,lit:[]};
 }
 return {...next,remaining:next.remaining-t};
}
export function hitBloom(s:BloomState):BloomState{
 if(s.phase!=='open')return s;
 return s.hp<=1?{...s,hp:0,phase:'restored',remaining:0}:{...s,hp:s.hp-1,phase:'sealed',remaining:2,lit:[]};
}
