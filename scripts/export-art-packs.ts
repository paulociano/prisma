import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { LEVELS } from '../src/levels';
import { TILE } from '../src/config';
import { artChunks, focusArtChunk, tilePolygon, exposedWallRuns, cofferPlan, terrainPlatePlan, type ArtChunk } from '../src/levels/ArtGeometry';
import type { LevelData } from '../src/levels/LevelBuilder';

const root=path.resolve('.debug/art-packs');
const colors: Record<number,string>={1:'#8b9bb1',2:'#63d5cd',3:'#f06a80',4:'#d5b8ff',5:'#d5b8ff',6:'#d5b8ff',7:'#d5b8ff'};
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function svg(l:LevelData,ch:ArtChunk,anchors=true){
  const a:string[]=[];
  a.push('<svg xmlns="http://www.w3.org/2000/svg" width="'+ch.width+'" height="'+ch.height+'" viewBox="'+ch.x+' 0 '+ch.width+' '+ch.height+'">');
  a.push('<rect x="'+ch.x+'" width="'+ch.width+'" height="'+ch.height+'" fill="#1e1b2a"/>');
  for(let r=0;r<l.rows;r++)for(let c=ch.c0;c<ch.c1;c++){
    const t=l.tiles[r][c],p=tilePolygon(t,c,r);if(!p.length)continue;
    a.push('<polygon fill="'+colors[t]+'" points="'+p.map(x=>x.join(',')).join(' ')+'"/>');
  }
  for(let c=ch.c0;c<=ch.c1;c++)a.push('<path d="M'+(c*TILE)+' 0V'+ch.height+'" stroke="#ffffff" stroke-opacity=".16"/>');
  for(let r=0;r<=l.rows;r++)a.push('<path d="M'+ch.x+' '+(r*TILE)+'h'+ch.width+'" stroke="#ffffff" stroke-opacity=".16"/>');
  if(anchors)for(const e of l.entities)if(e.col>=ch.c0&&e.col<ch.c1){
    const x=(e.col+.5)*TILE,y=(e.row+.5)*TILE;
    a.push('<circle cx="'+x+'" cy="'+y+'" r="8" fill="#f4c76e"/>');
    if(['chest','shard','checkpoint','player','exit','mover','colorgate','guardian','boss'].includes(e.type))
      a.push('<text x="'+(x+10)+'" y="'+(y-10)+'" fill="#fff" font-family="sans-serif" font-size="18">'+esc(e.type)+'</text>');
  }
  return a.join('')+'</svg>';
}
async function writeGuide(l:LevelData,ch:ArtChunk,dir:string,png:boolean){
  const data=svg(l,ch);
  await fs.writeFile(path.join(dir,ch.id+'.svg'),data);
  if(png)await sharp(Buffer.from(data)).resize({width:Math.min(ch.width,4096),withoutEnlargement:true}).png().toFile(path.join(dir,ch.id+'.png'));
}
/** Exact 2x coffer template for the asset ingestion contract. Mask is a guide, not final art. */
async function writeCofferGuide(l:LevelData,dir:string){
  const plan=cofferPlan(l);if(!plan)return;
  const w=832,h=704,pad=96,tile=128;
  const cells=Array.from(plan.cells).map(i=>({c:i%l.cols-plan.col,r:Math.floor(i/l.cols)-plan.row}));
  const blocks=cells.map(({c,r})=>'<rect x="'+(pad+c*tile)+'" y="'+(pad+r*tile)+'" width="128" height="128" fill="#ffffff"/>').join('');
  const header='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">';
  await sharp(Buffer.from(header+blocks+'</svg>')).png().toFile(path.join(dir,'coffer-mask.png'));
  const lines='<path d="M96 96H608 M224 480H736" stroke="#f7ce68" stroke-width="5" fill="none"/><path d="M224 224H608V480H224Z" stroke="#56e3cf" stroke-width="3" stroke-dasharray="9 7" fill="none"/>';
  const guide=header+'<rect width="832" height="704" fill="#302a3b"/><g opacity=".6">'+blocks+'</g>'+lines+
    '<g font-family="sans-serif" font-size="20" fill="#fff"><text x="16" y="40">PRISMA / coffer 2x · 832 × 704</text><text x="245" y="360">Vão transparente</text><text x="244" y="466">Superfície jogável</text></g></svg>';
  await fs.writeFile(path.join(dir,'coffer-guide.svg'),guide);
  await sharp(Buffer.from(guide)).png().toFile(path.join(dir,'coffer-guide.png'));
  await fs.writeFile(path.join(dir,'coffer-placement.json'),JSON.stringify({schema:1,level:l.id,asset:'assets/raw/w1/organic/coffer.png',width:w,height:h,scale:.5,origin:{x:plan.col*TILE-48,y:plan.row*TILE-48},cells,contactLines:[{x0:96,x1:608,y:96},{x0:224,x1:736,y:480}],clearArea:{x:250,y:250,width:215,height:180}},null,2));
}
/** Export terrain-only masks at exact world scale, with a cropped vertical
 * envelope. Empty space, hazards, one-way platforms and entities remain open.
 * Internal chunk boundaries are exact; margin is vertical only to avoid
 * painting duplicate pixels into neighboring chunks. */
