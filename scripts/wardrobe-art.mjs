// Provisional palette and embroidered reward marks, on existing atlas frames.
export function decorateAtlas(pixels,width,height,frames,stage){
 const palette=[[212,85,91],[205,120,65],[218,174,70],[77,151,101],[57,157,166],[104,117,203],[159,97,196]];
 const badges=[[255,101,115],[255,166,79],[255,220,94],[112,221,125],[88,225,224],[132,147,255],[213,154,255]];
 if(!Number.isInteger(stage)||stage<1||stage>7)throw Error("invalid wardrobe stage");
 const out=new Uint8Array(pixels);let changed=0,decoratedFrames=0;
 const clamp=x=>Math.max(0,Math.min(255,Math.round(x)));
 for(const value of Object.values(frames)){
  const {x:fx,y:fy,w,h}=value.frame;
  if(fx<0||fy<0||fx+w>width||fy+h>height)throw Error("invalid frame");
  const mask=new Uint8Array(w*h);const eligible=i=>{
   const p=((fy+Math.floor(i/w))*width+fx+i%w)*4;
   const r=pixels[p],g=pixels[p+1],b=pixels[p+2];
   // Conservative yellow-fabric selection; reject warm brown/orange skin and near-white scarf.
   return pixels[p+3]>=200&&r>=110&&g>=95&&g>=r*.86&&g<=r*1.12&&b<=g*.68&&g-b>=35;
  };
  for(let i=0;i<mask.length;i++)if(eligible(i))mask[i]=1;
  let best=[];const visited=new Uint8Array(mask.length);
  for(let i=0;i<mask.length;i++){
   if(!mask[i]||visited[i])continue;
   const component=[i];visited[i]=1;
   for(let k=0;k<component.length;k++){
    const j=component[k],x=j%w,y=Math.floor(j/w);
    for(const n of [x>0?j-1:-1,x<w-1?j+1:-1,y>0?j-w:-1,y<h-1?j+w:-1])if(n>=0&&mask[n]&&!visited[n]){visited[n]=1;component.push(n);}
   }
   if(component.length>best.length)best=component;
  }
  if(best.length<Math.max(40,w*h*.003))continue;
  decoratedFrames++;
  let mx=0,my=0;for(const j of best){mx+=j%w;my+=Math.floor(j/w);}mx/=best.length;my/=best.length;
  const chosen=new Uint8Array(w*h);for(const j of best)chosen[j]=1;
  const target=palette[stage-1];
  for(const j of best){
   const x=j%w,y=Math.floor(j/w),p=((fy+y)*width+fx+x)*4;
   const luminance=(pixels[p]*.213+pixels[p+1]*.715+pixels[p+2]*.072)/178;
   // Keep existing shading and detail rather than tinting the entire hero.
   for(let c=0;c<3;c++)out[p+c]=clamp(target[c]*luminance);
   changed++;
  }
  // Seven collectible-colored embroidery studs, clipped to the same garment.
  // This is a provisional emblem, not geometry for individual garments.
  const radius=Math.max(1,Math.min(4,Math.floor(Math.sqrt(best.length)/11)));
  for(let k=0;k<stage;k++){
   const angle=2*Math.PI*k/7-Math.PI/2,cx=Math.round(mx+Math.cos(angle)*radius*2.7),cy=Math.round(my+Math.sin(angle)*radius*2.7);
   for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
    const x=cx+dx,y=cy+dy;if(x<0||x>=w||y<0||y>=h||!chosen[y*w+x]||dx*dx+dy*dy>radius*radius)continue;
    const p=((fy+y)*width+fx+x)*4;for(let c=0;c<3;c++)out[p+c]=clamp(badges[k][c]*(dy<0?1.08:.88));
   }
  }
 }
 return {pixels:out,changed,decoratedFrames};
}
