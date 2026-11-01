import Phaser from 'phaser';
import { has } from '../gfx/art';
import type { Boss, BossHost } from './Boss';

type Body = Phaser.Physics.Arcade.Body;
type Sprite = Phaser.Physics.Arcade.Sprite;

// Frames dos atlas do chefão.
const ATK = { coil: 0, strike: 1, recover: 2, stormStart: 3, storm: 4, settle: 5 };
const END = { cracked: 0, crumble: 1, burst: 2, restored: 3 };
const SHOT = { gust: 0, ball: 1, crystals: 2, geyser: 3, tornado: 4, ring: 5 };

type State =
  | 'wait'
  | 'idle'
  | 'spitWind'
  | 'spitRecover'
  | 'diving'
  | 'under'
  | 'warn'
  | 'erupt'
  | 'dazed'
  | 'stormWind'
  | 'storm'
  | 'hurt'
  | 'defeated';

// A Serpente das Areias (chefão do Mundo 2), que esconde o rosto: a Vergonha.
// Padrão: cuspe de bolas de areia; mergulho na areia (persegue Íris por baixo, avisa com
// um gêiser e irrompe; depois fica tonta com o rosto exposto: hora de golpear);
// tempestade (vento empurra Íris e um tornado atravessa a arena: pule ou use o dash).
export class SandSerpent implements Boss {
  readonly name = 'Serpente das Areias';
  readonly hit: Phaser.GameObjects.Zone;
  readonly view: Phaser.GameObjects.Sprite;
  readonly shots: Phaser.Physics.Arcade.Group;
  readonly maxHp = 3;
  hp = 3;
  facing = -1;
  state: State = 'wait';

  private timer = 0;
  private step = 0;
  private t = 0;
  private sink = 0; // quanto o corpo está afundado na areia (só visual)
  private art: boolean;
  private mound?: Phaser.GameObjects.Particles.ParticleEmitter;
  private warnFx?: Phaser.GameObjects.Image;
  private readonly pattern = ['spit', 'dive', 'storm', 'dive'] as const;

  constructor(
    private scene: Phaser.Scene,
    private host: BossHost,
    x: number,
    solids: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.art = has(scene, 'w2_boss_idle');
    this.hit = scene.add.zone(x, host.groundY - 110, 190, 220);
    scene.physics.add.existing(this.hit);
    this.body.setAllowGravity(false).setImmovable(true);

    this.view = scene.add.sprite(x, host.groundY, this.art ? 'w2_boss_idle' : 'faded', 0).setOrigin(0.5, 1).setDepth(7);
    this.view.setScale(this.art ? 0.5 : 3);
    if (this.art && !scene.anims.exists('serpent-idle')) {
      scene.anims.create({ key: 'serpent-idle', frames: [0, 1, 2, 3].map((f) => ({ key: 'w2_boss_idle', frame: String(f) })), frameRate: 4, repeat: -1, yoyo: true });
    }
    this.idleAnim();

    this.shots = scene.physics.add.group();
    scene.physics.add.collider(this.shots, solids, (s) => this.shatter(s as Sprite), (s) => (s as Sprite).getData('kind') === 'ball');
  }

  get body() {
    return this.hit.body as Body;
  }

  get vulnerable() {
    return this.state === 'dazed';
  }

  get dangerous() {
    return !['wait', 'dazed', 'hurt', 'defeated', 'under', 'warn', 'diving'].includes(this.state);
  }

  private get speed() {
    return 1 + (this.maxHp - this.hp) * 0.25;
  }

  start() {
    this.enter('idle', 1.2);
  }

  private enter(s: State, time: number) {
    this.state = s;
    this.timer = time / (s === 'dazed' || s === 'hurt' ? 1 : this.speed);
  }

  private idleAnim() {
    if (this.art) this.view.play('serpent-idle', true);
  }

  private pose(tex: 'atk' | 'end', frame: number) {
    if (!this.art) return;
    this.view.anims.stop();
    this.view.setTexture(tex === 'atk' ? 'w2_boss_attack' : 'w2_boss_end', String(frame));
  }

