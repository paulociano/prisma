import Phaser from 'phaser';
import { applyColorblind } from '../systems/Settings';
import { GAME_H, GAME_W, RAINBOW } from '../config';
import { has } from '../gfx/art';
import { textStyle } from '../gfx/ui';
import { playMusic } from '../systems/Audio';

// Final do jogo: o mundo restaurado, os sete guardiões juntos e os créditos subindo.
// Qualquer tecla (depois dos créditos) volta para a tela título.
export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create() {
    applyColorblind(this);
    if (has(this, 'title_bg')) this.add.image(GAME_W / 2, GAME_H / 2, 'title_bg').setDisplaySize(GAME_W, (GAME_W / 1536) * 1024);
    else this.add.rectangle(0, 0, GAME_W, GAME_H, 0x4b2a7a).setOrigin(0);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120d1a, 0.35).setOrigin(0);

    // fogos de artifício em arco-íris
    this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => {
        const em = this.add.particles(Phaser.Math.Between(150, GAME_W - 150), Phaser.Math.Between(80, 300), 'dot', {
          speed: { min: 80, max: 260 },
          lifespan: 1100,
          scale: { start: 0.7, end: 0 },
          tint: RAINBOW,
          gravityY: 120,
          emitting: false,
        });
        em.explode(40);
        this.time.delayedCall(1200, () => em.destroy());
      },
    });

    // os guardiões e Íris, em fila, entrando um por um
    const crew: [string, string][] = [
      ['w1_guardian', '0'],
      ['w2_guardian', '0'],
      ['w2_luna', '0'],
      ['w3_guardian', '0'],
      ['w4_guardian', '0'],
      ['iris_hurt_win', '4'],
      ['w5_guardian', '0'],
      ['w6_guardian', '0'],
      ['w7_guardian', '0'],
    ];
    const present = crew.filter(([tex]) => has(this, tex));
    const gap = Math.min(130, (GAME_W - 120) / present.length);
    const x0 = GAME_W / 2 - ((present.length - 1) * gap) / 2;
    present.forEach(([tex, frame], i) => {
      const img = this.add.image(x0 + i * gap, GAME_H - 40, tex, frame).setOrigin(0.5, 1);
      img.setScale((tex.startsWith('iris') ? 150 : 165) / img.height).setAlpha(0);
      this.tweens.add({ targets: img, alpha: 1, y: GAME_H - 30, delay: 400 + i * 250, duration: 500, ease: 'Back.Out' });
      this.tweens.add({ targets: img, y: '-=8', delay: 1400 + i * 120, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });

    const lines = [
      'PRISMA',
      '',
      'As sete cores voltaram.',
      'Ninguém precisou se apagar para caber.',
      '',
      'Íris  ·  Faísca',
      'Mãe Rubi  ·  Sol & Luna  ·  Aurora',
      'Ramo  ·  Marina  ·  Bix  ·  Ás',
      '',
      'e todo mundo que brilha do próprio jeito.',
      '',
      'Obrigade por jogar. 🏳️‍🌈',
    ];
    const credits = this.add.text(GAME_W / 2, GAME_H + 20, lines.join('\n'), { ...textStyle(25), align: 'center', lineSpacing: 9 }).setOrigin(0.5, 0);
    this.tweens.add({
      targets: credits,
      y: 24, // termina acima da fila de personagens
      duration: 14000,
      ease: 'Sine.Out',
      onComplete: () => {
        const hint = this.add.text(GAME_W / 2, GAME_H - 215, 'aperte qualquer tecla', textStyle(20)).setOrigin(0.5);
        this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
        this.input.keyboard!.once('keydown', () => this.leave());
        this.input.once('pointerdown', () => this.leave());
      },
    });

    playMusic(this, 'ending');
    this.cameras.main.fadeIn(1200, 255, 255, 255);
  }

  private leave() {
    this.cameras.main.fadeOut(600);
    this.time.delayedCall(620, () => this.scene.start('Title'));
  }
}
