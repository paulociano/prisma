import Phaser from 'phaser';
import { has } from '../gfx/art';
import type { Boss, BossHost } from './Boss';

type Body = Phaser.Physics.Arcade.Body;
type Sprite = Phaser.Physics.Arcade.Sprite;

// Frames dos atlas do chefão.
const ATK = { raise: 0, slam: 1, recover: 2, inkStart: 3, ink: 4, inkEnd: 5 };
const END = { cracked: 0, crumble: 1, burst: 2, restored: 3 };
const SHOT = { sweep: 0, rise: 1, whirlSmall: 2, whirl: 3, inkSmall: 4, ink: 5 };

type State = 'wait' | 'idle' | 'riseWind' | 'sweepWind' | 'inkWind' | 'whirl' | 'recover' | 'tired' | 'hurt' | 'defeated';

// O Kraken do Silêncio (chefão do Mundo 5). A arena é toda submersa: Íris nada.
// Padrão: tentáculos brotam do chão onde bolhas avisam; varrida de tentáculo rente ao
// chão (nade por cima) que deixa o Kraken exausto: hora de atacar; nuvens de tinta que
// perseguem Íris; redemoinho que puxa para o centro.
export class Kraken implements Boss {
  readonly name = 'Kraken do Silêncio';
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
  private whirlX = 0;
  private readonly pattern = ['rise', 'sweep', 'ink', 'whirl', 'sweep'] as const;

  constructor(
    private scene: Phaser.Scene,
    private host: BossHost,
    x: number,
    _solids: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.art = has(scene, 'w5_boss_idle');
    // corpo inteiro, da cabeça até os tentáculos no chão
    this.hit = scene.add.zone(x + 60, host.groundY - 170, 240, 320);
    scene.physics.add.existing(this.hit);
    this.body.setAllowGravity(false).setImmovable(true);

    this.view = scene.add.sprite(x + 60, host.groundY + 10, this.art ? 'w5_boss_idle' : 'faded', 0).setOrigin(0.5, 1).setDepth(7);
    this.view.setScale(this.art ? 0.5 : 3);
    if (this.art && !scene.anims.exists('kraken-idle')) {
      scene.anims.create({ key: 'kraken-idle', frames: [0, 1, 2, 3].map((f) => ({ key: 'w5_boss_idle', frame: String(f) })), frameRate: 4, repeat: -1, yoyo: true });
    }
    this.idleAnim();
    this.shots = scene.physics.add.group({ allowGravity: false });
  }

  get body() {
    return this.hit.body as Body;
  }

  get vulnerable() {
    return this.state === 'tired';
  }

  get dangerous() {
    return !['wait', 'tired', 'hurt', 'defeated'].includes(this.state);
  }

  private get speed() {
    return 1 + (this.maxHp - this.hp) * 0.25;
  }

  start() {
    this.enter('idle', 1.2);
  }

  private enter(s: State, time: number) {
    this.state = s;
    this.timer = time / (s === 'tired' || s === 'hurt' ? 1 : this.speed);
  }

  /** Parado: mostra a forma atual do chefe (inteira, rachada ou desmoronando, conforme os golpes que levou). */
  private idleAnim() {
    if (!this.art) return;
    const lost = this.maxHp - this.hp;
    if (lost > 0) this.pose('end', Math.min(lost, 2) - 1);
    else this.view.play('kraken-idle', true);
  }

  private pose(tex: 'atk' | 'end', frame: number) {
    if (!this.art) return;
    this.view.anims.stop();
    this.view.setTexture(tex === 'atk' ? 'w5_boss_attack' : 'w5_boss_end', String(frame));
  }

  private shot(kind: string, frame: number, x: number, y: number) {
    const s = this.shots.create(x, y, this.art ? 'w5_boss_projectiles' : 'crate', this.art ? String(frame) : undefined) as Sprite;
    s.setScale(this.art ? 0.5 : 1).setDepth(9).setData('kind', kind);
    return s;
  }

