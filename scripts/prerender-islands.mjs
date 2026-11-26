// Offline 3D mesh -> orthographic RGBA sprite. No GPU, API or runtime 3D engine.
export const ISLAND_SEEDS=[42,125,785];
export function renderIsland(seed){
 const W=448,H=240,S=2,w=W*S,h=H*S;
 const buf=new Uint8Array(w*h*4),zbuf=new Float32Array(w*h);zbuf.fill(-Infinity);
 const rand=(i,j)=>{let a=Math.imul((i+13)^seed,0x45d9f3b)^Math.imul(j+91,0x27d4eb2d);a=Math.imul(a^(a>>>16),0x45d9f3b);return ((a^(a>>>16))>>>0)/4294967295;};
 const clamp=(x,l,h)=>Math.max(l,Math.min(h,x));
 const rings=[],xs=[12,23,32,48,70,96,124,151,178,205,224,246,275,302,329,356,383,400,416,425,436];
 const profile=[[39,-55],[46,0],[48,42],[72,66],[101,75],[136,64],[171,48],[194,17],[208,-14],[173,-45],[112,-70],[65,-65]];
 for(let i=0;i<xs.length;i++){
  const x=xs[i],edge=Math.min(1,Math.min(x-12,436-x)/20),taper=.34+.66*edge;
  rings.push(profile.map(([y,z],j)=>{
    const ry=(j===1?0:(rand(i,j)-.5)*(j<3?8:20))*edge;
    return [x,48+(y-48)*taper+ry,z*taper+(rand(i,j+20)-.5)*10*edge];
  }));
 }
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const sub=(a,b)=>a.map((v,j)=>v-b[j]);const dot=(a,b)=>a.reduce((s,v,j)=>s+v*b[j],0);
 const norm=a=>{let l=Math.hypot(...a);return a.map(v=>v/l);};
 const light=norm([-.46,-.72,.54]),fill=norm([.54,-.22,.71]);
 const project=([x,y,z])=>[x*S,(y+.34*z)*S,z-.34*y];
 let triangles=0;
 function tri(a,b,c,material,variation){
  let n=norm(cross(sub(b,a),sub(c,a)));
  // Orient to the exterior of the ring; caps use their explicit side.
  const center=a.map((v,j)=>(v+b[j]+c[j])/3);
  const outward=material===12?[-1,0,0]:material===13?[1,0,0]:[0,center[1]-115,center[2]];
  if(dot(n,outward)<0)n=n.map(v=>-v);
  const pa=project(a),pb=project(b),pc=project(c);
  const den=(pb[1]-pc[1])*(pa[0]-pc[0])+(pc[0]-pb[0])*(pa[1]-pc[1]);
  if(Math.abs(den)<1e-7)return;
  triangles++;
  const moss=material<3,base=moss?[82,112,64]:material===3?[107,104,78]:[91,79,105];
  const shade=.48+.72*Math.max(0,dot(n,light))+.2*Math.max(0,dot(n,fill));
  const x0=Math.max(0,Math.floor(Math.min(pa[0],pb[0],pc[0]))),x1=Math.min(w-1,Math.ceil(Math.max(pa[0],pb[0],pc[0])));
  const y0=Math.max(0,Math.floor(Math.min(pa[1],pb[1],pc[1]))),y1=Math.min(h-1,Math.ceil(Math.max(pa[1],pb[1],pc[1])));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const px=x+.5,py=y+.5,u=((pb[1]-pc[1])*(px-pc[0])+(pc[0]-pb[0])*(py-pc[1]))/den,v=((pc[1]-pa[1])*(px-pc[0])+(pa[0]-pc[0])*(py-pc[1]))/den,q=1-u-v;
   if(Math.min(u,v,q)<-1e-7)continue;
   const z=u*pa[2]+v*pb[2]+q*pc[2],i=y*w+x;if(z<=zbuf[i])continue;zbuf[i]=z;
   const wx=px/S,wy=py/S;
   const vein=Math.sin(wx*.12+Math.sin(wy*.11)*1.7+z*.05);
   const grain=(rand(Math.floor(wx*2),Math.floor(wy*2))-.5)*12;
   const relief=5*Math.sin(wx*.24+wy*.19)+4*Math.cos(wy*.43-wx*.12);
   const ao=1-.18*clamp((wy-100)/125,0,1);
   const k=shade*ao*(.90+.20*variation);
   for(let j=0;j<3;j++)buf[i*4+j]=clamp(Math.round(base[j]*k+grain+relief+(moss?5:3)*vein),0,255);
   buf[i*4+3]=255;
  }
 }
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<profile.length;j++){
  const k=(j+1)%profile.length,a=rings[i][j],b=rings[i+1][j],c=rings[i+1][k],d=rings[i][k];
  tri(a,b,c,j,rand(i,j+41));tri(a,c,d,j,rand(i,j+57));
 }
 for(const [r,m] of [[rings[0],12],[rings[rings.length-1],13]]){
  const center=r[0].map((_,j)=>r.reduce((s,p)=>s+p[j],0)/r.length);
  for(let j=0;j<r.length;j++)tri(center,r[j],r[(j+1)%r.length],m,.5);
 }
 const pixels=new Uint8Array(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  let a=0,rs=0,gs=0,bs=0;
  for(let dy=0;dy<S;dy++)for(let dx=0;dx<S;dx++){const i=((y*S+dy)*w+x*S+dx)*4;if(buf[i+3]){a++;rs+=buf[i];gs+=buf[i+1];bs+=buf[i+2];}}
  const i=(y*W+x)*4;if(a){pixels[i]=Math.round(rs/a);pixels[i+1]=Math.round(gs/a);pixels[i+2]=Math.round(bs/a);pixels[i+3]=Math.round(255*a/(S*S));}
 }
 return {width:W,height:H,pixels,triangles};
}
export function validateIsland(r){
 if(r.width!==448||r.height!==240||r.pixels.length!==448*240*4||r.triangles<100)throw Error("invalid render geometry");
 const a=(x,y)=>r.pixels[(y*r.width+x)*4+3];let n=0,total=0;
 for(let y=64;y<160;y++)for(let x=32;x<416;x++){total++;if(a(x,y)>220)n++;}
 if(n/total<.98)throw Error("opaque core "+n/total);
 if([[0,0],[447,0],[0,239],[447,239]].some(([x,y])=>a(x,y)>24))throw Error("nontransparent corner");
 for(const x of [96,224,352])for(const y of [80,112,144])if(a(x,y)<220)throw Error("missing support");
 return {coverage:n/total,triangles:r.triangles};
}
