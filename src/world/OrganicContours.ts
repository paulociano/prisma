import type { Contact, VisualGeometry } from './VisualGeometry';

/** An artistic boundary, not a collision curve. World-space coordinates and
 * deterministic cubic interpolation keep the profile invariant across crops. */
export interface OrganicContour {
  readonly axis:'top'|'wall'; readonly from:Contact; readonly to:Contact;
  readonly side:-1|1; readonly maxOffset:number;
}
export const CONTOUR_PAD=18;
const smooth=(t:number)=>t*t*(3-2*t);
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const noise=(i:number,seed:number)=>{const v=Math.sin(i*127.1+seed*311.7)*43758.5453;return v-Math.floor(v);};
export function contourOffset(q:OrganicContour,world:number):number{
  const axis=q.axis==='top'?0:1;
  const start=q.from[axis],end=q.to[axis];
  if(world<=start||world>=end)return 0;
  const step=q.axis==='top'?46:39;
  const seed=q.from[1-axis]*.017+q.side*13;
  const i=Math.floor(world/step),u=smooth(world/step-i);
  const shape=noise(i,seed)*(1-u)+noise(i+1,seed)*u;
  const taper=smooth(clamp(Math.min(world-start,end-world)/24));
  return q.maxOffset*(.22+.78*shape)*taper;
}
/** Merge wall paint budgets into a single edge. A real corner ends a curve;
 * a five-row texture budget or a chunk cut must not end it. */
export function planOrganicContours(geometry:VisualGeometry):readonly OrganicContour[]{
  const out:OrganicContour[]=geometry.surfaces.map(q=>({axis:'top',from:q.from,to:q.to,side:-1,maxOffset:7}));
  for(const w of geometry.walls){
    const prev=out[out.length-1];
    if(prev?.axis==='wall'&&prev.side===w.side&&prev.to[0]===w.from[0]&&prev.to[1]===w.from[1]){
      out[out.length-1]={...prev,to:w.to};
    }else out.push({axis:'wall',from:w.from,to:w.to,side:w.side,maxOffset:CONTOUR_PAD});
  }
  return out;
}