  private shot(kind: string, frame: number, x: number, y: number, scale: number) {
    const s = this.shots.create(x, y, this.art ? 'w2_boss_projectiles' : 'ring', this.art ? String(frame) : undefined) as Sprite;
    s.setScale(this.art ? scale : 1).setDepth(9).setData('kind', kind);
    return s;
  }

  update(dt: number) {
    this.t += dt;
    this.timer -= dt;
    this.view.setPosition(this.hit.x, this.host.groundY + 6 + this.sink);
    this.view.setFlipX(this.facing > 0);
    if (this.state === 'dazed') this.view.setTint(Math.sin(this.t * 20) > 0 ? 0xffe0b0 : 0xffffff);
    else if (this.state !== 'hurt') this.view.clearTint();

    for (const s of this.shots.getChildren() as Sprite[]) {
      if (s.getData('kind') === 'tornado') s.angle = Math.sin(this.t * 30) * 4;
      if (s.x < -120 || s.x > this.host.arenaW + 120 || s.y > this.host.groundY + 200) s.destroy();
    }
    this.mound?.setPosition(this.hit.x, this.host.groundY - 6);

    if (this.state === 'under') {
      // persegue Íris por baixo da areia
      const dx = this.host.playerX() - this.hit.x;
      this.hit.x += Phaser.Math.Clamp(dx, -260 * dt * this.speed, 260 * dt * this.speed);
      this.hit.x = Phaser.Math.Clamp(this.hit.x, 120, this.host.arenaW - 120);
    }

    if (this.timer > 0) return;
    switch (this.state) {
      case 'idle':
        this.nextAttack();
        break;
      case 'spitWind':
        this.spit();
        break;
      case 'spitRecover':
        this.backToIdle();
        break;
      case 'diving':
        this.view.setVisible(false);
        this.mound = this.scene.add.particles(this.hit.x, this.host.groundY - 6, 'dot', {
          speedX: { min: -80, max: 80 },
          speedY: { min: -160, max: -60 },
          lifespan: 350,
          scale: { start: 0.8, end: 0 },
          tint: [0xd8c6a8, 0xb9a88a],
          frequency: 25,
        });
        this.mound.setDepth(8);
        this.enter('under', 1.7);
        break;
      case 'under':
        this.warn();
        break;
      case 'warn':
        this.erupt();
        break;
      case 'erupt':
        this.pose('atk', ATK.recover);
        this.enter('dazed', 1.9);
        break;
      case 'dazed':
        this.backToIdle();
        break;
      case 'stormWind':
        this.storm();
        break;
      case 'storm':
        this.host.setWind(0);
        this.pose('atk', ATK.settle);
        this.enter('spitRecover', 0.5);
        break;
      case 'hurt':
        this.burrowAway();
        break;
    }
  }

  private backToIdle() {
    this.facing = this.host.playerX() < this.hit.x ? -1 : 1;
    this.idleAnim();
    this.enter('idle', 0.9);
  }

  private nextAttack() {
    const next = this.pattern[this.step++ % this.pattern.length];
    this.facing = this.host.playerX() < this.hit.x ? -1 : 1;
    if (next === 'spit') {
      this.pose('atk', ATK.coil);
      this.enter('spitWind', 0.6);
    } else if (next === 'dive') {
      this.dive();
    } else {
      this.pose('atk', ATK.stormStart);
      this.enter('stormWind', 0.7);
    }
  }

