import Phaser from 'phaser';
import { has } from '../gfx/art';
import type { Boss, BossHost } from './Boss';
import { MONO_MASKS } from '../story/w7';

type Body = Phaser.Physics.Arcade.Body;
type Sprite = Phaser.Physics.Arcade.Sprite;

// Frames dos atlas (as duas formas usam a mesma ordem de quadros).
const ATK = { a: 0, b: 1, c: 2, raise: 3, charge: 4, recover: 5 };
const END = { cracked: 0, crumble: 1, burst: 2, restored: 3 };
const SHOT = { boulder: 0, mask: 1, tornado: 2, spike: 3, ring: 4, orb: 5 };

type State = 'wait' | 'idle' | 'masksWind' | 'spikesWind' | 'charge' | 'bouldersWind' | 'tornadoWind' | 'orbsWind' | 'recover' | 'exposed' | 'hurt' | 'transform' | 'defeated';

// Monocromo (chefão final), a Conformidade. Duas formas, 3 golpes cada.
// Forma 1 (manto de névoa e máscaras): máscaras fantasmas que perseguem Íris; espinhos de
// cristal brotando em sequência; carga de energia que o deixa sobrecarregado: hora de atacar.
// Forma 2 (armadura de cristal): pedregulhos caindo; tornado atravessando a arena; orbes
// rachados que quicam; redemoinho de névoa que termina com ele exposto.
export class Monochrome implements Boss {
  name = 'Monocromo';
  readonly hit: Phaser.GameObjects.Zone;
  readonly view: Phaser.GameObjects.Sprite;
  readonly shots: Phaser.Physics.Arcade.Group;
  readonly maxHp = 3;
  hp = 3;
  phase = 1;
  state: State = 'wait';

  private timer = 0;
  private step = 0;
  private t = 0;
  private art: boolean;

  constructor(
    private scene: Phaser.Scene,
    private host: BossHost,
    x: number,
    solids: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.art = has(scene, 'w7_boss_p1_idle');
    this.hit = scene.add.zone(x + 40, host.groundY - 165, 230, 320);
    scene.physics.add.existing(this.hit);
    this.body.setAllowGravity(false).setImmovable(true);

    this.view = scene.add.sprite(x + 40, host.groundY + 8, this.art ? 'w7_boss_p1_idle' : 'faded', 0).setOrigin(0.5, 1).setDepth(7);
    this.view.setScale(this.art ? 0.5 : 3);
    // a arte olha para a direita; a cena da fase vira o chefão para o lado de Íris a cada quadro
    this.view.setFlipX(true);
    for (const p of [1, 2]) {
      const key = `mono-idle-${p}`, tex = `w7_boss_p${p}_idle`;
      if (this.art && !scene.anims.exists(key)) {
        scene.anims.create({ key, frames: [0, 1, 2, 3].map((f) => ({ key: tex, frame: String(f) })), frameRate: 4, repeat: -1, yoyo: true });
      }
    }
    this.idleAnim();
    this.shots = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.collider(this.shots, solids, (s) => this.landed(s as Sprite), (s) => ['boulder', 'orb'].includes((s as Sprite).getData('kind')));
  }

  get body() {
    return this.hit.body as Body;
  }

  get vulnerable() {
    return this.state === 'exposed';
  }

  get dangerous() {
    return !['wait', 'exposed', 'hurt', 'transform', 'defeated'].includes(this.state);
  }

  private get speed() {
    return 1 + (this.maxHp - this.hp) * 0.2 + (this.phase - 1) * 0.15;
  }

  start() {
    this.enter('idle', 1.2);
  }

  private enter(s: State, time: number) {
    this.state = s;
    this.timer = time / (s === 'exposed' || s === 'hurt' ? 1 : this.speed);
  }

