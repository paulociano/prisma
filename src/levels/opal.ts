// Opala vertical slice. Coordinates are pixels, surfaces are physical rectangles.
// The first three routes introduce one mechanic at a time; the fourth is a boss prototype.
export type OpalStageId=1|2|3|4;
export type Slab={x:number;y:number;w:number;h:number;ice?:boolean;breakable?:boolean};
export type OpalFoe={x:number;y:number;air:boolean;range:number};
export type Wind={from:number;to:number;force:number};
export interface OpalStage {
 id:OpalStageId;name:string;brief:string;width:number;slabs:Slab[];
 foes:OpalFoe[];winds:Wind[];checkpoint:number;exit:number;boss?:boolean;
}
const floor=(x:number,w:number,ice=true):Slab=>({x,y:640,w,h:80,ice});
const ledge=(x:number,y:number,w:number,ice=false,breakable=false):Slab=>({x,y,w,h:24,ice,breakable});
const ground=(x:number,range=60):OpalFoe=>({x,y:640,air:false,range});
const air=(x:number,y:number,range=45):OpalFoe=>({x,y,air:true,range});
export const OPAL_STAGES:OpalStage[]=[
 {id:1,name:'Trilhas da Geada',brief:'Domine a inércia do gelo. Mergulhe sobre a carapaça para romper a defesa.',width:3456,
  slabs:[floor(0,780,false),floor(910,870),floor(1920,1536),ledge(520,492,180,true),ledge(1120,495,190),ledge(1460,407,180),ledge(2260,480,180,true)],
  foes:[ground(620),air(1250,470),ground(2450),air(2830,475)],winds:[],checkpoint:1670,exit:3260},
 {id:2,name:'Grutas de Opala',brief:'Suba pelas paredes e rompa o gelo frágil com o mergulho estelar.',width:3712,
  slabs:[floor(0,970),floor(1110,1060,false),floor(2330,1382),ledge(430,480,180),ledge(710,335,140),{x:1540,y:370,w:64,h:270,ice:false},{x:1800,y:325,w:64,h:315,ice:false},ledge(1604,470,196,true,true),ledge(2050,500,170),ledge(2480,455,180,true,true),ledge(2780,415,170)],
  foes:[air(735,290),ground(1270),air(1710,400,50),ground(2550),air(3010,460)],winds:[],checkpoint:2070,exit:3510},
 {id:3,name:'Ponte das Rajadas',brief:'Observe o vento, combine o dash com o planar e procure pontos de apoio.',width:4096,
  slabs:[floor(0,650),floor(820,560),floor(1540,610,false),floor(2330,700),floor(3210,886,false),ledge(670,470,130),ledge(1410,410,110),ledge(2175,465,130,true),ledge(3060,420,120,true)],
  foes:[ground(520),air(1030,410),ground(1840),air(2490,400),ground(2840),air(3550,455)],winds:[{from:650,to:1380,force:-145},{from:1550,to:2330,force:120},{from:2400,to:3210,force:-165}],checkpoint:2000,exit:3890},
 {id:4,name:'Santuário Congelado',brief:'A Coroa da Geada protege seu núcleo. Esquive dos avisos e ataque apenas quando a luz se abrir.',width:1280,
  slabs:[floor(0,1280),ledge(250,465,155),ledge(525,400,150),ledge(860,465,155)],foes:[],winds:[],checkpoint:150,exit:1180,boss:true}
];
export const opalStage=(id:number)=>OPAL_STAGES.find(s=>s.id===id);
export type CrownPhase='warning'|'strike'|'exposed'|'restored';
export type CrownState={hp:number;phase:CrownPhase;remaining:number;cycle:number};
export function newCrown():CrownState{return {hp:6,phase:'warning',remaining:1.1,cycle:0};}
export function advanceCrown(s:CrownState,dt:number):CrownState{
 if(s.phase==='restored')return s;
 const remaining=s.remaining-Math.max(0,dt);
 if(remaining>0)return {...s,remaining};
 if(s.phase==='warning')return {...s,phase:'strike',remaining:.42};
 if(s.phase==='strike')return {...s,phase:'exposed',remaining:1.65};
 return {...s,phase:'warning',remaining:Math.max(.65,1.1-s.cycle*.06),cycle:s.cycle+1};
}
export function hitCrown(s:CrownState):CrownState{
 if(s.phase!=='exposed')return s;
 return s.hp<=1?{...s,hp:0,phase:'restored',remaining:0}:{...s,hp:s.hp-1,phase:'warning',remaining:.9,cycle:s.cycle+1};
}
