import {T,type LevelData} from '../levels/LevelBuilder';
import {TILE} from '../config';
export interface LanternAnnexPlan {
  col:number;row:number;x:number;y:number;width:number;height:number;
  bottomRow:number;cells:Set<number>;
}
/** Match the actual closed chamber and its hanging central pillar. No hard
 * coded expanded-level column. All core cells must agree with the map. */
export function lanternAnnexPlan(level:LevelData):LanternAnnexPlan|undefined{
  if(level.id!=='1-2'||level.arena||level.rows<20)return;
  const at=(c:number,r:number)=>level.tiles[r]?.[c];
  for(let c=1;c+14<level.cols;c++){
    const bottom=level.rows-6;
    const expected=(dx:number,r:number)=>r===1||r===8||((dx===0||dx===13)&&r>=2&&r<=7)||(dx>=5&&dx<=8&&r>=9&&r<=bottom);
    let valid=true;const cells=new Set<number>();
    for(let r=1;r<=bottom;r++)for(let dx=0;dx<14;dx++){
      const solid=expected(dx,r),actual=at(c+dx,r);
      if(solid){if(actual!==T.Solid)valid=false;else cells.add(r*level.cols+c+dx);}
      else if(actual===T.Solid)valid=false;
    }
    if(!valid||cells.size!==40+4*(bottom-8))continue;
    if(at(c+5,5)!==T.OneWay||at(c+6,7)!==T.Spike||at(c+7,7)!==T.Spike)continue;
    if(!Array.from({length:14},(_,dx)=>at(c+dx,0)===T.Empty&&at(c+dx,bottom+1)===T.Empty).every(Boolean))continue;
    return {col:c,row:1,x:c*TILE,y:TILE,width:14*TILE,height:bottom*TILE,bottomRow:bottom,cells};
  }
}
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
/** Low-frequency relief, with zero extension at structural contact corners. */
export function annexOverhang(t:number,length:number,seed:number,max:number){
  if(t<=0||t>=length)return 0;
  const e=smooth(Math.min(t,length-t)/28);
  return e*max*(.57+.27*Math.sin(t*.023+seed)+.16*Math.sin(t*.057-seed));
}
