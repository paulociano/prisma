import fs from 'node:fs';
import assert from 'node:assert/strict';
const manifest=JSON.parse(fs.readFileSync('public/assets/manifest.json','utf8'));
const entries=new Map(manifest.sprites.map(s=>[s.key,s]));
for(let w=1;w<=7;w++){
 for(const kind of ['outro',...(w<7?['reward','transition']:[])]){
  const raw=`assets/raw/cutscenes/w${w}_${kind}.png`;
  if(!fs.existsSync(raw)){console.warn('Optional cutscene missing: '+raw);continue;}
  const entry=entries.get(`cs_w${w}_${kind}`);
  assert.ok(entry,raw+' not in manifest');
  assert.ok(fs.existsSync('public/assets/'+entry.file),raw+' output missing');
 }
}
console.log('Uploaded world cutscenes registered in manifest');