  /** Parado: mostra a forma atual do chefe (inteira, rachada ou desmoronando, conforme os golpes que levou). */
  private idleAnim() {
    if (!this.art) return;
    const lost = this.maxHp - this.hp;
    if (lost > 0) this.pose('end', Math.min(lost, 2) - 1);
    else this.view.play(`mono-idle-${this.phase}`, true);
  }

  private pose(tex: 'atk' | 'end', frame: number, phase = this.phase) {
    if (!this.art) return;
    this.view.anims.stop();
    this.view.setTexture(`w7_boss_p${phase}_${tex === 'atk' ? 'attack' : 'end'}`, String(frame));
  }

  private shot(kind: string, frame: number, x: number, y: number, scale = 0.5) {
    const s = this.shots.create(x, y, this.art ? 'w7_boss_projectiles' : 'ring', this.art ? String(frame) : undefined) as Sprite;
    s.setScale(this.art ? scale : 1).setDepth(9).setData('kind', kind);
    return s;
  }

  update(dt: number) {
    this.t += dt;
    this.timer -= dt;
    if (this.state === 'exposed') this.view.setTint(Math.sin(this.t * 18) > 0 ? 0xe0c8ff : 0xffffff);
    else if (this.state !== 'hurt') this.view.clearTint();

    const pb = this.host.playerBody();
    for (const s of this.shots.getChildren() as Sprite[]) {
      const kind = s.getData('kind');
      if (kind === 'mask') {
        // máscaras perseguem Íris devagar
        const a = Math.atan2(pb.center.y - s.y, pb.center.x - s.x);
        const v = 150 * this.speed;
        s.setVelocity(s.body!.velocity.x * 0.96 + Math.cos(a) * v * 0.04, s.body!.velocity.y * 0.96 + Math.sin(a) * v * 0.04);
      } else if (kind === 'tornado') s.angle = Math.sin(this.t * 30) * 4;
      if (s.x < -150 || s.x > this.host.arenaW + 150 || s.y > this.host.groundY + 200) s.destroy();
    }

    if (this.timer > 0) return;
    switch (this.state) {
      case 'idle':
        this.nextAttack();
        break;
      case 'masksWind':
        this.masks();
        break;
      case 'spikesWind':
        this.spikes();
        break;
      case 'charge':
        // a carga estoura e deixa o núcleo exposto
        this.scene.cameras.main.flash(200, 200, 160, 255);
        this.pose('atk', ATK.recover);
        this.enter('exposed', 2.2);
        break;
      case 'bouldersWind':
        this.boulders();
        break;
      case 'tornadoWind':
        this.tornado();
        break;
      case 'orbsWind':
        this.orbs();
        break;
      case 'recover':
      case 'exposed':
      case 'hurt':
        this.backToIdle();
        break;
    }
  }

  private backToIdle() {
    this.view.clearTint();
    this.idleAnim();
    this.enter('idle', 0.7);
  }

  private nextAttack() {
    const p1 = ['masks', 'spikes', 'charge'] as const;
    const p2 = ['boulders', 'tornado', 'charge', 'orbs', 'charge'] as const;
    const pattern = this.phase === 1 ? p1 : p2;
    const next = pattern[this.step++ % pattern.length];
    if (next === 'masks') {
      this.pose('atk', ATK.a);
      this.enter('masksWind', 0.6);
    } else if (next === 'spikes') {
      this.pose('atk', ATK.raise);
      this.enter('spikesWind', 0.6);
    } else if (next === 'boulders') {
      this.pose('atk', ATK.b);
      this.enter('bouldersWind', 0.5);
    } else if (next === 'tornado') {
      this.pose('atk', ATK.raise);
      this.enter('tornadoWind', 0.6);
    } else if (next === 'orbs') {
      this.pose('atk', ATK.b);
      this.enter('orbsWind', 0.5);
    } else {
      // carga: treme e brilha antes de ficar exposto
      this.pose('atk', ATK.charge);
      this.scene.cameras.main.shake(1000 / this.speed, 0.004);
      this.enter('charge', 1.4);
    }
  }

