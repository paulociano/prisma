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
import {loadPart2,writePart2,finishOpalPreview,finishOpalWorld,hasInsignia,opalPreviewUnlocked,part2Unlocked} from '../world/Part2';
import {OPAL_BEFORE,OPAL_AFTER,OPAL_FINALE} from '../story/opalStory';
import type {Line} from './DialogueScene';
import {opalStage,newCrown,advanceCrown,hitCrown,type OpalStage,type CrownState} from '../levels/opal';

const REQUIRED:Record<string,number>={idle:4,run:6,jump:6,attack:6,hurt_win:6,doublejump:6,dash:6,glide:6,wall:6,swim:6,shoot:6,pound_air:4,pound_land:2};
const validFrames=(scene:Phaser.Scene,key:string,count:number)=>has(scene,key)&&Array.from({length:count},(_,i)=>String(i)).every(f=>scene.textures.get(key).has(f));
export function opalBossArtReady(scene:Phaser.Scene){return validFrames(scene,'w8_boss_idle',4)&&validFrames(scene,'w8_boss_attack',6)&&validFrames(scene,'w8_boss_end',4);}
export function opalFinaleReady(scene:Phaser.Scene){return opalBossArtReady(scene)&&validFrames(scene,'w8_guardian',8)&&validFrames(scene,'w8_boss_projectiles',6)&&validFrames(scene,'w8_tiles',12)&&has(scene,'w8_boss_arena')&&has(scene,'part2_insignia_8')&&OPAL_FINALE.every(s=>has(scene,s.tex));}
export function pilotArtReady(scene:Phaser.Scene){
 const valid=(key:string,count:number)=>validFrames(scene,key,count);
 return Object.entries(REQUIRED).every(([n,count])=>valid('part2_iris_'+n,count))&&has(scene,'w8_bg_far')&&valid('w8_enemy',6)&&valid('w8_enemy_alt',6);
}
type Foe={view:Phaser.GameObjects.Sprite;x:number;y:number;air:boolean;range:number;restored:boolean;restoring:boolean};
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
 private stage!:OpalStage;
 private slabs:{body:Phaser.Physics.Arcade.Sprite;top:Phaser.GameObjects.GameObject;ice:boolean;breakable:boolean}[]=[];
 private crown?:CrownState;
 private crownView?:Phaser.GameObjects.Container;
 private crownDanger?:Phaser.GameObjects.Rectangle;
 private crownArt?:Phaser.GameObjects.Sprite;
 private crownEffect?:Phaser.GameObjects.Image;
 private talking=false;
 private finishing=false;
 private earned=false;
 private crownTarget=0;
 private crownHit=false;
 private mid?:Phaser.GameObjects.TileSprite;
 private near?:Phaser.GameObjects.TileSprite;
 constructor(){super('Part2Pilot');}
 create(data:{stage?:number}={}){
  const stage=opalStage(data.stage??1);
  if(!part2Unlocked(loadSave())||!pilotArtReady(this)||!stage||!opalPreviewUnlocked(loadPart2(),stage.id)){this.scene.start('Part2Map');return;}
  this.stage=stage;
  applyColorblind(this);this.foes=[];this.shots=[];this.slabs=[];this.complete=false;this.checkpoint=false;this.saved=true;this.t=0;this.wasGliding=false;this.crown=undefined;this.crownView=undefined;this.crownDanger=undefined;this.crownHit=false;this.mid=undefined;this.near=undefined;this.crownArt=undefined;this.crownEffect=undefined;this.talking=false;this.finishing=false;this.earned=false;
  this.physics.world.resume();
  const width=stage.width;
  this.physics.world.setBounds(0,0,width,1300);
  this.physics.world.setBoundsCollision(true,true,false,false);
  const zoom=stage.boss?1:closeCameraZoom(GAME_H),cam=this.cameras.main;
  cam.setZoom(zoom).setBounds(0,0,width,GAME_H);
  const bgKey=stage.boss&&has(this,'w8_boss_arena')?'w8_boss_arena':'w8_bg_far';
  this.bg=this.add.tileSprite(GAME_W/2,GAME_H/2,GAME_W,GAME_H,bgKey).setDepth(-5).setScrollFactor(0);
  if(stage.boss&&bgKey==='w8_boss_arena'){this.bg.setTileScale(GAME_W/this.bg.texture.getSourceImage().width,GAME_H/this.bg.texture.getSourceImage().height);}
  if(!stage.boss&&has(this,'w8_bg_mid'))this.mid=this.add.tileSprite(GAME_W/2,GAME_H/2,GAME_W,GAME_H,'w8_bg_mid').setDepth(-4).setScrollFactor(0);
  if(!stage.boss&&has(this,'w8_bg_near'))this.near=this.add.tileSprite(GAME_W/2,GAME_H/2+160,GAME_W,GAME_H,'w8_bg_near').setDepth(-3).setScrollFactor(0);
  this.terrain=this.physics.add.staticGroup();
  for(const slab of stage.slabs){
   const {x,y,w,h}=slab;
   const s=this.terrain.create(x+w/2,y+h/2,'pixel') as Phaser.Physics.Arcade.Sprite;
   s.setDisplaySize(w,h).setTint(slab.breakable?0x9fa7dc:slab.ice?0x7fb8cf:0x879cb5).setDepth(1).refreshBody();
   if(has(this,'w8_ground')&&h===80)this.add.tileSprite(x+w/2,y+h/2,w,h,'w8_ground').setDepth(1);
   let top:Phaser.GameObjects.GameObject;
   if(validFrames(this,'w8_tiles',12)){
    const art=this.add.container(x,y).setDepth(2);
    const count=Math.max(1,Math.ceil(w/64)),piece=w/count;
    for(let i=0;i<count;i++){
     const frame=slab.breakable?'10':h===24?'6':count===1?'1':i===0?'0':i===count-1?'2':'1';
     art.add(this.add.image(i*piece+piece/2,0,'w8_tiles',frame).setOrigin(.5,0).setDisplaySize(piece+1,h===24?h:Math.min(36,h)));
    }
    top=art;
   }else top=this.add.rectangle(x+w/2,y+5,w,10,slab.breakable?0xc8a6ec:slab.ice?0xe5f7ff:0xd2dbea).setDepth(2);
   this.slabs.push({body:s,top,ice:!!slab.ice,breakable:!!slab.breakable});
   if(slab.breakable)s.setData('fragile',true);
  }
  if(!stage.boss&&has(this,'w8_props')){
   const frames=this.textures.get('w8_props').getFrameNames().filter(f=>/^\d+$/.test(f));
   if(frames.length)stage.slabs.filter(s=>s.y===640&&s.w>=300).forEach((s,i)=>{
    const x=s.x+Math.min(s.w*.35,270);
    if(Math.abs(x-stage.checkpoint)<120||Math.abs(x-stage.exit)<150)return;
    const prop=this.add.image(x,640,'w8_props',frames[i%frames.length]).setOrigin(.5,1).setDepth(0);
    prop.setScale(Math.min(130/prop.height,145/prop.width));
   });
  }
  if(!stage.boss){
   this.add.rectangle(stage.checkpoint,565,16,150,0xebe8ff).setDepth(3);
   this.add.text(stage.checkpoint,485,'✦',textStyle(30,'#c6f4ff')).setOrigin(.5);
   this.add.rectangle(stage.exit,565,76,150,0x9de7f5,.55).setStrokeStyle(4,0xffffff);
   this.add.text(stage.exit,468,'SAÍDA',textStyle(19)).setOrigin(.5);
   for(const wind of stage.winds){
    this.add.rectangle((wind.from+wind.to)/2,330,wind.to-wind.from,590,0xb5dffa,.075);
    this.add.text((wind.from+wind.to)/2,280,wind.force<0?'← ← ←':'→ → →',textStyle(23,'#c8f0ff')).setOrigin(.5);
   }
  }else this.createCrown();
  this.player=new Player(this,150,594,'part2_');
  const p=this.player;p.canDoubleJump=p.canDash=p.canWallJump=p.canGlide=p.canShoot=p.canPound=true;p.hp=p.maxHp=4;
  this.physics.add.collider(p.hit,this.terrain);
  if(!stage.boss)cam.startFollow(p.hit,true,.10,.10,0,35);
  else cam.centerOn(GAME_W/2,GAME_H/2);
  this.controls=new Controls(this);
  const spawn=(x:number,y:number,air:boolean,range:number)=>{
   const key=air?'w8_enemy_alt':'w8_enemy';
   const view=this.add.sprite(x,y,key,'0').setDepth(5);
   view.setScale((air?62:66)/view.height).setOrigin(.5,air?.5:1);
   const anim=key+'-move';if(this.anims.exists(anim))view.play(anim);
   this.foes.push({x,y,air,range,view,restored:false,restoring:false});
  };
  stage.foes.forEach(f=>spawn(f.x,f.y,f.air,f.range));
  const on=(event:string,fn:()=>void)=>{this.events.on(event,fn);this.events.once('shutdown',()=>this.events.off(event,fn));};
  on('player-jump',()=>playSfx(this,'jump'));on('player-doublejump',()=>playSfx(this,'double_jump'));
  on('player-land',()=>playSfx(this,'land'));on('player-dash',()=>playSfx(this,'staff_dash'));
  on('player-hurt',()=>playSfx(this,'hurt',0));
  on('player-attack',()=>{playSfx(this,'staff_extend',0);playSfx(this,'staff_attack',0);for(const f of this.foes)if((f.view.x-p.hit.x)*p.facing>-25&&Math.abs(f.view.x-p.hit.x)<145&&Math.abs(this.foeY(f)-p.hit.y)<90)this.restore(f,'staff');if(this.crown&&Math.abs(p.hit.x-925)<155&&Math.abs(p.hit.y-510)<125)this.hitBoss();this.time.delayedCall(260,()=>playSfx(this,'staff_retract',0));});
  on('player-shoot',()=>{playSfx(this,'staff_shoot',0);this.shots.push({view:this.add.circle(p.hit.x+45*p.facing,p.hit.y,12,0xc7f4ff).setStrokeStyle(3,0xd0a4fc).setDepth(8),dir:p.facing,life:1.2});});
  on('player-pound',()=>{playSfx(this,'staff_pound',0);for(const f of this.foes)if(Math.abs(f.view.x-p.hit.x)<125&&Math.abs(this.foeY(f)-p.hit.y)<120)this.restore(f,'pound');
   for(const s of this.slabs){if(!s.breakable||!s.body.active)continue;const b=s.body.getBounds();if(p.hit.x>=b.left-24&&p.hit.x<=b.right+24&&Math.abs(p.body.bottom-b.top)<22){s.body.destroy();s.top.destroy();playSfx(this,'break_block',0);}}
   if(this.crown&&Math.abs(p.hit.x-925)<150&&Math.abs(p.hit.y-510)<165)this.hitBoss();
  });
  this.events.once('shutdown',()=>{this.stopLoops();this.scene.stop('Part2Hud');if(this.talking)this.scene.stop('Dialogue');this.physics.world.resume();});
  this.scene.launch('Part2Hud');
  playMusic(this,stage.boss?'boss_w8':'w8');
  cam.fadeIn(400);
  if(stage.boss&&validFrames(this,'w8_guardian',8))this.talk(OPAL_BEFORE,()=>{this.crownTarget=this.player.hit.x;});
 }
 private talk(lines:Line[],done:()=>void){
  this.talking=true;this.player.frozen=true;this.player.body.setVelocity(0,0);this.physics.world.pause();
  this.scene.launch('Dialogue',{lines,onDone:()=>{this.talking=false;this.player.frozen=this.complete||this.finishing;this.physics.world.resume();done();}});
 }
 private foeY(f:Foe){return f.view.y-(f.air?0:32);}
 private restore(f:Foe,kind:'staff'|'shot'|'pound'|'stomp'='staff'){
  if(f.restored||f.restoring)return;
  // The Frostshell's shell resists frontal strikes; stomping or pounding opens it.
  if(!f.air&&kind!=='pound'&&kind!=='stomp'){
   playSfx(this,'staff_shield',0);f.view.setTint(0xb6e6ff);this.time.delayedCall(140,()=>{if(f.view.active)f.view.clearTint();});return;
  }
  f.restoring=true;f.view.anims.stop();f.view.setFrame('4');playSfx(this,'staff_hit',0);
  this.time.delayedCall(180,()=>{if(!f.view.active)return;f.restoring=false;f.restored=true;f.view.clearTint();f.view.setFrame('5');playSfx(this,'dissonance_restored',0);});
 }
 private createCrown(){
  this.crown=newCrown();this.crownTarget=280;
  // Temporary readable collision proxy; never presented as approved boss art.
  const core=this.add.circle(0,0,51,0x8cddf5,.85).setStrokeStyle(5,0xe6fcff);
  const shield=this.add.circle(0,0,76,0xc8eaff,.15).setStrokeStyle(5,0xb5a0ed,.85);
  const crown=this.add.star(0,-83,5,20,46,0xc3ddf5).setStrokeStyle(3,0xeefbff);
  const label=this.add.text(0,95,'COROA DA GEADA',textStyle(20)).setOrigin(.5);
  this.crownView=this.add.container(925,510,[shield,core,crown,label]).setDepth(5);
  this.crownDanger=this.add.rectangle(280,480,146,320,0xb8e8ff,.18).setStrokeStyle(3,0xdceeff).setDepth(4);
  if(opalBossArtReady(this)){
   this.crownView.setVisible(false);
   this.crownArt=this.add.sprite(925,640,'w8_boss_idle','0').setOrigin(.5,1).setDepth(5);
   this.crownArt.setScale(260/this.crownArt.height);
  }
  if(validFrames(this,'w8_boss_projectiles',6))this.crownEffect=this.add.image(280,640,'w8_boss_projectiles','0').setOrigin(.5,1).setDepth(4);
 }
 private hitBoss(){
  if(!this.crown)return;
  const old=this.crown;this.crown=hitCrown(old);
  if(this.crown===old){playSfx(this,'staff_shield',0);return;}
  playSfx(this,'boss_hit',0);this.crownTarget=this.player.hit.x;this.crownHit=false;
  if(this.crown.phase==='restored'){playSfx(this,'part2_boss_restored',0);this.crownDanger?.setVisible(false);}
 }
 private updateCrown(dt:number){
  if(!this.crown||!this.crownView||!this.crownDanger)return;
  const old=this.crown;this.crown=advanceCrown(old,dt);
  const s=this.crown;
  if(s.phase==='warning'&&old.phase!=='warning'){this.crownTarget=this.player.hit.x;this.crownHit=false;}
  if(s.phase==='warning'||s.phase==='strike'){
   this.crownDanger.setX(this.crownTarget).setVisible(true).setFillStyle(s.phase==='strike'?0xa7dfff:0xc5e9ff,s.phase==='strike'?.75:.18);
   if(s.phase==='strike'&&!this.crownHit&&Math.abs(this.player.hit.x-this.crownTarget)<94&&this.player.hit.y>310){this.crownHit=this.player.hurt(this.crownTarget);}
  }else this.crownDanger.setVisible(false);
  if(this.crownArt){
   const n=s.phase==='warning'?Math.floor(this.t*4)%4:s.phase==='strike'?2:4+Math.floor(this.t*3)%2;
   if(s.phase!=='restored')this.crownArt.setTexture(s.phase==='warning'?'w8_boss_idle':'w8_boss_attack',String(n)).setOrigin(.5,1);
  }
  if(this.crownEffect){this.crownEffect.setVisible(s.phase==='warning'||s.phase==='strike').setPosition(this.crownTarget,640);if(s.phase==='warning'||s.phase==='strike')this.crownEffect.setFrame(s.phase==='warning'?'0':'1').setDisplaySize(146,s.phase==='warning'?36:320);}
  const core=this.crownView.list[1] as Phaser.GameObjects.Arc;
  core.setFillStyle(s.phase==='restored'?0x8de8bf:s.phase==='exposed'?0xffe5a2:0x8cddf5,.95);
 }
 private finishRoute(){
  if(this.finishing||this.complete)return;
  this.finishing=true;const p=this.player;p.frozen=true;p.victory=true;p.body.setVelocity(0,0);p.body.setAllowGravity(false);this.stopLoops();
  const finish=()=>{
   const old=loadPart2();let next=finishOpalPreview(old,this.stage.id);
   if(this.stage.boss)next=finishOpalWorld(next,this.crown?.phase==='restored',opalFinaleReady(this));
   this.saved=writePart2(next);this.earned=this.saved&&!hasInsignia(old,8)&&hasInsignia(next,8);
   if(this.earned)playSfx(this,'insignia_collect',0);
   this.complete=true;this.finishing=false;playMusic(this,'victory_part2',false);
  };
  if(!this.stage.boss){finish();return;}
  this.crownEffect?.setVisible(false);this.crownDanger?.setVisible(false);
  const after=()=>validFrames(this,'w8_guardian',8)?this.talk(OPAL_AFTER,finish):finish();
  if(this.crownArt){
   for(let i=0;i<4;i++)this.time.delayedCall(i*320,()=>this.crownArt?.setTexture('w8_boss_end',String(i)).setOrigin(.5,1));
   this.time.delayedCall(1450,after);
  }else after();
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
  if(!this.player||this.complete||this.finishing||this.talking)return;
  const dt=Math.min(delta/1000,.04),p=this.player;this.t+=dt;
  this.controls.update();const c=this.controls;
  if(c.pausePressed){this.leave();return;}if(c.restartPressed){this.scene.restart({stage:this.stage.id});return;}if(c.mutePressed)toggleMute(this);
  p.wind=this.stage.winds.reduce((v,w)=>v+(p.hit.x>=w.from&&p.hit.x<=w.to?w.force:0),0);
  p.groundGrip=this.slabs.some(s=>s.ice&&s.body.active&&Math.abs(p.body.bottom-s.body.getBounds().top)<9&&p.hit.x>=s.body.getBounds().left&&p.hit.x<=s.body.getBounds().right)?.23:1;
  p.update(dt,c);
  if(this.bg&&!this.stage.boss)this.bg.tilePositionX=p.hit.x*.18;
  if(this.mid)this.mid.tilePositionX=p.hit.x*.36;
  if(this.near)this.near.tilePositionX=p.hit.x*.62;
  this.updateCrown(dt);
  for(const f of this.foes){
   if(f.restored||f.restoring)continue;
   f.view.x=f.x+Math.sin(this.t*(f.air?1.5:1.1)+f.x)* f.range;
   f.view.y=f.y+(f.air?Math.sin(this.t*2+f.x)*25:0);
   const dx=Math.abs(f.view.x-p.hit.x),dy=Math.abs(this.foeY(f)-p.hit.y);
   if(dx<49&&dy<55){
    if(p.pounding||(p.body.velocity.y>180&&p.hit.y<this.foeY(f)-10)){this.restore(f,p.pounding?'pound':'stomp');p.body.setVelocityY(-PHYS.stompBounce);}
    else p.hurt(f.view.x);
   }
  }
  this.shots=this.shots.filter(s=>{
   s.life-=dt;s.view.x+=PHYS.shotSpeed*s.dir*dt;
   const f=this.foes.find(f=>!f.restored&&!f.restoring&&Math.abs(f.view.x-s.view.x)<45&&Math.abs(this.foeY(f)-s.view.y)<45);
   const bossHit=!!this.crown&&Math.abs(s.view.x-925)<60&&Math.abs(s.view.y-510)<90;
   if(f)this.restore(f,'shot');if(bossHit)this.hitBoss();
   if(f||bossHit||s.life<=0){s.view.destroy();return false;}return true;
  });
  if(!this.stage.boss&&!this.checkpoint&&Math.abs(p.hit.x-this.stage.checkpoint)<40&&p.onGround){this.checkpoint=true;playSfx(this,'checkpoint',0);}
  if(p.hp<=0||p.hit.y>920){
   if(this.stage.boss){this.scene.restart({stage:this.stage.id});return;}
   p.respawn(this.checkpoint?this.stage.checkpoint:150,594);p.hp=p.maxHp;
  }
  if(this.crown?.phase==='restored'||(!this.stage.boss&&p.hit.x>this.stage.exit-60&&p.onGround&&this.foes.every(f=>f.restored)))this.finishRoute();
  else this.syncLoops();
 }
 get status(){return {stage:this.stage?.id??1,name:this.stage?.name??'Opala',brief:this.stage?.brief??'',crown:this.crown,hp:this.player?.hp??4,restored:this.foes.filter(f=>f.restored).length,total:this.foes.length,complete:this.complete,saved:this.saved,earned:this.earned,finaleReady:opalFinaleReady(this),busy:this.talking||this.finishing,checkpoint:this.checkpoint};}
 leave(){if(this.talking||this.finishing)return;this.scene.stop('Part2Hud');if(this.complete&&this.stage.boss&&this.saved&&opalFinaleReady(this))this.scene.start('Cutscene',{slides:OPAL_FINALE,next:'Part2Map',nextData:{opal:true},music:'map_part2'});else this.scene.start('Part2Map',{opal:true});}
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
  this.label.setText('8-'+s.stage+' · '+s.name+(s.finaleReady?'   ♥ ':' · PRÉVIA   ♥ ')+s.hp+'   '+(s.crown?'Coroa '+s.crown.hp+'/6 · '+({warning:'Aviso',strike:'Rajada',exposed:'Núcleo exposto',restored:'Restaurada'}[s.crown.phase]):'Restaurados '+s.restored+'/'+s.total)+(s.checkpoint?'   ✦ Checkpoint':'')+'\n'+s.brief);
  if(s.complete&&!this.win){
   const bg=this.add.rectangle(GAME_W/2,GAME_H/2,700,210,0x211832,.96).setStrokeStyle(3,0xc6ecf9);
   const title=this.add.text(GAME_W/2,GAME_H/2-55,s.stage===4?(s.finaleReady?'Coroa restaurada!':'Coroa restaurada na prévia!'):'Fase concluída!',textStyle(32)).setOrigin(.5);
   const text=this.add.text(GAME_W/2,GAME_H/2-7,(s.saved?'Progresso da rota salvo.':'Não foi possível salvar neste navegador.')+(s.stage===4?(s.earned?'\nMemória da Transformação conquistada!':s.finaleReady?'\nAs memórias de Opala estão na coleção.':'\nA insígnia aguarda as cutscenes definitivas.'):'\nA próxima fase foi desbloqueada.'),textStyle(19)).setOrigin(.5);
   const b=button(this,GAME_W/2,GAME_H/2+66,330,'Retornar ao mapa II',()=>pilot.leave());
   this.win=this.add.container(0,0,[bg,title,text,b.root]).setDepth(1000);
   this.input.keyboard!.once('keydown-ENTER',()=>pilot.leave());
  }
 }
}
