import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root='.debug/shots';
const files=async mode=>(await fs.readdir(path.join(root,mode))).filter(n=>/^1-[1-4]_c\d+\.png$/.test(n)).sort();
const base=await files('baseline'),organic=await files('organic');
if(!base.length||JSON.stringify(base)!==JSON.stringify(organic))throw Error('Capture pairs are incomplete');
const out=path.join(root,'review');
await fs.mkdir(out,{recursive:true});
const width=640, height=360, gutter=16, header=72,row=396, totalWidth=width*2+gutter*3;
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
for(const id of ['1-1','1-2','1-3','1-4']){
  const names=base.filter(n=>n.startsWith(id+'_'));
  if(!names.length)throw Error('No capture pairs for '+id);
  const h=header+names.length*row+gutter;
  const labels=['<svg xmlns="http://www.w3.org/2000/svg" width="'+totalWidth+'" height="'+h+'"><rect width="100%" height="100%" fill="#201b2b"/><g font-family="sans-serif" fill="#f2e5d4"><text x="16" y="26" font-size="21">PRISMA | '+id+' | '+names.length+' pares</text><text x="16" y="53" font-size="15">ORIGINAL</text><text x="'+(width+gutter*2)+'" y="53" font-size="15">ORGÂNICO</text>'];
  const overlays=[];
  for(const [i,n] of names.entries()){
    const y=header+i*row;
    labels.push('<text x="16" y="'+(y+height+22)+'" font-size="14">'+escape(n.replace('.png',''))+'</text>');
    for(const [j,mode] of ['baseline','organic'].entries()){
      const input=await sharp(path.join(root,mode,n)).resize(width,height,{fit:'contain',background:'#201b2b'}).png().toBuffer();
      overlays.push({input,left:gutter+j*(width+gutter),top:y});
    }
  }
  labels.push('</g></svg>');
  await sharp(Buffer.from(labels.join(''))).composite(overlays).jpeg({quality:88}).toFile(path.join(out,id+'-comparison.jpg'));
}
await fs.writeFile(path.join(out,'index.json'),JSON.stringify({pairs:base.length,levels:['1-1','1-2','1-3','1-4'],note:'Capturas determinísticas, cor completa; não são playtest nem aprovação artística.'},null,2));
console.log('Generated comparison sheets:',base.length,'pairs');
