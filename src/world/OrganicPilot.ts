/** Opt-in migration policy; the Vale renderer remains default. */
export function organicSculpturePilot(levelId:string,params:URLSearchParams):boolean{
  return params.get('organic')!=='0'&&params.get('plates')!=='0'&&
    (levelId==='1-1'||(levelId==='1-2'&&params.get('lanterns')==='1'));
}
