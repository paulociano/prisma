/** Shared wind field, sampled in world pixels and gameplay seconds.
 * A plant's planted pivot never moves. No physics or random per-frame state. */
export function windAt(x:number,t:number):number{
  return .58*Math.sin(t*.83+x*.0021)+.29*Math.sin(t*1.71-x*.0047)+.13*Math.sin(t*2.8+x*.009);
}
export function plantAngle(x:number,t:number,life:number,base=0):number{
  return base+windAt(x,t)*(1.2+2.3*Math.max(0,Math.min(1,life)));
}
export function pollenPose(x:number,y:number,seed:number,t:number,life:number){
  const period=7+(Math.abs(seed)%5),phase=((t/period+seed*.137)%1+1)%1;
  const envelope=Math.sin(Math.PI*phase)**2;
  return {x:x+Math.sin(phase*Math.PI*2+seed)*22+windAt(x,t)*12*envelope,
    y:y-18-phase*90+Math.sin(t*.7+seed)*5,
    alpha:envelope*(.13+.32*Math.max(0,Math.min(1,life)))};
}