async function writeTerrainPlate(l:LevelData,ch:ArtChunk,dir:string){
  const plan=terrainPlatePlan(l,ch);if(!plan)return;
  const {polygons,y:y0,width,height}=plan;
  const base=ch.id+'-terrain';
  const header='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="'+ch.x+' '+y0+' '+width+' '+height+'">';
  const shapes=polygons.map(p=>'<polygon fill="#fff" points="'+p.map(v=>v.join(',')).join(' ')+'"/>').join('');
  await sharp(Buffer.from(header+shapes+'</svg>')).png().toFile(path.join(dir,base+'-mask.png'));
  await fs.writeFile(path.join(dir,base+'-placement.json'),JSON.stringify({
    schema:1,level:l.id,chunk:ch.id,asset:'assets/raw/w1/organic/terrain/'+l.id+'/'+ch.id+'.png',
    x:ch.x,y:y0,width,height,scale:1,mask:base+'-mask.png',replaceable:plan.replaceable,
    contract:'Terrain only. Exact solid and ramp coverage. Transparent gaps; no background, one-way, hazards or dynamic entities. Neighboring chunk edges must match.'
  },null,2));
}
async function main(){
  await fs.mkdir(root,{recursive:true});
  const index=[];
  for(const build of LEVELS){
    const l=build(),dir=path.join(root,l.id),chunks=artChunks(l);
    await fs.mkdir(dir,{recursive:true});
    const full:ArtChunk={id:'full',c0:0,c1:l.cols,x:0,y:0,width:l.cols*TILE,height:l.rows*TILE};
    const chest=l.entities.find(e=>e.type==='chest');
    const focus=chest?focusArtChunk(l,chest.col+2):undefined;
    await fs.writeFile(path.join(dir,'map.json'),JSON.stringify({schema:1,tileSize:TILE,level:l,chunks,walls:exposedWallRuns(l),focus},null,2));
    await writeGuide(l,full,dir,true);
    if(l.world===1){
      if(l.id==='1-3')await writeCofferGuide(l,dir);
      for(const ch of chunks){await writeGuide(l,ch,dir,true);if(!l.arena)await writeTerrainPlate(l,ch,dir);}
      if(focus){
        await writeGuide(l,focus,dir,true);
        await fs.writeFile(path.join(dir,'focus-brief.md'),[
          '# PRISMA: Ponte das Raízes / cofre suspenso',
          'Referência: focus.png (grade e âncoras) + direção artística aprovada pelo usuário.',
          'Origem no mundo: x='+focus.x+', y=0; dimensões: '+focus.width+' × '+focus.height+' px.',
          'Criar somente terreno estático em PNG transparente, vista lateral com volume, rocha irregular, raízes curvas, musgo e flores rubras, luz quente.',
          'Preservar o contato de todas as superfícies, a abertura do cofre, perigos e plataformas móveis. Não pintar personagens, moedas, baús, portões, espinhos, HUD nem fundo.',
          'A referência é técnica; a imagem final será revisada contra a geometria antes de integrar.'
        ].join('\n'));
      }
    }
    index.push({id:l.id,name:l.name,cols:l.cols,rows:l.rows,chunks:chunks.length,focus});
  }
  await fs.writeFile(path.join(root,'index.json'),JSON.stringify(index,null,2));
  console.log('Art packs: '+index.length+' fases');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
