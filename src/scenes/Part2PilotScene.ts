import Phaser from 'phaser';
import {GAME_W,GAME_H,PHYS} from '../config';
import {Player} from '../objects/Player';
import {Controls} from '../systems/Controls';
import {TouchControls} from '../systems/Touch';
import {has} from '../gfx/art';
import {button,textStyle} from '../gfx/ui';
import {playMusic,playSfx,isMuted,toggleMute} from '../systems/Audio';
import {applyColorblind,getSettings} from '../systems/Settings';
import {closeCameraZoom} from '../world/CloseCamera';
import {loadSave} from '../systems/Save';
import {loadPart2,writePart2,finishPilot,part2Unlocked} from '../world/Part2';

const REQUIRED:Record<string,number>={idle:4,run:6,jump:6,attack:6,hurt_win:6,doublejump:6,dash:6,glide:6,wall:6,swim:6,shoot:6,pound_air:4,pound_land:2};
export function pilotArtReady(scene:Phaser.Scene){
 const valid=(key:string,count:number)=>has(scene,key)&&Array.from({length:count},(_,i)=>String(i)).every(f=>scene.textures.get(key).has(f));
 return Object.entries(REQUIRED).every(([n,count])=>valid('part2_iris_'+n,count))&&has(scene,'w8_bg_far')&&valid('w8_enemy',6)&&valid('w8_enemy_alt',6);
}
type Foe={view:Phaser.GameObjects.Sprite;x:number;y:number;air:boolean;restored:boolean};
type Shot={view:Phaser.GameObjects.Arc;dir:number;life:number};
export class Part2PilotScene extends Phaser.Scene{
 player!:Player;
 private controls!:Controls;
 private foes:Foe[]=[];
 private shots:Shot[]=[];
 private terrain!:Phaser.Physics.Arcade.StaticGroup;
 private bg?:Phaser.GameObjects.TileSprite;
 private checkpoint=false;
 private complete=false;
 private saved=true;
 private ambience?:Phaser.Sound.BaseSound;
 private glide?:Phaser.Sound.BaseSound;
 private wasGliding=false;
 private t=0;
 constructor(){super('Part2Pilot');}
 create(){
  if(!part2Unlocked(loadSave())||!pilotArtReady(this)){this.scene.start('Part2Map');return;}
  applyColorblind(this);this.foes=[];this.shots=[];this.complete=false;this.checkpoint=false;this.saved=true;this.t=0;this.wasGliding=false;
  const width=3456;
  this.physics.world.setBounds(0,0,width,1300);
  this.physics.world.setBoundsCollision(true,true,false,false);
  const zoom=closeCameraZoom(GAME_H),cam=this.cameras.main;
  cam.setZoom(zoom).setBounds(0,0,width,GAME_H);
  this.bg=this.add.tileSprite(GAME_W/2,GAME_H/2,GAME_W,GAME_H,'w8_bg_far').setDepth(-5).setScrollFactor(0);
  this.terrain=this.physics.add.staticGroup();
  const slab=(left:number,top:number,w:number,h:number)=>{
   const s=this.terrain.create(left+w/2,top+h/2,'pixel') as Phaser.Physics.Arcade.Sprite;
   s.setDisplaySize(w,h).setTint(0x7fb8cf).setDepth(1).refreshBody();
   this.add.rectangle(left+w/2,top+5,w,10,0xe5f7ff).setDepth(2);
  };
  slab(0,640,800,80);slab(940,640,820,80);slab(1920,640,1536,80);
  slab(500,500,190,24);slab(1150,490,180,24);slab(1470,405,190,24);slab(2230,490,200,24);
  this.add.rectangle(1710,565,16,150,0xebe8ff).setDepth(3);
  this.add.text(1710,485,'✦',textStyle(30,'#c6f4ff')).setOrigin(.5);
  this.add.rectangle(3260,565,76,150,0x9de7f5,.55).setStrokeStyle(4,0xffffff);
  this.add.text(3260,468,'SAÍDA',textStyle(19)).setOrigin(.5);
  this.player=new Player(this,150,594,'part2_');
  const p=this.player;p.canDoubleJump=p.canDash=p.canWallJump=p.canGlide=p.canShoot=p.canPound=true;p.hp=p.maxHp=4;
  this.physics.add.collider(p.hit,this.terrain);
  cam.startFollow(p.hit,true,.10,.10,0,35);
  this.controls=new Controls(this);
  const spawn=(x:number,y:number,air:boolean)=>{
   const key=air?'w8_enemy_alt':'w8_enemy';
   const view=this.add.sprite(x,y,key,'0').setDepth(5);
   view.setScale((air?62:66)/view.height).setOrigin(.5,air?.5:1);
   const anim=key+'-move';if(this.anims.exists(anim))view.play(anim);
   this.foes.push({x,y,air,view,restored:false});
  };
  spawn(640,640,false);spawn(1280,435,true);spawn(2440,640,false);spawn(2810,470,true);
  const on=(event:string,fn:()=>void)=>{this.events.on(event,fn);this.events.once('shutdown',()=>this.events.off(event,fn));};
  on('player-jump',()=>playSfx(this,'jump'));on('player-doublejump',()=>playSfx(this,'double_jump'));
  on('player-land',()=>playSfx(this,'land'));on('player-dash',()=>playSfx(this,'staff_dash'));
  on('player-hurt',()=>playSfx(this,'hurt',0));
  on('player-attack',()=>{playSfx(this,'staff_extend',0);playSfx(this,'staff_attack',0);for(const f of this.foes)if((f.view.x-p.hit.x)*p.facing>-25&&Math.abs(f.view.x-p.hit.x)<145&&Math.abs(this.foeY(f)-p.hit.y)<90)this.restore(f);this.time.delayedCall(260,()=>playSfx(this,'staff_retract',0));});
  on('player-shoot',()=>{playSfx(this,'staff_shoot',0);this.shots.push({view:this.add.circle(p.hit.x+45*p.facing,p.hit.y,12,0xc7f4ff).setStrokeStyle(3,0xd0a4fc).setDepth(8),dir:p.facing,life:1.2});});
  on('player-pound',()=>{playSfx(this,'staff_pound',0);for(const f of this.foes)if(Math.abs(f.view.x-p.hit.x)<125&&Math.abs(this.foeY(f)-p.hit.y)<120)this.restore(f);});
  this.events.once('shutdown',()=>{this.stopLoops();this.scene.stop('Part2Hud');});
  this.scene.launch('Part2Hud');
  playMusic(this,'w8');
  cam.fadeIn(400);
 }
 private foeY(f:Foe){return f.view.y-(f.air?0:32);}
 private restore(f:Foe){
  if(f.restored)return;f.restored=true;f.view.anims.stop();
  if(f.view.texture.has('5'))f.view.setFrame('5');
  else f.view.setTint(0xb3f5e5);
  playSfx(this,'staff_hit',0);playSfx(this,'dissonance_restored',0);
 }
 private stopLoops(){for(const s of [this.ambience,this.glide])if(s){s.stop();s.destroy();}this.ambience=this.glide=undefined;}
 private syncLoops(){
  const v=isMuted()?0:getSettings().sfxVol/100;
  if(!this.sound.locked&&!this.ambience&&this.cache.audio.exists('sfx_ambient_w8_loop')){
   this.ambience=this.sound.add('sfx_ambient_w8_loop',{loop:true,volume:.16*v});this.ambience.play();
  }
  if(this.ambience)(this.ambience as Phaser.Sound.WebAudioSound).setVolume(.16*v);
  if(this.player.gliding&&!this.wasGliding){
   playSfx(this,'staff_extend',0);
   if(!this.sound.locked&&this.cache.audio.exists('sfx_staff_glide_loop')){this.glide=this.sound.add('sfx_staff_glide_loop',{loop:true,volume:.22*v});this.glide.play();}
  }
  if(!this.player.gliding&&this.wasGliding){this.glide?.stop();this.glide?.destroy();this.glide=undefined;playSfx(this,'staff_retract',0);}
  this.wasGliding=this.player.gliding;
  if(this.glide)(this.glide as Phaser.Sound.WebAudioSound).setVolume(.22*v);
 }
 update(_time:number,delta:number){
  if(!this.player||this.complete)return;
  const dt=Math.min(delta/1000,.04),p=this.player;this.t+=dt;
  this.controls.update();const c=this.controls;
  if(c.pausePressed){this.leave();return;}if(c.restartPressed){this.scene.restart();return;}if(c.mutePressed)toggleMute(this);
  p.wind=p.hit.x>1950&&p.hit.x<2280?-105:0;
  p.update(dt,c);
  if(this.bg)this.bg.tilePositionX=p.hit.x*.18;
  for(const f of this.foes){
   if(f.restored)continue;
   f.view.x=f.x+Math.sin(this.t*(f.air?1.5:1.1)+f.x)* (f.air?75:95);
   f.view.y=f.y+(f.air?Math.sin(this.t*2+f.x)*25:0);
   const dx=Math.abs(f.view.x-p.hit.x),dy=Math.abs(this.foeY(f)-p.hit.y);
   if(dx<49&&dy<55){
    if(p.pounding||p.dashTime>0||(p.body.velocity.y>180&&p.hit.y<this.foeY(f)-10)){this.restore(f);p.body.setVelocityY(-PHYS.stompBounce);}
    else p.hurt(f.view.x);
   }
  }
  this.shots=this.shots.filter(s=>{
   s.life-=dt;s.view.x+=PHYS.shotSpeed*s.dir*dt;
   const f=this.foes.find(f=>!f.restored&&Math.abs(f.view.x-s.view.x)<45&&Math.abs(this.foeY(f)-s.view.y)<45);
   if(f)this.restore(f);
   if(f||s.life<=0){s.view.destroy();return false;}return true;
  });
  if(!this.checkpoint&&p.hit.x>=1700&&p.hit.x<1750&&p.onGround){this.checkpoint=true;playSfx(this,'checkpoint',0);}
  if(p.hp<=0||p.hit.y>920){p.respawn(this.checkpoint?1700:150,594);p.hp=p.maxHp;}
  if(p.hit.x>3200&&p.onGround&&this.foes.every(f=>f.restored)){
   this.complete=true;p.frozen=true;p.victory=true;p.body.setVelocity(0,0);this.stopLoops();
   this.saved=writePart2(finishPilot(loadPart2()));playMusic(this,'victory_part2',false);
  }else this.syncLoops();
 }
 get status(){return {hp:this.player?.hp??4,restored:this.foes.filter(f=>f.restored).length,total:this.foes.length,complete:this.complete,saved:this.saved,checkpoint:this.checkpoint};}
 leave(){this.scene.stop('Part2Hud');this.scene.start('Part2Map');}
}

