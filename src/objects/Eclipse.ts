import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { has } from '../gfx/art';
import type { Boss, BossHost } from './Boss';

type Body = Phaser.Physics.Arcade.Body;
type Sprite = Phaser.Physics.Arcade.Sprite;

// Frames dos atlas do chefão.
const ATK = { idle: 0, spread: 1, gust: 2, cover: 3, swirl: 4, recover: 5 };
const END = { cracked: 0, crumble: 1, burst: 2, restored: 3 };
const SHOT = { crescent: 0, wing: 1, orbComet: 2, orb: 3, shadow: 4, cloud: 5 };

type State = 'wait' | 'idle' | 'gustWind' | 'gust' | 'orbsWind' | 'rise' | 'diving' | 'dazed' | 'dark' | 'recover' | 'hurt' | 'defeated';

// Eclipse (chefão do Mundo 6), a mariposa da Dúvida. Arena com gravidade leve.
// Padrão: rajada das asas (empurra Íris e lança meias-luas); orbes de eclipse caindo;
// mergulho rasante pela arena, depois do qual fica tonto no chão: hora de atacar;
// escuridão (só um círculo de luz em volta de Íris) com cometas de sombra.
export class Eclipse implements Boss {
  readonly name = 'Eclipse';
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
  private side = 1; // 1 = está à direita da arena, -1 = à esquerda
  private lift = 0; // altura do voo (só visual + zona)
  private dark?: Phaser.GameObjects.Rectangle;
  private light?: Phaser.GameObjects.Graphics;
  private readonly pattern = ['gust', 'dive', 'orbs', 'dark', 'dive'] as const;

  constructor(
    private scene: Phaser.Scene,
    private host: BossHost,
    x: number,
    solids: Phaser.Physics.Arcade.StaticGroup,
  ) {
    this.art = has(scene, 'w6_boss_idle');
    this.hit = scene.add.zone(x + 40, host.groundY - 140, 200, 260);
    scene.physics.add.existing(this.hit);
    this.body.setAllowGravity(false).setImmovable(true);

    this.view = scene.add.sprite(x + 40, host.groundY + 8, this.art ? 'w6_boss_idle' : 'faded', 0).setOrigin(0.5, 1).setDepth(7);
    this.view.setScale(this.art ? 0.5 : 3);
    if (this.art && !scene.anims.exists('eclipse-idle')) {
      scene.anims.create({ key: 'eclipse-idle', frames: [0, 1, 2, 3].map((f) => ({ key: 'w6_boss_idle', frame: String(f) })), frameRate: 4, repeat: -1, yoyo: true });
    }
    this.idleAnim();
    this.facePlayer();
    this.shots = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.collider(this.shots, solids, (s) => this.burstShot(s as Sprite), (s) => (s as Sprite).getData('kind') === 'orb');
  }

  get body() {
    return this.hit.body as Body;
  }

  get vulnerable() {
    return this.state === 'dazed';
  }

