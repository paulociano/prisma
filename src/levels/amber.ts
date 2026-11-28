// Amber Forges: authored route and thermal simulation contracts, independent of rendering.
// Coordinates match the existing 1280x720 arena / 640 ground plane.
export type AmberStageId=1|2|3|4;
export type Surface={x:number;y:number;w:number;h:number};
export type ThermalVent={x:number;width:number;offset:number;period:number};
export type Shuttle={fromX:number;toX:number;y:number;width:number;period:number};
export type AmberFoe={x:number;y:number;air:boolean;range:number};
export interface AmberStage {
 id:AmberStageId;name:string;brief:string;width:number;slabs:Surface[];
 vents:ThermalVent[];shuttles:Shuttle[];foes:AmberFoe[];checkpoint:number;exit:number;boss?:boolean;
}
const floor=(x:number,w:number):Surface=>({x,y:640,w,h:80});
const ledge=(x:number,y:number,w:number):Surface=>({x,y,w,h:24});
const ground=(x:number,range=60):AmberFoe=>({x,y:640,air:false,range});
const air=(x:number,y:number,range=45):AmberFoe=>({x,y,air:true,range});
export const AMBER_STAGES:AmberStage[]=[
 {id:1,name:'Caminho das Brasas',brief:'Observe os avisos das erupções e atravesse durante o resfriamento.',width:3584,
  slabs:[floor(0,840),floor(990,920),floor(2070,1514),ledge(550,490,180),ledge(1250,475,180),ledge(2440,485,180)],
  vents:[{x:460,width:100,offset:0,period:4.8},{x:1160,width:110,offset:1.6,period:5},{x:2650,width:120,offset:2.5,period:5.2}],
  shuttles:[],foes:[ground(700),air(1350,450),ground(2310),air(3040,465)],checkpoint:1720,exit:3380},
 {id:2,name:'Engrenagens de Âmbar',brief:'Use as plataformas móveis para cruzar os poços entre as forjas.',width:3904,
  slabs:[floor(0,800),floor(1180,740),floor(2350,760),floor(3400,504),ledge(560,460,175),ledge(1480,475,170),ledge(2650,460,190)],
  vents:[{x:1740,width:100,offset:1,period:5}],shuttles:[{fromX:820,toX:1160,y:510,width:150,period:4.8},{fromX:1940,toX:2330,y:500,width:160,period:5.4},{fromX:3125,toX:3380,y:510,width:145,period:4.4}],
  foes:[ground(610),air(1010,415),ground(1430),air(2110,390),ground(2760),air(3270,425)],checkpoint:1850,exit:3720},
 {id:3,name:'Coração das Forjas',brief:'Alterne deslocamentos e pausas seguras entre as zonas de vapor.',width:4352,
  slabs:[floor(0,720),floor(900,710),floor(1800,780),floor(2800,620),floor(3640,712),ledge(660,440,145),ledge(1450,440,140),ledge(2510,425,145),ledge(3370,440,140)],
  vents:[{x:490,width:110,offset:.4,period:4.6},{x:1300,width:130,offset:2,period:4.8},{x:2280,width:135,offset:.8,period:5.1},{x:3120,width:120,offset:2.6,period:4.5},{x:3900,width:130,offset:1.1,period:4.8}],
  shuttles:[{fromX:2600,toX:2780,y:515,width:130,period:4.6}],foes:[ground(620),air(1090,420),ground(1460),air(2040,420),ground(2400),air(2960,420),ground(3790)],checkpoint:1960,exit:4140},
 {id:4,name:'Fornalha Infinita',brief:'Aguarde a liberação da pressão térmica e alcance o núcleo durante a janela de resfriamento.',width:1280,
  slabs:[floor(0,1280),ledge(260,475,160),ledge(550,405,155),ledge(850,475,165)],vents:[],shuttles:[],foes:[],checkpoint:150,exit:1180,boss:true}
];
export const amberStage=(id:number)=>AMBER_STAGES.find(s=>s.id===id);
export type VentPhase='cool'|'warning'|'eruption';
/** First 52% of the cycle is safe, next 24% warns, final 24% is active. */
export function ventPhase(vent:ThermalVent,time:number):VentPhase{
 const cycle=((time+vent.offset)%vent.period+vent.period)%vent.period/vent.period;
 return cycle<.52?'cool':cycle<.76?'warning':'eruption';
}
/** Continuous, deterministic movement; starts stationary at fromX. X is platform center. */
export function shuttleX(shuttle:Shuttle,time:number):number{
 const t=(1-Math.cos(2*Math.PI*time/shuttle.period))/2;
 return shuttle.fromX+(shuttle.toX-shuttle.fromX)*t;
}
export type FurnacePhase='charging'|'warning'|'venting'|'exposed'|'restored';
export type FurnaceState={hp:number;heat:number;phase:FurnacePhase;elapsed:number;cycle:number};
const duration:Record<Exclude<FurnacePhase,'restored'>,number>={charging:1.6,warning:.9,venting:.65,exposed:2};
export function newFurnace():FurnaceState{return {hp:8,heat:0,phase:'charging',elapsed:0,cycle:0};}
const nextPhase:Record<Exclude<FurnacePhase,'restored'>,Exclude<FurnacePhase,'restored'>>={charging:'warning',warning:'venting',venting:'exposed',exposed:'charging'};
/** Advance by elapsed seconds. Carry remaining time across phase boundaries. */
export function advanceFurnace(s:FurnaceState,dt:number):FurnaceState{
 if(s.phase==='restored'||!Number.isFinite(dt)||dt<=0)return s;
 let phase:Exclude<FurnacePhase,'restored'>=s.phase;
 let elapsed=s.elapsed+Math.min(dt,60),cycle=s.cycle;
 while(elapsed>=duration[phase]){
  elapsed-=duration[phase];phase=nextPhase[phase];if(phase==='charging')cycle++;
 }
 const progress=elapsed/duration[phase];
 const heat=phase==='charging'?100*progress:phase==='warning'?100:phase==='venting'?100*(1-progress):0;
 return {...s,phase,elapsed,cycle,heat};
}
/** Only the cool exposed core accepts restorative energy; one hit closes each window. */
export function hitFurnace(s:FurnaceState):FurnaceState{
 if(s.phase!=='exposed')return s;
 return s.hp<=1?{...s,hp:0,heat:0,phase:'restored',elapsed:0}:{...s,hp:s.hp-1,heat:0,phase:'charging',elapsed:0,cycle:s.cycle+1};
}
