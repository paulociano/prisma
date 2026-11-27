// Choose a populated reading-order grid from the source alpha, rather than
// assigning merged connected components to a single cell.
export function wardrobeGrid(img,primary,expected){
 const {data,w,h}=img;
 const xs=new Uint32Array(w),ys=new Uint32Array(h);
 let total=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=64){xs[x]++;ys[y]++;total++;}
 if(!total)return null;
 function boundaries(hist,count){
  const n=hist.length,step=n/count,result=[0];
  let cost=0;
  for(let i=1;i<count;i++){
   const mid=Math.round(step*i),delta=Math.floor(step*.18);
   let best=mid,bestCost=Infinity;
   for(let k=Math.max(result.at(-1)+1,mid-delta);k<=Math.min(n-1,mid+delta);k++){
    const cut=(hist[k-1]+hist[k])/2;
    const score=cut+Math.abs(k-mid)/Math.max(1,step)*Math.max(1,total/n)*.08;
    if(score<bestCost){bestCost=score;best=k;}
   }
   result.push(best);cost+=(hist[best-1]+hist[best])/2;
  }
  result.push(n);return {result,cost};
 }
 const layouts=[primary,...(expected===4?[[4,1],[1,4]]:expected===6?[[6,1],[2,3],[1,6]]:[])];
 let winner=null;
 for(const [cols,rows] of layouts){
  if(cols*rows!==expected)continue;
  const bx=boundaries(xs,cols),by=boundaries(ys,rows),cells=[],areas=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
   const x0=bx.result[c],x1=bx.result[c+1],y0=by.result[r],y1=by.result[r+1];
   let area=0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*w+x)*4+3]>=64)area++;
   areas.push(area);cells.push([x0/w,y0/h,x1/w,y1/h]);
  }
  const min=Math.min(...areas),max=Math.max(...areas);
  if(min<total/expected*.12||min<max*.08)continue;
  // Penalize actual alpha severed by seams much more than spacing variation.
  const seam=bx.cost*w/Math.max(1,total)+by.cost*h/Math.max(1,total);
  const imbalance=areas.reduce((a,v)=>a+Math.abs(v-total/expected),0)/total;
  const score=seam+imbalance*.12+(cols===primary[0]&&rows===primary[1]?0:.03);
  if(!winner||score<winner.score)winner={cells,cols,rows,score,seam,areas};
 }
 return winner;
}
