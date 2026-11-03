import Phaser from 'phaser';
import { RAINBOW } from '../config';
import { canFlashScreen, canShakeCamera, getSettings } from './Settings';
import type { Boss } from '../objects/Boss';

/**
 * Final colorido da derrota de um chefão: anéis arco-íris, cacos coloridos subindo,
 * flash suave e câmera lenta. O dano de cada golpe fica por conta da arte do próprio chefe
 * (as formas "rachado" e "desmoronando" do quadro de fim).
 */
export class BossDamage {
  private slow?: number;

  constructor(private scene: Phaser.Scene, private boss: Boss, private depth = 12) {
    scene.events.once('shutdown', () => this.restoreTime());
  }

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
    this.shards(x, y, calm ? 10 : 24);
    if (canFlashScreen()) this.scene.cameras.main.flash(260, 255, 244, 214);
    if (canShakeCamera()) this.scene.cameras.main.shake(400, 0.008);
    if (!calm) this.slowMotion(420);
  }

  /** Cacos triangulares coloridos que sobem e somem. */
  private shards(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const c = RAINBOW[i % RAINBOW.length];
      const s = Phaser.Math.Between(8, 18);
      const t = this.scene.add.triangle(x + Phaser.Math.Between(-40, 40), y + Phaser.Math.Between(-50, 50), 0, s, s / 2, 0, s, s, c, 1);
      t.setDepth(this.depth + 1).setRotation(Phaser.Math.FloatBetween(0, 6)).setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: t,
        x: t.x + Phaser.Math.Between(-90, 90),
        y: t.y - Phaser.Math.Between(120, 260),
        rotation: t.rotation + Phaser.Math.FloatBetween(-5, 5),
        alpha: 0,
        duration: Phaser.Math.Between(600, 1100),
        ease: 'Cubic.Out',
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
