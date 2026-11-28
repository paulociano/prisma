// Chapter II progress is separate from the original 28-stage save.
export const PART2_KEY='prisma-part2-v1';
export const REGIONS=[
 {id:8,name:'Geleiras de Opala',insignia:'Transformação',color:0x9ed9ed,theme:'Aceitar a mudança'},
 {id:9,name:'Forjas de Âmbar',insignia:'Equilíbrio',color:0xe5a454,theme:'Força sem exaustão'},
 {id:10,name:'Bosque de Ametista',insignia:'Autenticidade',color:0xb68ce0,theme:'Liberdade de ser visto'},
 {id:11,name:'Arquipélago de Jade',insignia:'Liberdade',color:0x71cba5,theme:'Seguir em frente'},
 {id:12,name:'Labirinto de Mercúrio',insignia:'Singularidade',color:0xbecddd,theme:'Existir sem comparação'},
 {id:13,name:'Deserto de Obsidiana',insignia:'Coragem',color:0x9f8ab8,theme:'Enfrentar o desconhecido'},
 {id:14,name:'Nexus Prismático',insignia:'Harmonia',color:0xe0b7f4,theme:'Coexistência sem uniformidade'},
] as const;
export interface Part2Progress { pilotCleared:boolean; completedWorlds:number[]; opalPreviewCleared:number[] }
export function normalizePart2(raw:unknown):Part2Progress {
 const value=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const ids=Array.isArray(value.completedWorlds)?value.completedWorlds:[];
 // Accept only a contiguous sequence of actual world completions.
 const completedWorlds:number[]=[];
 for(const r of REGIONS){if(!ids.includes(r.id))break;completedWorlds.push(r.id);}
 const stages=Array.isArray(value.opalPreviewCleared)?value.opalPreviewCleared:[];
 const opalPreviewCleared:number[]=[];
 for(let n=1;n<=4;n++){if(!stages.includes(n))break;opalPreviewCleared.push(n);}
 return {pilotCleared:value.pilotCleared===true,completedWorlds,opalPreviewCleared};
}
export function part2Unlocked(save:{finished:boolean}):boolean{return save.finished===true;}
export function loadPart2():Part2Progress{
 try{return normalizePart2(JSON.parse(localStorage.getItem(PART2_KEY)??'null'));}
 catch{return normalizePart2(null);}
}
export function writePart2(progress:Part2Progress):boolean{
 try{localStorage.setItem(PART2_KEY,JSON.stringify(normalizePart2(progress)));return true;}
 catch{return false;}
}
export function clearPart2():boolean{
 try{localStorage.removeItem(PART2_KEY);return true;}catch{return false;}
}
export function finishPilot(progress:Part2Progress):Part2Progress{return {...normalizePart2(progress),pilotCleared:true};}
export function hasInsignia(progress:Part2Progress,world:number):boolean{return normalizePart2(progress).completedWorlds.includes(world);}
export function grantWorldInsignia(progress:Part2Progress,world:number):Part2Progress{
 const p=normalizePart2(progress);
 if(world===8+p.completedWorlds.length&&world<=14)p.completedWorlds.push(world);
 return p;
}

/** Preview progress never counts as a world restored or a collectible awarded. */
export function opalPreviewUnlocked(p:Part2Progress,stage:number):boolean{
 return Number.isInteger(stage)&&stage>=1&&stage<=4&&(stage===1||normalizePart2(p).opalPreviewCleared.includes(stage-1));
}
export function finishOpalPreview(p:Part2Progress,stage:number):Part2Progress{
 const next=normalizePart2(p);
 if(opalPreviewUnlocked(next,stage)&&!next.opalPreviewCleared.includes(stage))next.opalPreviewCleared.push(stage);
 if(stage===1&&next.opalPreviewCleared.includes(1))next.pilotCleared=true;
 return next;
}
