import Phaser from 'phaser';
import { has } from '../gfx/art';
import type { Boss, BossHost } from './Boss';

type Body = Phaser.Physics.Arcade.Body;
type Sprite = Phaser.Physics.Arcade.Sprite;

// Frames dos atlas do chefão.
const ATK = { idle: 0, beam: 1, aim: 2, charge: 3, flash: 4, recover: 5 };
const END = { cracked: 0, crumble: 1, burst: 2, restored: 3 };
const SHOT = { rock: 0, ghost: 1, lamp: 2, dust: 3, ring: 4, shards: 5 };

type State = 'wait' | 'idle' | 'sweep' | 'dropWind' | 'dropRecover' | 'charge' | 'overheat' | 'hurt' | 'defeated';

// O Holofote Frio (chefão do Mundo 3), o medo de ser visto. Fica parado no palco.
// Padrão: feixe que varre o chão (pule por cima); holofotes caindo (sombras avisam);
// recarga + clarão que faz chover cacos de luz. Depois do clarão o olho superaquece:
// é a hora de golpear.
export class ColdSpotlight implements Boss {
  readonly name = 'Holofote Frio';
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
  private beam: Phaser.GameObjects.Graphics;
  private beamX = 0;
  private beamFrom = 0;
  private beamTo = 0;
  private readonly pattern = ['sweep', 'flash', 'drop', 'flash'] as const;

  constructor(
    private scene: Phaser.Scene,
    private host: BossHost,
    x: number,
    solids: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.art = has(scene, 'w3_boss_idle');
    this.hit = scene.add.zone(x + 40, host.groundY - 170, 250, 340);
    scene.physics.add.existing(this.hit);
    this.body.setAllowGravity(false).setImmovable(true);

    this.view = scene.add.sprite(x + 40, host.groundY + 8, this.art ? 'w3_boss_idle' : 'faded', 0).setOrigin(0.5, 1).setDepth(7);
    this.view.setScale(this.art ? 0.5 : 3);
    if (this.art && !scene.anims.exists('spotlight-idle')) {
      scene.anims.create({ key: 'spotlight-idle', frames: [0, 1, 2, 3].map((f) => ({ key: 'w3_boss_idle', frame: String(f) })), frameRate: 4, repeat: -1, yoyo: true });
    }
    this.idleAnim();

    this.beam = scene.add.graphics().setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
    this.shots = scene.physics.add.group();
    scene.physics.add.collider(this.shots, solids, (s) => this.shatter(s as Sprite));
  }

  get body() {
    return this.hit.body as Body;
  }

  get vulnerable() {
    return this.state === 'overheat';
  }

  /** O palco não machuca ao encostar; o perigo são a luz e o que cai. */
  get dangerous() {
    return false;
  }

  private get speed() {
    return 1 + (this.maxHp - this.hp) * 0.25;
  }

  start() {
    this.enter('idle', 1.2);
  }

  private enter(s: State, time: number) {
    this.state = s;
    this.timer = time / (s === 'overheat' || s === 'hurt' ? 1 : this.speed);
  }

  private idleAnim() {
    if (this.art) this.view.play('spotlight-idle', true);
  }

  private pose(tex: 'atk' | 'end', frame: number) {
    if (!this.art) return;
    this.view.anims.stop();
    this.view.setTexture(tex === 'atk' ? 'w3_boss_attack' : 'w3_boss_end', String(frame));
  }

  private shot(kind: string, frame: number, x: number, y: number, scale: number) {
    const s = this.shots.create(x, y, this.art ? 'w3_boss_projectiles' : 'crate', this.art ? String(frame) : undefined) as Sprite;
    s.setScale(this.art ? scale : 0.8).setDepth(9).setData('kind', kind);
    return s;
  }

