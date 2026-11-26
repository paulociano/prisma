import { T, type LevelData } from '../levels/LevelBuilder';

/** Find the first ground-supported surface, not the highest isolated ledge.
 * The local footing requires two solid rows; a wide prop also needs level
 * support on both neighboring cells. This is a visual-only placement rule. */
export function groundedDecorRow(level:Pick<LevelData,'cols'|'rows'|'tiles'>,col:number,wide=false):number{
  if(col<1||col>=level.cols-1)return -1;
  const at=(c:number,r:number)=>level.tiles[r]?.[c];
  for(let r=1;r<level.rows-1;r++){
    const support=(c:number)=>at(c,r-1)===T.Empty&&at(c,r)===T.Solid&&at(c,r+1)===T.Solid;
    if(support(col)&&(!wide||(support(col-1)&&support(col+1))))return r;
  }
  return -1;
}