  get dangerous() {
    return !['wait', 'dazed', 'hurt', 'defeated'].includes(this.state);
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

  /** Espelha a arte para Eclipse olhar para Íris, em vez de usar o lado da arena. */
  private facePlayer() {
    // Os frames oficiais de Eclipse apontam para a esquerda por padrão.
    this.view.setFlipX(this.host.playerX() > this.hit.x);
  }

  private idleAnim() {
    if (this.art) this.view.play('eclipse-idle', true);
  }

  private pose(tex: 'atk' | 'end', frame: number) {
    if (!this.art) return;
    this.view.anims.stop();
    this.view.setTexture(tex === 'atk' ? 'w6_boss_attack' : 'w6_boss_end', String(frame));
  }

  private shot(kind: string, frame: number, x: number, y: number, scale = 0.5) {
    const s = this.shots.create(x, y, this.art ? 'w6_boss_projectiles' : 'ring', this.art ? String(frame) : undefined) as Sprite;
    s.setScale(this.art ? scale : 1).setDepth(9).setData('kind', kind);
    return s;
  }

  update(dt: number) {
    this.t += dt;
    this.timer -= dt;
    this.view.setPosition(this.hit.x, this.host.groundY + 8 - this.lift);
    if (this.state !== 'diving') this.facePlayer();
    this.hit.y = this.host.groundY - 140 - this.lift;
    if (this.state === 'dazed') this.view.setTint(Math.sin(this.t * 18) > 0 ? 0xe8d8ff : 0xffffff);
    else if (this.state !== 'hurt') this.view.clearTint();
    if (this.state === 'idle' || this.state === 'orbsWind') this.lift = 20 + Math.sin(this.t * 2) * 12; // pairando

    for (const s of this.shots.getChildren() as Sprite[]) if (s.x < -150 || s.x > this.host.arenaW + 150 || s.y > this.host.groundY + 200) s.destroy();

    if (this.light) {
      const pb = this.host.playerBody();
      this.light.clear().fillStyle(0xffffff).fillCircle(pb.center.x, pb.center.y, 130);
    }

    if (this.timer > 0) return;
    switch (this.state) {
      case 'idle':
        this.nextAttack();
        break;
      case 'gustWind':
        this.gust();
        break;
      case 'gust':
        this.host.setWind(0);
        this.backToIdle();
        break;
      case 'orbsWind':
        this.orbs();
        break;
      case 'rise':
        this.diveAcross();
        break;
      case 'dark':
        this.lightsOn();
        this.backToIdle();
        break;
      case 'dazed':
      case 'recover':
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
    if (next === 'gust') {
      this.pose('atk', ATK.spread);
      this.enter('gustWind', 0.6);
    } else if (next === 'orbs') {
      this.pose('atk', ATK.swirl);
      this.enter('orbsWind', 0.5);
    } else if (next === 'dive') {
      this.pose('atk', ATK.cover);
      this.scene.tweens.add({ targets: this, lift: 300, duration: 600 / this.speed, ease: 'Sine.Out' });
      this.enter('rise', 0.7);
    } else this.darkness();
  }

  /** Rajada: empurra Íris para longe e lança três meias-luas em alturas diferentes. */
  private gust() {
    this.pose('atk', ATK.gust);
    const dir = -this.side;
    this.host.setWind(dir * 200);
    [60, 190, 320].forEach((h, i) =>
      this.scene.time.delayedCall(i * 260, () => {
        if (this.state === 'defeated') return;
        const s = this.shot('crescent', SHOT.crescent, this.hit.x + dir * 90, this.host.groundY - h, 0.42);
        s.setFlipX(dir > 0);
        (s.body as Body).setSize(s.width * 0.5, s.height * 0.6);
        s.setVelocityX(dir * 330 * this.speed);
      }),
    );
    this.enter('gust', 1.8);
  }

  /** Orbes de eclipse caem do céu em pontos marcados por sombras. */
  private orbs() {
    this.pose('atk', ATK.recover);
    const n = 3 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      const x = i === 0 ? Phaser.Math.Clamp(this.host.playerX(), 80, this.host.arenaW - 80) : Phaser.Math.Between(80, this.host.arenaW - 80);
      const warn = this.scene.add.ellipse(x, this.host.groundY - 4, 90, 18, 0x000000, 0.4).setDepth(6);
      this.scene.tweens.add({ targets: warn, scaleX: { from: 0.3, to: 1 }, duration: 800 });
      this.scene.time.delayedCall(800 + i * 150, () => {
        warn.destroy();
        if (this.state === 'defeated') return;
        const s = this.shot('orb', SHOT.orb, x, -60, 0.35);
        const body = s.body as Body;
        body.setAllowGravity(true).setCircle(s.width * 0.25, s.width * 0.25, s.height * 0.25);
        s.setVelocityY(200);
      });
    }
    this.enter('recover', 1.6);
  }

  /** Mergulho rasante até o outro lado da arena; ao pousar, fica tonto. */
  private diveAcross() {
    this.state = 'diving';
    const targetX = this.side > 0 ? 180 : this.host.arenaW - 180;
    this.scene.tweens.add({
      targets: this.hit,
      x: targetX,
      duration: 1000 / this.speed,
      ease: 'Sine.InOut',
      // desce do alto até rente ao chão no meio do caminho e pousa no fim
      onUpdate: (tw) => (this.lift = Math.max(0, 300 * (1 - tw.progress * 2)) + (tw.progress < 1 ? 30 : 0)),
      onComplete: () => {
        this.lift = 0;
        this.side = -this.side;
        this.facePlayer();
        this.scene.cameras.main.shake(250, 0.01);
        this.host.burst(this.hit.x, this.host.groundY - 20, 20);
        this.pose('atk', ATK.recover);
        this.enter('dazed', 2.0);
      },
    });
  }

  /** Escuridão: só um círculo de luz em volta de Íris; cometas de sombra riscam a arena. */
  private darkness() {
    this.pose('atk', ATK.swirl);
    this.light = this.scene.make.graphics({}, false);
    const mask = this.light.createGeometryMask().setInvertAlpha(true);
    this.dark = this.scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x0a0618, 0.82).setOrigin(0).setScrollFactor(0).setDepth(12).setMask(mask);
    this.dark.setAlpha(0);
    this.scene.tweens.add({ targets: this.dark, alpha: 1, duration: 500 });
    const n = 3 + (this.maxHp - this.hp);
    for (let i = 0; i < n; i++) {
      this.scene.time.delayedCall(700 + i * 650, () => {
        if (this.state !== 'dark') return;
        const fromLeft = i % 2 === 0;
        const s = this.shot('shadow', SHOT.shadow, fromLeft ? -80 : this.host.arenaW + 80, this.host.groundY - Phaser.Math.Between(40, 260), 0.4);
        s.setFlipX(!fromLeft).setDepth(13);
        (s.body as Body).setSize(s.width * 0.5, s.height * 0.4);
        s.setVelocityX((fromLeft ? 1 : -1) * 380);
      });
    }
    this.enter('dark', 4.2);
  }

  private lightsOn() {
    const dark = this.dark, light = this.light;
    this.dark = undefined;
    this.light = undefined;
    if (dark) this.scene.tweens.add({ targets: dark, alpha: 0, duration: 400, onComplete: () => (dark.destroy(), light?.destroy()) });
  }

  private burstShot(s: Sprite) {
    this.host.burst(s.x, this.host.groundY - 10, 8);
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
      this.defeat();
      return true;
    }
    this.pose('end', END.cracked);
    this.enter('hurt', 0.9);
    return true;
  }

  private defeat() {
    this.state = 'defeated';
    this.lightsOn();
    this.host.setWind(0);
    this.lift = 0;
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