  update(dt: number) {
    this.t += dt;
    this.timer -= dt;
    if (this.state === 'overheat') this.view.setTint(Math.sin(this.t * 22) > 0 ? 0xffb070 : 0xffffff);
    else if (this.state === 'charge') this.view.setTint(Phaser.Display.Color.GetColor(255, 255, 200 + Math.floor(Math.sin(this.t * 30) * 55)));
    else if (this.state !== 'hurt') this.view.clearTint();

    if (this.state === 'sweep') this.updateBeam(dt);
    for (const s of this.shots.getChildren() as Sprite[]) if (s.y > this.host.groundY + 200) s.destroy();

    if (this.timer > 0) return;
    switch (this.state) {
      case 'idle':
        this.nextAttack();
        break;
      case 'sweep':
        this.beam.clear();
        this.pose('atk', ATK.recover);
        this.enter('dropRecover', 0.5);
        break;
      case 'dropWind':
        this.drop();
        break;
      case 'dropRecover':
        this.backToIdle();
        break;
      case 'charge':
        this.flash();
        break;
      case 'overheat':
        this.backToIdle();
        break;
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
    if (next === 'sweep') {
      // o feixe sai do holofote da esquerda e varre o chão até a beira do palco e volta
      this.pose('atk', ATK.beam);
      this.beamFrom = this.hit.x - 170;
      this.beamTo = 90;
      this.beamX = this.beamFrom;
      this.enter('sweep', 2.6);
    } else if (next === 'drop') {
      this.pose('atk', ATK.aim);
      this.enter('dropWind', 0.6);
    } else {
      this.pose('atk', ATK.charge);
      this.scene.cameras.main.shake(800 / this.speed, 0.003);
      this.enter('charge', 1.0);
    }
  }

  /** Feixe: cone de luz do holofote até um ponto do chão que vai e volta. */
  private updateBeam(dt: number) {
    const total = 2.6 / this.speed;
    const k = 1 - Math.max(0, this.timer) / total; // 0 → 1
    const p = k < 0.5 ? k * 2 : 2 - k * 2; // vai e volta
    this.beamX = Phaser.Math.Linear(this.beamFrom, this.beamTo, Phaser.Math.Easing.Sine.InOut(p));
    const g = this.host.groundY;
    const lx = this.hit.x - 95, ly = g - 205; // holofote da esquerda, na arte
    this.beam.clear();
    this.beam.fillStyle(0xfff6d0, 0.28).fillTriangle(lx - 12, ly, lx + 12, ly, this.beamX - 55, g).fillTriangle(lx + 12, ly, this.beamX + 55, g, this.beamX - 55, g);
    this.beam.fillStyle(0xffffff, 0.5).fillEllipse(this.beamX, g - 4, 120, 22);
    // queima quem estiver no círculo de luz perto do chão (pular por cima evita)
    const pb = this.host.playerBody();
    if (Math.abs(pb.center.x - this.beamX) < 50 && pb.bottom > g - 140) this.host.hurtPlayer(this.beamX);
    void dt;
  }

  /** Holofotes caem do teto em pontos marcados por sombras. */
  private drop() {
    this.pose('atk', ATK.recover);
    const n = 3 + (this.maxHp - this.hp);
    const xs = Array.from({ length: n }, (_, i) => 100 + ((this.hit.x - 260) / n) * (i + Phaser.Math.FloatBetween(0.2, 0.8)));
    if (n > 3) xs[0] = Phaser.Math.Clamp(this.host.playerX(), 90, this.hit.x - 180); // um deles mira em Íris
    xs.forEach((x, i) => {
      const warn = this.scene.add.ellipse(x, this.host.groundY - 4, 90, 18, 0x000000, 0.35).setDepth(6);
      this.scene.tweens.add({ targets: warn, scaleX: { from: 0.3, to: 1 }, duration: 750 });
      this.scene.time.delayedCall(750 + i * 120, () => {
        warn.destroy();
        if (this.state === 'defeated') return;
        const s = this.shot('lamp', SHOT.lamp, x, -80, 0.32);
        s.setAngle(180 + Phaser.Math.Between(-15, 15)); // luz apontando para baixo
        (s.body as Body).setSize(s.width * 0.5, s.height * 0.5);
      });
    });
    this.enter('dropRecover', 1.4);
  }

  /** Clarão: tela branca e chuva de cacos de luz; depois o olho superaquece. */
  private flash() {
    this.pose('atk', ATK.flash);
    this.scene.cameras.main.flash(260, 255, 255, 235);
    const n = 5 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const x = 90 + ((this.hit.x - 220) / n) * (i + 0.5) + Phaser.Math.Between(-30, 30);
      this.scene.time.delayedCall(250 + i * 90, () => {
        if (this.state === 'defeated') return;
        const s = this.shot('shard', SHOT.shards, x, -60, 0.26);
        (s.body as Body).setSize(s.width * 0.35, s.height * 0.7);
      });
    }
    this.scene.time.delayedCall(450, () => this.state === 'overheat' && this.pose('atk', ATK.idle));
    this.enter('overheat', 2.6);
  }

  private shatter(s: Sprite) {
    if (this.art) {
      const fx = this.scene.add.image(s.x, this.host.groundY + 6, 'w3_boss_projectiles', String(SHOT.ring)).setOrigin(0.5, 1).setScale(0.28).setDepth(8);
      this.scene.tweens.add({ targets: fx, alpha: 0, scale: 0.36, duration: 350, onComplete: () => fx.destroy() });
    }
    s.destroy();
  }

  takeHit(): boolean {
    if (!this.vulnerable) return false;
    this.hp--;
    this.host.onBossHp(this.hp, this.maxHp);
    this.host.burst(this.hit.x - 40, this.hit.y - 40, 30);
    this.scene.cameras.main.shake(200, 0.012);
    this.view.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => this.view.clearTint());
    if (this.hp <= 0) {
      this.defeat();
      return true;
    }
    this.pose('end', END.cracked);
    this.enter('hurt', 0.9);
    return true;
  }

  private defeat() {
    this.state = 'defeated';
    this.beam.clear();
    for (const s of this.shots.getChildren()) s.destroy();
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
