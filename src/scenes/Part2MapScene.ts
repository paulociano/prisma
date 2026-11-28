import Phaser from 'phaser';
import {GAME_W,GAME_H} from '../config';
import {has} from '../gfx/art';
import {button,textStyle} from '../gfx/ui';
import {playMusic,playSfx} from '../systems/Audio';
import {loadSave} from '../systems/Save';
import {ensureWorld} from '../systems/Loader';
import {applyColorblind} from '../systems/Settings';
import {REGIONS,loadPart2,hasInsignia,part2Unlocked} from '../world/Part2';
import {pilotArtReady} from './Part2PilotScene';

export class Part2MapScene extends Phaser.Scene{
 constructor(){super('Part2Map');}
 create(){
  if(!part2Unlocked(loadSave())){this.scene.start('Map');return;}
  applyColorblind(this);
  const progress=loadPart2();
  let selected=0,leaving=false,collection=false;
  this.add.rectangle(0,0,GAME_W,GAME_H,0x17132c).setOrigin(0);
  const art=has(this,'world_map_part2');
  if(art){
   const img=this.add.image(GAME_W/2,265,'world_map_part2');
   img.setScale(Math.min(1200/img.width,485/img.height));
  }
  this.add.rectangle(0,0,GAME_W,76,0x17132c,.92).setOrigin(0);
  this.add.text(28,17,'PRISMA II · Além do Espectro',textStyle(30));
  const status=this.add.text(GAME_W-25,20,'',textStyle(22)).setOrigin(1,0);
  status.setText('Memórias '+progress.completedWorlds.length+'/7');
  const detail=this.add.rectangle(0,493,GAME_W,227,0x17132c,.96).setOrigin(0);
  const title=this.add.text(GAME_W/2,518,'',textStyle(27)).setOrigin(.5);
  const desc=this.add.text(GAME_W/2,551,'',textStyle(19,'#ddd1f2')).setOrigin(.5);
  const cards:Phaser.GameObjects.Rectangle[]=[];
  const labels:Phaser.GameObjects.Text[]=[];
  for(const [i,r] of REGIONS.entries()){
   const x=100+i*180;
   const card=this.add.rectangle(x,465,166,52,0x29233d,.96).setStrokeStyle(2,r.color);
   card.setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(!collection)select(i);});
   cards.push(card);
   labels.push(this.add.text(x,465,'Mundo '+r.id,textStyle(20)).setOrigin(.5));
  }
  const back=button(this,180,655,290,'Mapa da Parte 1',()=>exit('Map'));
  const collect=button(this,540,655,350,'Memórias do Espectro',()=>showCollection(!collection));
  const enter=button(this,1020,655,420,'Explorar rota de teste',()=>open());
  const collectionObjects:Phaser.GameObjects.GameObject[]=[];
  const select=(i:number)=>{
   selected=(i+REGIONS.length)%REGIONS.length;
   const r=REGIONS[selected];cards.forEach((c,j)=>c.setFillStyle(j===selected?0x6d518b:0x29233d));
   title.setText(r.id+' · '+r.name);
   const ready=pilotArtReady(this);
   desc.setText(r.id===8?(ready?(progress.pilotCleared?'Rota de teste concluída · Jogar novamente':'Rota de teste disponível · cenário provisório'):'Rota de teste indisponível · faltam atlas válidos'):'Em desenvolvimento · '+r.theme);
   enter.root.setVisible(r.id===8&&ready&&!collection);
  };
  const showCollection=(on:boolean)=>{
   collection=on;
   collectionObjects.splice(0).forEach(o=>o.destroy());
   detail.setVisible(!on);title.setVisible(!on);desc.setVisible(!on);
   cards.forEach(c=>c.setVisible(!on));labels.forEach(t=>t.setVisible(!on));
   enter.root.setVisible(false);
   (collect.root.list[1] as Phaser.GameObjects.Text).setText(on?'Voltar ao mapa II':'Memórias do Espectro');
   if(!on){select(selected);return;}
   collectionObjects.push(this.add.rectangle(GAME_W/2,333,1220,460,0x17132c,.98).setStrokeStyle(2,0xa38ac7));
   collectionObjects.push(this.add.text(GAME_W/2,132,'Memórias do Espectro · '+progress.completedWorlds.length+'/7',textStyle(32)).setOrigin(.5));
   for(const [i,r] of REGIONS.entries()){
    const x=100+i*180,y=280,earned=hasInsignia(progress,r.id),key='part2_insignia_'+r.id;
    if(has(this,key)){
     const img=this.add.image(x,y,key);img.setScale(Math.min(130/img.width,130/img.height)).setAlpha(earned?1:.25);
     if(!earned)img.setTint(0x858092);
     collectionObjects.push(img);
    }else collectionObjects.push(this.add.circle(x,y,50,r.color,earned?1:.2));
    collectionObjects.push(this.add.text(x,365,r.insignia,textStyle(19)).setOrigin(.5));
    collectionObjects.push(this.add.text(x,398,earned?'Conquistada':'Bloqueada',textStyle(16)).setOrigin(.5));
   }
   collectionObjects.push(this.add.text(GAME_W/2,486,'Insígnias são troféus da restauração de cada mundo. Não modificam o uniforme.',textStyle(20)).setOrigin(.5));
  };
  const exit=(target:string)=>{if(leaving)return;leaving=true;this.scene.start(target);};
  const open=()=>{if(collection||selected!==0||!pilotArtReady(this))return;playSfx(this,'part2_portal',0);exit('Part2Pilot');};
  const kb=this.input.keyboard!;
  kb.on('keydown-LEFT',()=>{if(!collection)select(selected-1);});
  kb.on('keydown-RIGHT',()=>{if(!collection)select(selected+1);});
  kb.on('keydown-ENTER',open);
  kb.on('keydown-B',()=>showCollection(!collection));
  kb.on('keydown-ESC',()=>collection?showCollection(false):exit('Map'));
  const pad=(_p:Phaser.Input.Gamepad.Gamepad,b:Phaser.Input.Gamepad.Button)=>{
   if(b.index===14&&!collection)select(selected-1);
   if(b.index===15&&!collection)select(selected+1);
   if(b.index===0)open();if(b.index===1)collection?showCollection(false):exit('Map');if(b.index===2)showCollection(!collection);
  };
  this.input.gamepad?.on('down',pad);
  this.events.once('shutdown',()=>this.input.gamepad?.off('down',pad));
  select(0);playMusic(this,'map_part2');this.cameras.main.fadeIn(300);
 }
}

/** Explicit chapter transition, lazy-loading the shared pack only after consent to enter. */
export function enterPart2(scene:Phaser.Scene){
 if(!part2Unlocked(loadSave())||scene.data.get('part2Entering'))return;
 scene.data.set('part2Entering',true);
 scene.events.once('shutdown',()=>scene.data.set('part2Entering',false));
 ensureWorld(scene,8,()=>scene.scene.start('Part2Map'));
}
