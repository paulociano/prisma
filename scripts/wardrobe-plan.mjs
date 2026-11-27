// Shared contract for authored world sheets. World 1 uses the base assets.
export function wardrobeSheetPlan(sheets){
 const iris=sheets.filter(s=>s.key.startsWith('iris_')&&s.key!=='iris_portraits');
 return Array.from({length:6},(_,i)=>i+2).flatMap(world=>
  iris.filter(s=>s.key!=='iris_swim'||world===5).map(s=>({
   ...s,world,baseKey:s.key,key:'w'+world+'_'+s.key,
   src:'personagens/figurinos/stage_'+world+'/'+s.src.split('/').pop(),
   authoredWardrobe:true,
  }))
 );
}
