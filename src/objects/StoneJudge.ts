import Phaser from 'phaser';
import { TILE } from '../config';
import { has } from '../gfx/art';
import type { Boss, BossHost } from './Boss';

type Body = Phaser.Physics.Arcade.Body;
type Sprite = Phaser.Physics.Arcade.Sprite;

// Frames dos atlas do chefão.
const ATK = { raise: 0, slam: 1, stuck: 2, reach: 3, throw: 4, recover: 5 };
const END = { cracked: 0, crumble: 1, burst: 2, restored: 3 };
const SHOT = { block: 0, boulder: 1, wave: 2, shards: 3, dust: 4 };

type State = 'wait' | 'idle' | 'slamWind' | 'stuck' | 'throwWind' | 'throwRecover' | 'stompWind' | 'stompRecover' | 'hurt' | 'leap' | 'defeated';

// O Juiz de Pedra (chefão do Mundo 1).
// Padrão: martelada (onda de choque no chão → martelo fica preso: hora de golpear),
// arremesso de blocos e pisão que derruba pedregulhos. A cada golpe sofrido, salta
// para o outro lado da arena e fica mais rápido.
export class StoneJudge implements Boss {
  readonly name = 'Juiz de Pedra';
  readonly hit: Phaser.GameObjects.Zone;
  readonly view: Phaser.GameObjects.Sprite;
  readonly shots: Phaser.Physics.Arcade.Group;
  readonly maxHp = 3;
  hp = 3;
  facing = -1;
  state: State = 'wait';

  private timer = 0;
  private step = 0;
  private throwsLeft = 0;
  private t = 0;
  private leapY = 0; // altura do salto (só visual)
  private art: boolean;
  private readonly pattern = ['slam', 'throw', 'slam', 'stomp'] as const;

  constructor(
    private scene: Phaser.Scene,
    private host: BossHost,
    x: number,
    solids: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.art = has(scene, 'w1_boss_idle');
    this.hit = scene.add.zone(x, host.groundY - 120, 150, 240);
    scene.physics.add.existing(this.hit);
    this.body.setAllowGravity(false).setImmovable(true);

    this.view = scene.add.sprite(x, host.groundY, this.art ? 'w1_boss_idle' : 'faded', 0).setOrigin(0.5, 1).setDepth(7);
    this.view.setScale(this.art ? 0.5 : 3);
    if (this.art && !scene.anims.exists('judge-idle')) scene.anims.create({ key: 'judge-idle', frames: [0, 1, 2, 3].map((f) => ({ key: 'w1_boss_idle', frame: String(f) })), frameRate: 5, repeat: -1, yoyo: true });
    this.idleAnim();

    this.shots = scene.physics.add.group();
    // ondas de choque deslizam rente ao chão sem colidir; blocos e pedregulhos se desfazem nele
    scene.physics.add.collider(this.shots, solids, (s) => this.shatter(s as Sprite), (s) => (s as Sprite).getData('kind') !== 'wave');
  }

  get body() {
    return this.hit.body as Body;
  }

  /** Só dá para causar dano enquanto o martelo está preso no chão. */
  get vulnerable() {
    return this.state === 'stuck';
  }

  /** Encostar no Juiz machuca, menos quando ele está preso, atordoado ou derrotado. */
  get dangerous() {
    return !['stuck', 'hurt', 'defeated', 'wait'].includes(this.state);
  }

  private get speed() {
    return 1 + (this.maxHp - this.hp) * 0.25; // fica mais rápido a cada golpe
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
    else this.view.play('judge-idle', true);
  }

  private pose(tex: 'atk' | 'end', frame: number) {
    if (!this.art) return;
    this.view.anims.stop();
    this.view.setTexture(tex === 'atk' ? 'w1_boss_attack' : 'w1_boss_end', String(frame));
  }

