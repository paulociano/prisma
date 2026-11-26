/** Story-time wardrobe. Boss completion is the existing authoritative save. */
export const WARDROBE_REWARDS=[
  {name:'Broche do Coração',color:0xff4d5e},
  {name:'Faixa do Entardecer',color:0xff9a3c},
  {name:'Insígnia Solar',color:0xffd93d},
  {name:'Manto Esmeralda',color:0x5fd068},
  {name:'Bracelete das Marés',color:0x3ccfd8},
  {name:'Botas Estelares',color:0x5b6cff},
  {name:'Emblema da Plenitude',color:0xb15bff},
] as const;
export function wardrobeStage(world:number,completed:readonly string[]):number{
  if(!Number.isInteger(world)||world<1||world>7)return 0;
  const owned=new Set(completed);
  // Earlier replays keep their story-era outfit; rewards are never erased.
  for(let w=1;w<world;w++)if(!owned.has(w+'-4'))return 0;
  if(world===7&&owned.has('7-4'))return 7;
  return world-1;
}
export function wardrobePrefix(stage:number):string{
  if(stage===7)return 'w7_final_';
  return stage>=1&&stage<=6?'w'+(stage+1)+'_':'';
}
export function wardrobeReward(world:number,completed:readonly string[]):string|undefined{
  return completed.includes(world+'-4')?undefined:WARDROBE_REWARDS[world-1]?.name;
}
