import Phaser from 'phaser';
import { has } from '../gfx/art';
import type { Boss, BossHost } from './Boss';

type Body = Phaser.Physics.Arcade.Body;
type Sprite = Phaser.Physics.Arcade.Sprite;

// Frames dos atlas do chefão.
const ATK = { idle: 0, lash: 1, throw: 2, closed: 3, spit: 4, recover: 5 };
const END = { cracked: 0, crumble: 1, burst: 2, restored: 3 };
const SHOT = { vines: 0, seed: 1, tornado: 2, dust: 3, spikes: 4, ball: 5 };

type State = 'wait' | 'idle' | 'lashWind' | 'lash' | 'stuck' | 'spitWind' | 'recover' | 'eruptWind' | 'rollWind' | 'hurt' | 'defeated';

// A Espinheira (chefão do Mundo 4), o isolamento. Fica plantada à direita da arena.
// Padrão: chicote de cipós rente ao chão (pule) → os cipós ficam presos e a flor
// abre: hora de golpear; cuspe de sementes em arco; espinhos brotando do chão em
// sequência; bola de espinhos rolando pela arena.
export class Thornweed implements Boss {
  readonly name = 'Espinheira';
  readonly hit: Phaser.GameObjects.Zone;
  readonly view: Phaser.GameObjects.Sprite;
  readonly shots: Phaser.Physics.Arcade.Group;
  readonly maxHp = 3;
  hp = 3;
  state: State = 'wait';

  private timer = 0;
  private step = 0;
  private t = 0;
  private art: boolean;
  private lashZone: Phaser.Geom.Rectangle;
  private readonly pattern = ['lash', 'spit', 'erupt', 'lash', 'roll'] as const;

  constructor(
    private scene: Phaser.Scene,
    private host: BossHost,
    x: number,
    solids: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.art = has(scene, 'w4_boss_idle');
    this.hit = scene.add.zone(x + 40, host.groundY - 150, 220, 300);
    scene.physics.add.existing(this.hit);
    this.body.setAllowGravity(false).setImmovable(true);
    this.lashZone = new Phaser.Geom.Rectangle(x - 440, host.groundY - 150, 400, 110);

    this.view = scene.add.sprite(x + 40, host.groundY + 8, this.art ? 'w4_boss_idle' : 'faded', 0).setOrigin(0.5, 1).setDepth(7);
    this.view.setScale(this.art ? 0.5 : 3);
    if (this.art && !scene.anims.exists('thornweed-idle')) {
      scene.anims.create({ key: 'thornweed-idle', frames: [0, 1, 2, 3].map((f) => ({ key: 'w4_boss_idle', frame: String(f) })), frameRate: 4, repeat: -1, yoyo: true });
    }
    this.idleAnim();

    this.shots = scene.physics.add.group();
    scene.physics.add.collider(this.shots, solids, (s) => this.landed(s as Sprite), (s) => (s as Sprite).getData('kind') === 'seed');
  }

  get body() {
    return this.hit.body as Body;
  }

  get vulnerable() {
    return this.state === 'stuck';
  }

  get dangerous() {
    return !['wait', 'stuck', 'hurt', 'defeated'].includes(this.state);
  }

  private get speed() {
    return 1 + (this.maxHp - this.hp) * 0.25;
  }

  start() {
    this.enter('idle', 1.2);
  }

  private enter(s: State, time: number) {
    this.state = s;
    this.timer = time / (s === 'stuck' || s === 'hurt' ? 1 : this.speed);
  }

  /** Parado: mostra a forma atual do chefe (inteira, rachada ou desmoronando, conforme os golpes que levou). */
  private idleAnim() {
    if (!this.art) return;
    const lost = this.maxHp - this.hp;
    if (lost > 0) this.pose('end', Math.min(lost, 2) - 1);
    else this.view.play('thornweed-idle', true);
  }

  private pose(tex: 'atk' | 'end', frame: number) {
    if (!this.art) return;
    this.view.anims.stop();
    this.view.setTexture(tex === 'atk' ? 'w4_boss_attack' : 'w4_boss_end', String(frame));
  }

  private shot(kind: string, frame: number, x: number, y: number, scale: number) {
    const s = this.shots.create(x, y, this.art ? 'w4_boss_projectiles' : 'crate', this.art ? String(frame) : undefined) as Sprite;
    s.setScale(this.art ? scale : 0.8).setDepth(9).setData('kind', kind);
    return s;
  }

  update(dt: number) {
    this.t += dt;
    this.timer -= dt;
    if (this.state === 'stuck') this.view.setTint(Math.sin(this.t * 20) > 0 ? 0xffd0e8 : 0xffffff);
    else if (this.state === 'lashWind') this.view.x = this.hit.x + Math.sin(this.t * 60) * 3; // tremendo: vai chicotear
    else if (this.state !== 'hurt') this.view.clearTint();
    if (this.state !== 'lashWind') this.view.x = this.hit.x;

    // chicote: a faixa rente ao chão machuca enquanto os cipós avançam
    if (this.state === 'lash') {
      const pb = this.host.playerBody();
      if (Phaser.Geom.Intersects.RectangleToRectangle(this.lashZone, new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height))) this.host.hurtPlayer(this.hit.x);
    }
    for (const s of this.shots.getChildren() as Sprite[]) {
      if (s.getData('kind') === 'ball') s.angle -= 360 * dt * this.speed;
      if (s.x < -120 || s.y > this.host.groundY + 200) s.destroy();
    }