  /** Três bolas de areia em leque, caindo perto de Íris. */
  private spit() {
    this.pose('atk', ATK.strike);
    const fromX = this.hit.x + this.facing * 110, fromY = this.host.groundY - 270;
    const g = this.scene.physics.world.gravity.y;
    const n = 3 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const s = this.shot('ball', SHOT.ball, fromX, fromY, 0.42);
      (s.body as Body).setCircle(s.width * 0.3, s.width * 0.2, s.height * 0.2);
      const flight = 0.9 + i * 0.12;
      const tx = this.host.playerX() + (i - (n - 1) / 2) * 110;
      s.setVelocity((tx - fromX) / flight, (this.host.groundY - 30 - fromY - 0.5 * g * flight * flight) / flight);
    }
    this.enter('spitRecover', 0.6);
  }

  private dive() {
    this.pose('atk', ATK.recover);
    this.state = 'diving';
    this.timer = 0.6;
    this.host.burst(this.hit.x, this.host.groundY - 20, 20);
    this.scene.tweens.add({ targets: this, sink: 300, duration: 550, ease: 'Quad.In' });
  }

  /** Aviso: gêiser de areia onde a serpente vai irromper. */
  private warn() {
    this.mound?.destroy();
    this.mound = undefined;
    if (this.art) {
      this.warnFx = this.scene.add.image(this.hit.x, this.host.groundY + 4, 'w2_boss_projectiles', String(SHOT.geyser)).setOrigin(0.5, 1).setScale(0.3).setDepth(8);
      this.scene.tweens.add({ targets: this.warnFx, scale: 0.55, duration: 600 / this.speed, yoyo: false });
    }
    this.scene.cameras.main.shake(500 / this.speed, 0.004);
    this.enter('warn', 0.65);
  }

  private erupt() {
    this.warnFx?.destroy();
    this.view.setVisible(true);
    this.pose('atk', ATK.strike);
    this.facing = this.host.playerX() < this.hit.x ? -1 : 1;
    this.scene.tweens.add({ targets: this, sink: 0, duration: 220, ease: 'Back.Out' });
    this.scene.cameras.main.shake(250, 0.012);
    this.host.burst(this.hit.x, this.host.groundY - 30, 30);
    this.enter('erupt', 0.5);
  }

  /** Vento empurra Íris para longe e um tornado atravessa a arena. */
  private storm() {
    this.pose('atk', ATK.storm);
    const dir = this.host.playerX() < this.hit.x ? -1 : 1;
    this.host.setWind(dir * 200);
    const s = this.shot('tornado', SHOT.tornado, this.hit.x + dir * 120, this.host.groundY - 70, 0.62);
    const body = s.body as Body;
    body.setAllowGravity(false);
    body.setSize(s.width * 0.45, s.height * 0.8).setOffset(s.width * 0.275, s.height * 0.15);
    s.setVelocityX(dir * 300 * this.speed);
    this.enter('storm', 2.2);
  }

  private shatter(s: Sprite) {
    if (this.art) {
      const fx = this.scene.add.image(s.x, this.host.groundY + 4, 'w2_boss_projectiles', String(SHOT.crystals)).setOrigin(0.5, 1).setScale(0.32).setDepth(8);
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
    this.pose('end', END.cracked);
    this.enter('hurt', 0.8);
    return true;
  }

  /** Depois de levar um golpe, afunda e reaparece do outro lado da arena. */
  private burrowAway() {
    this.state = 'diving';
    this.timer = 99;
    this.scene.tweens.add({
      targets: this,
      sink: 300,
      duration: 450,
      ease: 'Quad.In',
      onComplete: () => {
        this.hit.x = this.hit.x > this.host.arenaW / 2 ? 260 : this.host.arenaW - 260;
        this.facing = this.host.playerX() < this.hit.x ? -1 : 1;
        this.idleAnim();
        this.scene.tweens.add({ targets: this, sink: 0, duration: 500, ease: 'Back.Out', onComplete: () => this.enter('idle', 0.6) });
        this.host.burst(this.hit.x, this.host.groundY - 20, 20);
      },
    });
  }

  private defeat() {
    this.state = 'defeated';
    this.host.setWind(0);
    for (const s of this.shots.getChildren()) s.destroy();
    this.mound?.destroy();
    this.warnFx?.destroy();
    this.pose('end', END.cracked);
    const seq = [END.crumble, END.burst, END.restored];
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