  update(dt: number) {
    this.t += dt;
    this.timer -= dt;
    if (this.state === 'tired') this.view.setTint(Math.sin(this.t * 18) > 0 ? 0xc8f0ff : 0xffffff);
    else if (this.state !== 'hurt') this.view.clearTint();

    for (const s of this.shots.getChildren() as Sprite[]) {
      const kind = s.getData('kind');
      if (kind === 'ink') {
        // a tinta persegue Íris devagar
        const pb = this.host.playerBody();
        const a = Math.atan2(pb.center.y - s.y, pb.center.x - s.x);
        s.setVelocity(Math.cos(a) * 80 * this.speed, Math.sin(a) * 80 * this.speed);
      } else if (kind === 'whirl') s.angle += 240 * dt;
      if (s.x < -200) s.destroy();
    }
    if (this.state === 'whirl') {
      const px = this.host.playerX();
      this.host.setWind(Math.sign(this.whirlX - px) * 180 * this.speed);
    }

    if (this.timer > 0) return;
    switch (this.state) {
      case 'idle':
        this.nextAttack();
        break;
      case 'riseWind':
        this.rise();
        break;
      case 'sweepWind':
        this.sweep();
        break;
      case 'inkWind':
        this.ink();
        break;
      case 'whirl':
        this.host.setWind(0);
        for (const s of this.shots.getChildren() as Sprite[]) if (s.getData('kind') === 'whirl') s.destroy();
        this.backToIdle();
        break;
      case 'recover':
      case 'tired':
      case 'hurt':
        this.backToIdle();
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
    if (next === 'rise') {
      this.pose('atk', ATK.raise);
      this.enter('riseWind', 0.4);
    } else if (next === 'sweep') {
      this.pose('atk', ATK.raise);
      this.enter('sweepWind', 0.8);
    } else if (next === 'ink') {
      this.pose('atk', ATK.inkStart);
      this.enter('inkWind', 0.5);
    } else {
      this.pose('atk', ATK.inkEnd);
      this.whirlX = Phaser.Math.Clamp(this.host.playerX(), 200, this.hit.x - 300);
      const w = this.shot('whirl', SHOT.whirl, this.whirlX, this.host.groundY - 160);
      w.setScale(this.art ? 0.35 : 1).setAlpha(0.85);
      (w.body as Body).setCircle(w.width * 0.18, w.width * 0.32, w.height * 0.32);
      this.scene.tweens.add({ targets: w, scale: this.art ? 0.5 : 1.2, duration: 600 });
      this.enter('whirl', 3);
    }
  }

  /** Tentáculos brotam do chão em pontos marcados por bolhas. */
  private rise() {
    this.pose('atk', ATK.slam);
    const n = 3 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const x = i === 0 ? Phaser.Math.Clamp(this.host.playerX(), 80, this.hit.x - 220) : Phaser.Math.Between(80, this.hit.x - 220);
      const bubbles = this.scene.add.particles(x, this.host.groundY - 6, 'dot', {
        speedY: { min: -160, max: -60 },
        speedX: { min: -30, max: 30 },
        lifespan: 500,
        scale: { start: 0.6, end: 0.1 },
        alpha: { start: 0.8, end: 0 },
        tint: 0xdff6ff,
        frequency: 40,
      });
      bubbles.setDepth(8);
      this.scene.time.delayedCall(750 + i * 150, () => {
        bubbles.destroy();
        if (this.state === 'defeated') return;
        const s = this.shot('rise', SHOT.rise, x, this.host.groundY + 10);
        s.setOrigin(0.5, 1);
        const body = s.body as Body;
        body.setSize(s.width * 0.35, s.height * 0.85).setOffset(s.width * 0.32, s.height * 0.15);
        this.scene.tweens.add({ targets: s, scaleY: { from: 0.05, to: 0.5 }, duration: 160 });
        this.scene.time.delayedCall(800, () => s.active && s.destroy());
      });
    }
    this.enter('recover', 1.6);
  }

  /** Tentáculo varre o chão da direita para a esquerda; depois o Kraken fica exausto. */
  private sweep() {
    this.pose('atk', ATK.slam);
    this.scene.cameras.main.shake(200, 0.008);
    const s = this.shot('sweep', SHOT.sweep, this.hit.x - 200, this.host.groundY - 60);
    s.setFlipX(false);
    const body = s.body as Body;
    body.setSize(s.width * 0.8, s.height * 0.45).setOffset(s.width * 0.1, s.height * 0.5);
    s.setVelocityX(-460 * this.speed);
    this.scene.time.delayedCall(450, () => {
      if (this.state !== 'defeated') this.pose('atk', ATK.recover);
    });
    this.enter('tired', 2.2);
  }

  /** Nuvens de tinta que perseguem Íris devagar e somem depois de um tempo. */
  private ink() {
    this.pose('atk', ATK.ink);
    const n = 2 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const s = this.shot('ink', SHOT.ink, this.hit.x - 140, this.host.groundY - 120 - i * 110);
      s.setScale(this.art ? 0.32 : 1).setAlpha(0.9);
      (s.body as Body).setCircle(s.width * 0.25, s.width * 0.25, s.height * 0.25);
      this.scene.time.delayedCall(4200, () => {
        if (!s.active) return;
        this.scene.tweens.add({ targets: s, alpha: 0, duration: 400, onComplete: () => s.destroy() });
      });
    }
    this.scene.time.delayedCall(700, () => this.state !== 'defeated' && this.pose('atk', ATK.inkEnd));
    this.enter('recover', 2.4);
  }

  takeHit(): boolean {
    if (!this.vulnerable) return false;
    this.hp--;
    this.host.onBossHp(this.hp, this.maxHp);
    this.host.burst(this.hit.x, this.hit.y, 30);
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
    this.host.setWind(0);
    for (const s of this.shots.getChildren()) s.destroy();
    this.pose('end', END.crumble);
    const seq = [END.burst, END.restored];
    seq.forEach((f, i) =>
      this.scene.time.delayedCall(700 * (i + 1), () => {
        this.pose('end', f);
        this.host.burst(this.hit.x, this.hit.y - 40, 40);
        this.scene.cameras.main.shake(200, 0.008);
        if (i === seq.length - 1) this.host.onBossDefeated();
      }),
    );
  }
}