    if (this.timer > 0) return;
    switch (this.state) {
      case 'idle':
        this.nextAttack();
        break;
      case 'lashWind':
        this.pose('atk', ATK.lash);
        this.scene.cameras.main.shake(180, 0.008);
        this.host.burst(this.lashZone.x + 60, this.host.groundY - 20, 14);
        this.enter('lash', 0.35);
        break;
      case 'lash':
        // cipós presos no chão: a flor fica aberta e exposta
        this.enter('stuck', 2.0);
        break;
      case 'stuck':
      case 'recover':
      case 'hurt':
        this.backToIdle();
        break;
      case 'spitWind':
        this.spit();
        break;
      case 'eruptWind':
        this.erupt();
        break;
      case 'rollWind':
        this.roll();
        break;
    }
  }

  private backToIdle() {
    this.view.clearTint();
    this.idleAnim();
    this.enter('idle', 0.8);
  }

  private nextAttack() {
    const next = this.pattern[this.step++ % this.pattern.length];
    if (next === 'lash') {
      this.pose('atk', ATK.closed);
      this.enter('lashWind', 0.8);
    } else if (next === 'spit') {
      this.pose('atk', ATK.closed);
      this.enter('spitWind', 0.6);
    } else if (next === 'erupt') {
      this.pose('atk', ATK.recover);
      this.enter('eruptWind', 0.5);
    } else {
      this.pose('atk', ATK.throw);
      this.enter('rollWind', 0.5);
    }
  }

  /** Sementes em leque caindo em volta de Íris. */
  private spit() {
    this.pose('atk', ATK.spit);
    const fromX = this.hit.x - 120, fromY = this.host.groundY - 200;
    const g = this.scene.physics.world.gravity.y;
    const n = 3 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const s = this.shot('seed', SHOT.seed, fromX, fromY, 0.3);
      (s.body as Body).setCircle(s.width * 0.3, s.width * 0.2, s.height * 0.2);
      const flight = 0.85 + i * 0.12;
      const tx = Phaser.Math.Clamp(this.host.playerX() + (i - (n - 1) / 2) * 120, 60, this.hit.x - 160);
      s.setVelocity((tx - fromX) / flight, (this.host.groundY - 30 - fromY - 0.5 * g * flight * flight) / flight);
    }
    this.enter('recover', 0.7);
  }

  /** Espinhos brotam do chão em sequência, da planta em direção à borda. */
  private erupt() {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x = this.hit.x - 200 - i * 125;
      if (x < 40) break;
      this.scene.time.delayedCall((i * 260) / this.speed, () => {
        if (this.state === 'defeated') return;
        // poeira avisa, depois os espinhos sobem
        const dust = this.scene.add.image(x, this.host.groundY + 4, this.art ? 'w4_boss_projectiles' : 'dot', this.art ? String(SHOT.dust) : undefined).setOrigin(0.5, 1).setScale(0.26).setDepth(8);
        this.scene.tweens.add({ targets: dust, x: dust.x + 3, duration: 50, yoyo: true, repeat: -1 }); // tremendo
        this.scene.time.delayedCall(420, () => {
          dust.destroy();
          if (this.state === 'defeated') return;
          const s = this.shot('spikes', SHOT.spikes, x, this.host.groundY + 4, 0.3);
          s.setOrigin(0.5, 1);
          const body = s.body as Body;
          body.setAllowGravity(false).setImmovable(true);
          body.setSize(s.width * 0.6, s.height * 0.7).setOffset(s.width * 0.2, s.height * 0.3);
          this.scene.tweens.add({ targets: s, scaleY: { from: 0.05, to: 0.3 }, duration: 120 });
          this.scene.time.delayedCall(700, () => s.active && s.destroy());
        });
      });
    }
    this.enter('recover', 2.2);
  }

  /** Bola de espinhos rolando pelo chão até sair da arena. */
  private roll() {
    const s = this.shot('ball', SHOT.ball, this.hit.x - 140, this.host.groundY - 44, 0.3);
    const body = s.body as Body;
    body.setAllowGravity(false);
    body.setCircle(s.width * 0.32, s.width * 0.18, s.height * 0.18);
    s.setVelocityX(-320 * this.speed);
    this.enter('recover', 1.4);
  }

  private landed(s: Sprite) {
    if (this.art) {
      const fx = this.scene.add.image(s.x, this.host.groundY + 4, 'w4_boss_projectiles', String(SHOT.dust)).setOrigin(0.5, 1).setScale(0.14).setDepth(8);
      this.scene.tweens.add({ targets: fx, alpha: 0, duration: 400, onComplete: () => fx.destroy() });
    }
    s.destroy();
  }

  takeHit(): boolean {
    if (!this.vulnerable) return false;
    this.hp--;
    this.host.onBossHp(this.hp, this.maxHp);
    this.host.burst(this.hit.x, this.hit.y - 40, 30);
    this.scene.cameras.main.shake(200, 0.012);
    this.view.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => this.view.clearTint());
    if (this.hp <= 0) {
      this.defeat();
      return true;
    }
    this.pose('end', Math.min(this.maxHp - this.hp, 2) - 1);
    this.enter('hurt', 0.9);
    return true;
  }

  private defeat() {
    this.state = 'defeated';
    for (const s of this.shots.getChildren()) s.destroy();
    this.pose('end', END.crumble);
    const seq = [END.burst, END.restored];
    seq.forEach((f, i) =>
      this.scene.time.delayedCall(700 * (i + 1), () => {
        this.pose('end', f);
        this.host.burst(this.hit.x, this.hit.y - 60, 40);
        this.scene.cameras.main.shake(200, 0.008);
        if (i === seq.length - 1) this.host.onBossDefeated();
      }),
    );
  }
}