  /** Máscaras fantasmas saem do manto e perseguem Íris por alguns segundos. */
  private masks() {
    this.pose('atk', ATK.b);
    const n = 2 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const s = this.shot('mask', SHOT.mask, this.hit.x - 120, this.host.groundY - 260 + i * 70, 0.38);
      (s.body as Body).setCircle(s.width * 0.22, s.width * 0.28, s.height * 0.28);
      s.setVelocity(-180, Phaser.Math.Between(-60, 60));
      this.scene.time.delayedCall(4000, () => s.active && this.scene.tweens.add({ targets: s, alpha: 0, duration: 300, onComplete: () => s.destroy() }));
    }
    this.enter('recover', 1.8);
  }

  /** Espinhos de cristal brotam do chão em sequência, do trono até a borda. */
  private spikes() {
    for (let i = 0; i < 8; i++) {
      const x = this.hit.x - 200 - i * 115;
      if (x < 40) break;
      this.scene.time.delayedCall((i * 220) / this.speed, () => {
        if (this.state === 'defeated' || this.state === 'transform') return;
        const warn = this.scene.add.ellipse(x, this.host.groundY - 4, 70, 14, 0xb15bff, 0.5).setDepth(6);
        this.scene.time.delayedCall(380, () => {
          warn.destroy();
          if (this.state === 'defeated' || this.state === 'transform') return;
          const s = this.shot('spike', SHOT.spike, x, this.host.groundY + 6, 0.42);
          s.setOrigin(0.5, 1);
          (s.body as Body).setImmovable(true).setSize(s.width * 0.45, s.height * 0.75).setOffset(s.width * 0.27, s.height * 0.25);
          this.scene.tweens.add({ targets: s, scaleY: { from: 0.05, to: 0.42 }, duration: 110 });
          this.scene.time.delayedCall(700, () => s.active && s.destroy());
        });
      });
    }
    this.enter('recover', 2.4);
  }

  /** Pedregulhos caem em pontos marcados por sombras (um deles em cima de Íris). */
  private boulders() {
    this.pose('atk', ATK.c);
    const n = 4 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const x = i === 0 ? Phaser.Math.Clamp(this.host.playerX(), 80, this.hit.x - 180) : Phaser.Math.Between(80, this.hit.x - 180);
      const warn = this.scene.add.ellipse(x, this.host.groundY - 4, 90, 18, 0x000000, 0.4).setDepth(6);
      this.scene.tweens.add({ targets: warn, scaleX: { from: 0.3, to: 1 }, duration: 750 });
      this.scene.time.delayedCall(750 + i * 130, () => {
        warn.destroy();
        if (this.state === 'defeated' || this.state === 'transform') return;
        const s = this.shot('boulder', SHOT.boulder, x, -60, 0.38);
        const body = s.body as Body;
        body.setAllowGravity(true).setCircle(s.width * 0.28, s.width * 0.22, s.height * 0.22);
      });
    }
    this.enter('recover', 1.6);
  }

  /** Tornado de névoa atravessa a arena rente ao chão: pule ou use o dash. */
  private tornado() {
    this.pose('atk', ATK.charge);
    const s = this.shot('tornado', SHOT.tornado, this.hit.x - 150, this.host.groundY - 80, 0.55);
    (s.body as Body).setSize(s.width * 0.45, s.height * 0.75).setOffset(s.width * 0.27, s.height * 0.2);
    s.setVelocityX(-340 * this.speed);
    this.enter('recover', 1.5);
  }

  /** Orbes rachados quicam pela arena. */
  private orbs() {
    this.pose('atk', ATK.c);
    const n = 2 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const s = this.shot('orb', SHOT.orb, this.hit.x - 140, this.host.groundY - 250 - i * 40, 0.36);
      const body = s.body as Body;
      body.setAllowGravity(true).setCircle(s.width * 0.3, s.width * 0.2, s.height * 0.2).setBounce(0.85, 0.85);
      s.setVelocity(-Phaser.Math.Between(180, 320), -Phaser.Math.Between(100, 300)).setData('bounces', 0);
      this.scene.time.delayedCall(4500, () => s.active && s.destroy());
    }
    this.enter('recover', 1.6);
  }

  /** Pedregulho se desfaz no chão; orbe quica algumas vezes antes de estourar. */
  private landed(s: Sprite) {
    if (s.getData('kind') === 'orb') {
      const n = (s.getData('bounces') ?? 0) + 1;
      s.setData('bounces', n);
      if (n < 4) return;
    }
    this.host.burst(s.x, this.host.groundY - 10, 10);
    s.destroy();
  }

  takeHit(): boolean {
    if (!this.vulnerable) return false;
    this.hp--;
    this.host.onBossHp(this.hp, this.maxHp);
    this.host.burst(this.hit.x, this.hit.y - 20, 30);
    this.scene.cameras.main.shake(200, 0.012);
    this.view.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => this.view.clearTint());
    if (this.hp <= 0) {
      if (this.phase === 1) this.transform();
      else this.defeat();
      return true;
    }
    this.pose('end', Math.min(this.maxHp - this.hp, 2) - 1);
    this.unravel();
    this.enter('hurt', 0.9);
    return true;
  }

  /** A cada golpe a transformação avança: raios, escurecer rápido e uma fala curta (sem parar a luta). */
  private unravel() {
    const lost = this.maxHp - this.hp;
    this.host.stormFlash(this.phase === 1 ? lost : 1);
    if (this.phase === 1) {
      this.host.dim(0.3 * lost, 200);
      this.scene.time.delayedCall(500, () => this.state !== 'transform' && this.host.dim(0, 500));
      this.scene.events.emit('toast', lost === 1 ? 'Monocromo: A máscara... rachou?!' : 'Monocromo: NÃO! Ela está caindo!');
    }
  }

  /** Fim da forma 1: a máscara racha e cai, o medo fala, e ele volta em armadura de cristal. */
  private transform() {
    this.state = 'transform';
    for (const s of this.shots.getChildren()) s.destroy();
    this.pose('end', END.crumble, 1);
    this.host.dim(0.45, 350);
    this.scene.time.delayedCall(600, () => {
      this.pose('end', END.crumble, 1);
      this.scene.cameras.main.shake(600, 0.015);
      this.host.burst(this.hit.x, this.hit.y, 40);
      this.host.stormFlash(1);
    });
    this.scene.time.delayedCall(1500, () => this.host.cinematic(MONO_MASKS, () => this.reveal()));
  }

  /** Depois da fala: rajada de raios, a armadura surge e a luta recomeça. */
  private reveal() {
    this.host.dim(0.9, 250);
    this.host.stormFlash(3);
    this.scene.cameras.main.shake(500, 0.012);
    this.scene.time.delayedCall(550, () => {
      this.phase = 2;
      this.name = 'Monocromo · forma final';
      this.hp = this.maxHp;
      this.step = 0;
      this.host.burst(this.hit.x, this.hit.y - 40, 40);
      this.host.dim(0, 600);
      this.idleAnim();
      this.host.onBossHp(this.hp, this.maxHp);
    });
    this.scene.time.delayedCall(1400, () => this.enter('idle', 1.2));
  }

  private defeat() {
    this.state = 'defeated';
    for (const s of this.shots.getChildren()) s.destroy();
    this.pose('end', END.crumble);
    const seq = [END.burst, END.restored];
    seq.forEach((f, i) =>
      this.scene.time.delayedCall(800 * (i + 1), () => {
        this.pose('end', f);
        this.host.burst(this.hit.x, this.hit.y - 60, 50);
        this.scene.cameras.main.shake(250, 0.01);
        if (i === seq.length - 1) this.host.onBossDefeated();
      }),
    );
  }
}