  update(dt: number) {
    this.t += dt;
    this.timer -= dt;
    this.view.setPosition(this.hit.x, this.host.groundY + 4 - this.leapY);
    // a arte olha para a esquerda; espelha quando o Juiz vira para a direita
    this.view.setFlipX(this.facing > 0);
    if (this.state === 'stuck') this.view.setTint(Math.sin(this.t * 20) > 0 ? 0xfff2a8 : 0xffffff);
    else if (this.state !== 'hurt') this.view.clearTint();

    for (const s of this.shots.getChildren() as Sprite[]) {
      if (s.getData('spin')) s.angle += s.getData('spin') * dt;
      if (s.getData('kind') === 'wave' && (s.x < -60 || s.x > this.host.arenaW + 60)) s.destroy();
    }

    if (this.timer > 0) return;
    switch (this.state) {
      case 'idle':
        this.nextAttack();
        break;
      case 'slamWind':
        this.slam();
        break;
      case 'stuck':
        this.pose('atk', ATK.recover);
        this.enter('stompRecover', 0.4);
        break;
      case 'throwWind':
        this.throwBlock();
        break;
      case 'throwRecover':
        if (this.throwsLeft > 0) {
          this.pose('atk', ATK.reach);
          this.enter('throwWind', 0.35);
        } else this.backToIdle();
        break;
      case 'stompWind':
        this.stomp();
        break;
      case 'stompRecover':
        this.backToIdle();
        break;
      case 'hurt':
        this.leap();
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
    if (next === 'slam') {
      this.pose('atk', ATK.raise);
      this.enter('slamWind', 0.75);
    } else if (next === 'throw') {
      this.throwsLeft = 2 + (this.maxHp - this.hp);
      this.pose('atk', ATK.reach);
      this.enter('throwWind', 0.5);
    } else {
      this.pose('atk', ATK.raise);
      this.enter('stompWind', 0.6);
    }
  }

  private slam() {
    this.pose('atk', ATK.slam);
    this.scene.cameras.main.shake(260, 0.012);
    const hammerX = this.hit.x + this.facing * 120;
    this.host.burst(hammerX, this.host.groundY - 10, 14);
    // ondas de choque para os dois lados: pule por cima!
    for (const dir of [-1, 1]) this.wave(hammerX, dir);
    this.scene.time.delayedCall(120, () => this.state === 'stuck' && this.pose('atk', ATK.stuck));
    this.enter('stuck', 1.9);
  }

  private wave(x: number, dir: number) {
    const s = this.shots.create(x, this.host.groundY - 22, this.art ? 'w1_boss_projectiles' : 'ring', this.art ? String(SHOT.wave) : undefined) as Sprite;
    const body = s.body as Body;
    body.setAllowGravity(false);
    s.setScale(this.art ? 0.32 : 1.2).setDepth(9).setFlipX(dir < 0).setData('kind', 'wave');
    body.setSize(s.width * 0.6, s.height * 0.5).setOffset(s.width * 0.2, s.height * 0.5);
    s.setVelocityX(dir * 360 * this.speed);
  }

  private throwBlock() {
    this.throwsLeft--;
    this.pose('atk', ATK.throw);
    const fromX = this.hit.x + this.facing * 90, fromY = this.host.groundY - 230;
    const s = this.shots.create(fromX, fromY, this.art ? 'w1_boss_projectiles' : 'crate', this.art ? String(SHOT.block) : undefined) as Sprite;
    s.setScale(this.art ? 0.3 : 0.8).setDepth(9).setData('kind', 'block').setData('spin', 360 * this.facing);
    const body = s.body as Body;
    body.setCircle(s.width * 0.35, s.width * 0.15, s.height * 0.15);
    // trajetória em arco que cai onde Íris está
    const flight = 1.0 / this.speed;
    const g = this.scene.physics.world.gravity.y;
    const dx = this.host.playerX() - fromX;
    const dy = this.host.groundY - 30 - fromY;
    s.setVelocity(dx / flight, (dy - 0.5 * g * flight * flight) / flight);
    this.enter('throwRecover', 0.45);
  }

  private stomp() {
    this.pose('atk', ATK.slam);
    this.scene.cameras.main.shake(400, 0.01);
    const n = 3 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Between(80, this.host.arenaW - 80);
      // sombra de aviso no chão antes do pedregulho cair
      const warn = this.scene.add.ellipse(x, this.host.groundY - 4, 90, 18, 0x000000, 0.35).setDepth(6);
      this.scene.tweens.add({ targets: warn, scaleX: { from: 0.3, to: 1 }, duration: 800 });
      this.scene.time.delayedCall(800 + i * 140, () => {
        warn.destroy();
        const s = this.shots.create(x, -60, this.art ? 'w1_boss_projectiles' : 'crate', this.art ? String(SHOT.boulder) : undefined) as Sprite;
        s.setScale(this.art ? 0.3 : 0.8).setDepth(9).setData('kind', 'boulder').setData('spin', 200);
        (s.body as Body).setCircle(s.width * 0.35, s.width * 0.15, s.height * 0.15);
      });
    }
    this.enter('stompRecover', 1.2);
  }

  /** Bloco ou pedregulho bate no chão e se desfaz. */
  private shatter(s: Sprite) {
    if (s.getData('kind') === 'wave') return;
    if (this.art) {
      const fx = this.scene.add.image(s.x, s.y, 'w1_boss_projectiles', String(SHOT.shards)).setScale(0.25).setDepth(9);
      this.scene.tweens.add({ targets: fx, alpha: 0, scale: 0.35, duration: 350, onComplete: () => fx.destroy() });
    }
    s.destroy();
  }

  /** Íris acertou o Juiz (golpe ou pisão). Devolve true se contou. */
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
    this.enter('hurt', 0.8);
    return true;
  }

  /** Salta para o outro lado da arena. */
  private leap() {
    this.state = 'leap';
    const targetX = this.hit.x > this.host.arenaW / 2 ? 3 * TILE + 60 : this.host.arenaW - 3 * TILE - 60;
    this.pose('atk', ATK.raise);
    this.scene.tweens.add({
      targets: this.hit,
      x: targetX,
      duration: 900,
      ease: 'Sine.InOut',
      onUpdate: (tw) => {
        // arco do salto (só visual)
        this.leapY = Math.sin(tw.progress * Math.PI) * 220;
      },
      onComplete: () => {
        this.leapY = 0;
        this.scene.cameras.main.shake(250, 0.01);
        this.host.burst(this.hit.x, this.host.groundY - 10, 16);
        this.backToIdle();
      },
    });
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
