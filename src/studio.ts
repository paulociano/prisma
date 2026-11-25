import { TILE } from './config';
import { LEVELS, LEVEL_META } from './levels';
import { T } from './levels/LevelBuilder';
import { artChunks, tilePolygon, exposedWallRuns, type ArtChunk } from './levels/ArtGeometry';

const el = <K extends HTMLElement>(id: string) => document.getElementById(id) as K;
const levelSelect = el<HTMLSelectElement>('level'), chunkSelect = el<HTMLSelectElement>('chunk');
const scaleSelect = el<HTMLSelectElement>('scale'), mode = el<HTMLSelectElement>('mode');
const canvas = el<HTMLCanvasElement>('map');
const grid = el<HTMLInputElement>('grid'), entities = el<HTMLInputElement>('entities'), bounds = el<HTMLInputElement>('bounds');
const colors: Record<number,string> = {1:'#8b9bb1',2:'#63d5cd',3:'#f06a80',4:'#d5b8ff',5:'#d5b8ff',6:'#d5b8ff',7:'#d5b8ff'};
const palettes = ['#af5269','#bc7853','#bfa45b','#53866c','#419c9e','#7879b5','#84738e'];
let level = LEVELS[2]();
let chunks = artChunks(level);
for (const l of LEVEL_META) levelSelect.add(new Option(l.id+' • '+l.name, String(l.index)));
levelSelect.value = '2';
function refresh() {
  level = LEVELS[Number(levelSelect.value)]();
  chunks = artChunks(level);
  chunkSelect.replaceChildren(new Option('Fase inteira','all'));
  for (const ch of chunks) chunkSelect.add(new Option(ch.id+' | colunas '+ch.c0+'–'+(ch.c1-1),ch.id));
  render();
}
function region(): ArtChunk {
  return chunks.find(ch=>ch.id===chunkSelect.value) ?? {id:'full',c0:0,c1:level.cols,x:0,y:0,width:level.cols*TILE,height:level.rows*TILE};
}
function draw(target: HTMLCanvasElement, ch: ArtChunk, requested: number) {
  const s = Math.min(requested, 16384/ch.width, 8192/ch.height, Math.sqrt(16000000/(ch.width*ch.height)));
  target.width = Math.max(1,Math.floor(ch.width*s)); target.height = Math.max(1,Math.floor(ch.height*s));
  const g=target.getContext('2d'); if(!g) throw new Error('Canvas 2D indisponível');
  g.scale(s,s); g.translate(-ch.x,0);
  const organic=mode.value==='organic';
  const base=palettes[level.world-1] ?? '#af5269';
  const gradient=g.createLinearGradient(0,0,0,ch.height);
  gradient.addColorStop(0,organic?'#35283f':'#1b1927');gradient.addColorStop(1,organic?'#6e5064':'#272735');
  g.fillStyle=gradient;g.fillRect(ch.x,0,ch.width,ch.height);
  for(let r=0;r<level.rows;r++) for(let c=ch.c0;c<ch.c1;c++){
    const t=level.tiles[r][c];const pts=tilePolygon(t,c,r);if(!pts.length)continue;
    g.beginPath();for(const [i,[x,y]] of pts.entries())i?g.lineTo(x,y):g.moveTo(x,y);g.closePath();
    g.fillStyle=organic&&t===T.Solid?base:colors[t]??'#999';g.fill();
    if(organic&&t===T.Solid&&(r===0||level.tiles[r-1][c]===T.Empty)){
      const x=c*TILE,y=r*TILE;g.strokeStyle='#dfbd79';g.lineWidth=8;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+TILE/2,y-8*Math.sin(c*2.31),x+TILE,y);g.stroke();
    }
  }
  if(organic){
    g.strokeStyle='#53374b';g.lineWidth=9;
    for(const run of exposedWallRuns(level))if(run.col>=ch.c0&&run.col<ch.c1){
      const x=(run.col+(run.side==='right'?1:0))*TILE,y=run.r0*TILE, h=(run.r1-run.r0+1)*TILE;
      g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+(run.side==='left'?13:-13),y+h*.25,x+(run.side==='left'?4:-4),y+h*.75,x,y+h);g.stroke();
    }
  }
  if(grid.checked){g.strokeStyle='#ffffff22';g.lineWidth=1/s;g.beginPath();for(let c=ch.c0;c<=ch.c1;c++){g.moveTo(c*TILE,0);g.lineTo(c*TILE,ch.height)}for(let r=0;r<=level.rows;r++){g.moveTo(ch.x,r*TILE);g.lineTo(ch.x+ch.width,r*TILE)}g.stroke();}
  if(bounds.checked){g.strokeStyle='#ffffff80';g.lineWidth=1/s;g.setLineDash([5/s,5/s]);for(const q of chunks){if(q.c0<=ch.c0||q.c0>=ch.c1)continue;g.beginPath();g.moveTo(q.x,0);g.lineTo(q.x,ch.height);g.stroke();}g.setLineDash([]);}
  if(entities.checked)for(const e of level.entities){if(e.col<ch.c0||e.col>=ch.c1)continue;const x=(e.col+.5)*TILE,y=(e.row+.5)*TILE;const special=['player','exit','checkpoint','shard','boss','chest','guardian','mover','colorgate'].includes(e.type);g.fillStyle=e.type==='player'?'#aef0b2':e.type==='shard'?'#f4a7ff':e.type==='exit'?'#9cf4e2':'#f4c76e';g.beginPath();g.arc(x,y,special?13:6,0,Math.PI*2);g.fill();if(special&&s>=.24){g.font='20px system-ui';g.fillStyle='#fff';g.fillText(e.type,x+15,y-12);}}
  return s;
}
function render(){const ch=region(),s=draw(canvas,ch,Number(scaleSelect.value));el('info').textContent=level.id+' • '+level.name+' | '+level.cols+' × '+level.rows+' blocos | '+level.cols*TILE+' × '+level.rows*TILE+' px | '+chunks.length+' trechos | '+Math.round(s*100)+'%';}
function download(blob: Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);el('message').textContent='Exportado: '+name;}
function data(l:ReturnType<typeof LEVELS[number]>){return {schema:1,tileSize:TILE,level:l,chunks:artChunks(l),walls:exposedWallRuns(l)};}
function json(o:unknown,name:string){download(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}),name);}
levelSelect.addEventListener('change',refresh);
for(const control of [chunkSelect,scaleSelect,mode,grid,entities,bounds])control.addEventListener('change',render);
el('png').addEventListener('click',()=>{const out=document.createElement('canvas'),ch=region();const s=draw(out,ch,1);out.toBlob(b=>{if(b)download(b,level.id+'_'+ch.id+'_'+mode.value+'.png');else el('message').textContent='Não foi possível exportar o PNG.';},'image/png');if(s<1)el('message').textContent='Imagem panorâmica reduzida para respeitar o limite de memória; exporte trechos para 100%.';});
el('json').addEventListener('click',()=>json(data(level),level.id+'_art-map.json'));
el('all').addEventListener('click',()=>json(LEVELS.map(build=>data(build())),'prisma_all_art_maps.json'));
refresh();