export class Part2HudScene extends Phaser.Scene{
 private touch?:TouchControls;
 private label!:Phaser.GameObjects.Text;
 private win?:Phaser.GameObjects.Container;
 constructor(){super('Part2Hud');}
 create(){
  this.win=undefined;this.add.rectangle(0,0,GAME_W,83,0x17132c,.86).setOrigin(0);
  this.label=this.add.text(20,12,'',textStyle(20));
  const pilot=this.scene.get('Part2Pilot') as Part2PilotScene;
  button(this,GAME_W-125,40,220,'Voltar ao mapa',()=>pilot.leave());
  this.touch=new TouchControls(this);
 }
 update(){
  this.touch?.update();const pilot=this.scene.get('Part2Pilot') as Part2PilotScene;
  const s=pilot.status;
  this.label.setText('OPALA · ROTA DE TESTE   ♥ '+s.hp+'   Restaurados '+s.restored+'/'+s.total+(s.checkpoint?'   ✦ Checkpoint':'')+'\n← → mover · Espaço pular/planar · X bastão · C disparo · Shift dash · ↓ mergulho');
  if(s.complete&&!this.win){
   const bg=this.add.rectangle(GAME_W/2,GAME_H/2,700,210,0x211832,.96).setStrokeStyle(3,0xc6ecf9);
   const title=this.add.text(GAME_W/2,GAME_H/2-55,'Rota de teste concluída!',textStyle(32)).setOrigin(.5);
   const text=this.add.text(GAME_W/2,GAME_H/2-7,(s.saved?'Progresso da rota salvo.':'Não foi possível salvar neste navegador.')+'\nA insígnia será conquistada na aventura definitiva.',textStyle(19)).setOrigin(.5);
   const b=button(this,GAME_W/2,GAME_H/2+66,330,'Retornar ao mapa II',()=>pilot.leave());
   this.win=this.add.container(0,0,[bg,title,text,b.root]).setDepth(1000);
   this.input.keyboard!.once('keydown-ENTER',()=>pilot.leave());
  }
 }
}
