import Phaser from 'phaser';
import { TILE } from '../config';
import { getSettings, gfx } from './Settings';

// Tempestade de areia (Cânion do Entardecer): um paredão de areia nasce atrás de Íris e
// avança pela fase. Não é rolagem forçada: a câmera continua seguindo Íris, e quem dita
// o ritmo é a parede. Encostar nela tira um coração e a tempestade recua um pouco, dando
// outra chance; ela se desfaz ao chegar ao fim do trecho.

export interface StormHost {
  scene: Phaser.Scene;
  playerX(): number;
  playerDead(): boolean;
  /** Tira um coração de Íris, empurrando-a para a frente; devolve false se ela estava invulnerável. */
  hurt(fromX: number): boolean;
  shake(ms: number, intensity: number): void;
  toast(text: string): void;
}

const SAND = 0xd9a45c;
const BACK = 7 * TILE; // distância atrás do gatilho em que a tempestade nasce
const RETREAT = 5 * TILE; // recuo depois de alcançar Íris

export class Storm {
  private state: 'idle' | 'chasing' | 'done' = 'idle';
  private x = 0; // frente da tempestade
  private pause = 0;
  private readonly gfxWall: Phaser.GameObjects.Graphics;
  private readonly dust?: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly speed: number;
  private t = 0;

  /**
   * @param startX  ponto em que Íris dispara a tempestade
   * @param endX    onde a tempestade se desfaz
   * @param speed   px/s na dificuldade normal
   */
  constructor(private host: StormHost, private startX: number, private endX: number, speed: number, private worldH: number) {
    const d = getSettings().difficulty;
    this.speed = speed * (d === 'easy' ? 0.85 : d === 'hard' ? 1.12 : 1);
    const { scene } = host;
    this.gfxWall = scene.add.graphics().setDepth(12).setVisible(false);
    if (!getSettings().reduceMotion) {
      this.dust = scene.add.particles(0, 0, 'dot', {
        x: { min: -90, max: 30 },
        y: { min: 0, max: worldH },
        speedX: { min: 60, max: 260 },
        speedY: { min: -140, max: 60 },
        lifespan: { min: 500, max: 1100 },
        scale: { start: 0.9, end: 0.1 },
        alpha: { start: 0.9, end: 0 },
        tint: [SAND, 0xf3d9a4, 0xb9793a],
        frequency: gfx().particles >= 1 ? 14 : 36,
        emitting: false,
      }).setDepth(12);
    }
  }

  /** Posição da frente (para testes e para a câmera, se um dia precisar). */
  get front() {
    return this.state === 'chasing' ? this.x : -Infinity;
  }

  get active() {
    return this.state === 'chasing';
  }

  update(dt: number) {
    const px = this.host.playerX();
    this.t += dt;
    if (this.state === 'idle') {
      if (px > this.startX && !this.host.playerDead()) {
        this.state = 'chasing';
        this.x = this.startX - BACK;
        this.pause = 0.5;
        this.gfxWall.setVisible(true).setAlpha(0);
        this.host.scene.tweens.add({ targets: this.gfxWall, alpha: 1, duration: 400 });
        this.dust?.start();
        this.host.toast('Tempestade de areia: corra!');
        this.host.shake(260, 0.004);
      }
      return;
    }
    if (this.state !== 'chasing') return;

    // Íris voltou ao checkpoint antes do gatilho (perdeu a vida): a tempestade recomeça do zero
    if (px < this.startX - TILE) {
      this.reset();
      return;
    }
    this.pause -= dt;
    if (this.pause <= 0) this.x += this.speed * dt;
    if (!this.host.playerDead() && px < this.x - 6 && this.host.hurt(this.x - 200)) {
      // alcançou: recua e espera um instante
      this.x = Math.max(this.startX - BACK, this.x - RETREAT);
      this.pause = 1.1;
      this.host.shake(180, 0.006);
    }
    if (this.x >= this.endX) {
      this.state = 'done';
      this.dust?.stop();
      this.host.scene.tweens.add({ targets: this.gfxWall, alpha: 0, duration: 900, onComplete: () => this.gfxWall.setVisible(false) });
      this.host.toast('A tempestade passou!');
      return;
    }
    this.draw();
  }

  private reset() {
    this.state = 'idle';
    this.dust?.stop();
    this.host.scene.tweens.killTweensOf(this.gfxWall);
    this.gfxWall.setVisible(false);
  }

  private draw() {
    const g = this.gfxWall, x = this.x, h = this.worldH + 400, top = -200;
    g.clear();
    // corpo opaco, mais escuro para dentro, e uma frente larga e esfumada que respira
    const edge = 240 + Math.sin(this.t * 2.2) * 30;
    g.fillStyle(0xb9793a, 0.96).fillRect(x - 2600, top, 2600 - edge - 380, h);
    g.fillGradientStyle(0xb9793a, SAND, 0xb9793a, SAND, 0.96, 0.94, 0.96, 0.94).fillRect(x - edge - 380, top, 380, h);
    g.fillGradientStyle(SAND, 0xf3d9a4, SAND, 0xf3d9a4, 0.94, 0, 0.94, 0).fillRect(x - edge, top, edge, h);
    // véus de areia que correm à frente, em alturas alternadas
    for (let i = 0; i < 6; i++) {
      const y = top + ((i * 173 + this.t * 60) % h);
      const reach = 120 + Math.sin(this.t * 1.7 + i * 2.1) * 60;
      g.fillGradientStyle(0xf3d9a4, 0xf3d9a4, 0xf3d9a4, 0xf3d9a4, 0.22, 0, 0.22, 0).fillRect(x - 40, y, reach + 40, 8);
    }
    this.dust?.setPosition(x, 0);
  }
}
