/** World-specific expedition outfits. Completion tracks rewards, not the outfit selector. */
export const WARDROBE_REWARDS=[
  {name:'Broche do Coração',color:0xff4d5e},
  {name:'Faixa do Entardecer',color:0xff9a3c},
  {name:'Insígnia Solar',color:0xffd93d},
  {name:'Manto Esmeralda',color:0x5fd068},
  {name:'Bracelete das Marés',color:0x3ccfd8},
  {name:'Botas Estelares',color:0x5b6cff},
] as const;
export function wardrobeStage(world:number):number{
  return Number.isInteger(world)&&world>=1&&world<=7?world:1;
}
export function wardrobePrefix(stage:number):string{
  return Number.isInteger(stage)&&stage>=2&&stage<=7?'w'+stage+'_':'';
}
export function wardrobeReward(world:number,completed:readonly string[]):string|undefined{
  return completed.includes(world+'-4')?undefined:WARDROBE_REWARDS[world-1]?.name;
}
