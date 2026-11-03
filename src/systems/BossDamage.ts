import Phaser from 'phaser';
import { RAINBOW } from '../config';
import { canFlashScreen, canShakeCamera, getSettings } from './Settings';
import type { Boss } from '../objects/Boss';

/**
 * Dano visual progressivo dos chefões: a cada golpe surgem rachaduras (com luz de uma
 * cor do arco-íris vazando) e cacos caem do corpo; na derrota há um anel colorido,
 * cacos subindo e (se permitido) um flash suave. Não depende da arte de cada chefe:
 * trabalha em cima da caixa de colisão (`boss.body`).
 */
export class BossDamage {
  private cracks: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Graphics;
  private lastHp = -1;
  private hits = 0;
  private lines: { pts: Phaser.Math.Vector2[]; color: number }[] = [];
  private slow?: number;

  constructor(private scene: Phaser.Scene, private boss: Boss, private depth = 12) {
    this.cracks = scene.add.graphics().setDepth(depth);
    this.glow = scene.add.graphics().setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
    scene.events.once('shutdown', () => this.restoreTime());
  }

  /** Chamado a cada mudança de vida (inclui a troca de forma, quando a vida volta ao máximo). */
  onHp(hp: number, max: number) {
    if (this.lastHp >= 0 && hp > this.lastHp) this.clear(); // nova forma: tira as rachaduras
    else if (this.lastHp >= 0 && hp < this.lastHp) this.hurt(1 - hp / max);
    this.lastHp = hp;
  }

  /** Acompanha o chefe (as rachaduras são redesenhadas na posição atual). */
  update() {
    if (!this.boss.view.active || this.lines.length === 0) return;
    const b = this.boss.body;
    this.cracks.setPosition(b.center.x, b.center.y);
    this.glow.setPosition(b.center.x, b.center.y);
    const a = this.boss.view.alpha;
    this.cracks.setAlpha(a);
    this.glow.setAlpha(a * (0.7 + 0.3 * Math.sin(this.scene.time.now / 260)));
  }

  /** Derrota: anel arco-íris, cacos subindo, câmera lenta e flash suave. */
  finale() {
    const x = this.boss.hit.x, y = this.boss.hit.y - 40;
    const calm = getSettings().reduceMotion;
    RAINBOW.forEach((c, i) => {
      const ring = this.scene.add.circle(x, y, 20, c, 0).setStrokeStyle(8, c, 0.95).setDepth(this.depth + 1);
      ring.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: ring,
        radius: 260 + i * 38,
        alpha: 0,
        duration: 900 + i * 90,
        delay: i * 70,
        ease: 'Cubic.Out',
        onComplete: () => ring.destroy(),
      });
    });
    this.shards(x, y, calm ? 10 : 24, true);
    this.cracks.destroy();
    this.glow.destroy();
    if (canFlashScreen()) this.scene.cameras.main.flash(260, 255, 244, 214);
    if (canShakeCamera()) this.scene.cameras.main.shake(400, 0.008);
    if (!calm) this.slowMotion(420);
  }

  // ---------- internos ----------

  private hurt(damage: number) {
    this.hits++;
    const color = RAINBOW[(this.hits - 1) % RAINBOW.length];
    const b = this.boss.body;
    const w = b.width * 0.7, h = b.height * 0.7;
    // cada golpe abre 1–2 rachaduras novas, mais longas conforme o dano acumulado
    const n = 2 + (damage > 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const start = new Phaser.Math.Vector2(Phaser.Math.FloatBetween(-w / 2, w / 2), Phaser.Math.FloatBetween(-h / 2, h / 2));
      this.lines.push({ pts: this.crack(start, w, h, 3 + Math.round(damage * 4)), color });
    }
    this.redraw();
    this.shards(b.center.x, b.center.y, getSettings().reduceMotion ? 3 : 6, false);
  }

  /** Linha quebrada que se afasta do ponto inicial, sempre dentro da caixa do chefe. */
  private crack(from: Phaser.Math.Vector2, w: number, h: number, segs: number) {
    const pts = [from.clone()];
    let ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
    let p = from.clone();
    for (let i = 0; i < segs; i++) {
      ang += Phaser.Math.FloatBetween(-0.9, 0.9);
      const len = Phaser.Math.Between(14, 34);
      p = new Phaser.Math.Vector2(
        Phaser.Math.Clamp(p.x + Math.cos(ang) * len, -w / 2, w / 2),
        Phaser.Math.Clamp(p.y + Math.sin(ang) * len, -h / 2, h / 2),
      );
      pts.push(p.clone());
    }
    return pts;
  }

  private redraw() {
    this.cracks.clear();
    this.glow.clear();
    for (const l of this.lines) {
      this.cracks.lineStyle(8, 0x120d1a, 0.9);
      this.cracks.beginPath();
      l.pts.forEach((p, i) => (i ? this.cracks.lineTo(p.x, p.y) : this.cracks.moveTo(p.x, p.y)));
      this.cracks.strokePath();
      this.glow.lineStyle(5, l.color, 1);
      this.glow.beginPath();
      l.pts.forEach((p, i) => (i ? this.glow.lineTo(p.x, p.y) : this.glow.moveTo(p.x, p.y)));
      this.glow.strokePath();
    }
  }

  private clear() {
    this.lines = [];
    this.hits = 0;
    this.cracks.clear();
    this.glow.clear();
  }

  /** Cacos triangulares: caem do corpo (golpe) ou sobem coloridos (derrota). */
  private shards(x: number, y: number, n: number, up: boolean) {
    for (let i = 0; i < n; i++) {
      const c = RAINBOW[i % RAINBOW.length];
      const s = Phaser.Math.Between(8, 18);
      const t = this.scene.add.triangle(
        x + Phaser.Math.Between(-40, 40), y + Phaser.Math.Between(-50, 50), 0, s, s / 2, 0, s, s, up ? c : 0x2a2433, 1,
      );
      t.setDepth(this.depth + 1).setRotation(Phaser.Math.FloatBetween(0, 6));
      if (up) t.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: t,
        x: t.x + Phaser.Math.Between(-90, 90),
        y: t.y + (up ? -Phaser.Math.Between(120, 260) : Phaser.Math.Between(110, 200)),
        rotation: t.rotation + Phaser.Math.FloatBetween(-5, 5),
        alpha: 0,
        duration: Phaser.Math.Between(600, 1100),
        ease: up ? 'Cubic.Out' : 'Quad.In',
        onComplete: () => t.destroy(),
      });
    }
  }

  private slowMotion(ms: number) {
    this.scene.time.timeScale = 0.35;
    this.scene.tweens.timeScale = 0.35;
    this.slow = window.setTimeout(() => this.restoreTime(), ms); // tempo real
  }

  private restoreTime() {
    if (this.slow !== undefined) window.clearTimeout(this.slow);
    this.slow = undefined;
    if (this.scene.time) this.scene.time.timeScale = 1;
    if (this.scene.tweens) this.scene.tweens.timeScale = 1;
  }
}
