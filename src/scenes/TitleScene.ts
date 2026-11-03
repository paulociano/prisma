import Phaser from 'phaser';
import { applyColorblind } from '../systems/Settings';
import { GAME_H, GAME_W, RAINBOW } from '../config';
import { has } from '../gfx/art';
import { button, menuNav, textStyle } from '../gfx/ui';
import { playMusic } from '../systems/Audio';
import { isTouchDevice } from '../systems/Touch';
import { INTRO } from './CutsceneScene';
import { clearSave, hasSave } from '../systems/Save';

// Tela título: fundo ilustrado, logo flutuando e o menu inicial.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    applyColorblind(this);
    if (has(this, 'title_bg')) this.add.image(GAME_W / 2, GAME_H / 2, 'title_bg').setDisplaySize(GAME_W, (GAME_W / 1536) * 1024);
    else this.add.rectangle(0, 0, GAME_W, GAME_H, 0x4b2a7a).setOrigin(0);

    // faíscas subindo
    this.add.particles(0, GAME_H + 10, 'dot', {
      x: { min: 0, max: GAME_W },
      speedY: { min: -60, max: -20 },
      lifespan: 9000,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: RAINBOW,
      frequency: 220,
    });

    const logo = has(this, 'logo')
      ? this.add.image(GAME_W / 2 - 150, 150, 'logo').setScale(0.72)
      : this.add.text(GAME_W / 2 - 150, 150, 'PRISMA', textStyle(110)).setOrigin(0.5);
    this.tweens.add({ targets: logo, y: logo.y + 10, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add.text(GAME_W / 2 - 150, 285, 'Devolva as cores ao mundo', textStyle(28, '#fff3c4')).setOrigin(0.5);

    const saved = hasSave();
    const x = GAME_W / 2 - 150;
    const buttons = [button(this, x, 420, 360, saved ? 'Continuar' : 'Começar', () => this.go(!saved))];
    if (saved) {
      let armed = false;
      const reset = button(this, x, 500, 360, 'Novo jogo', () => {
        if (!armed) {
          armed = true;
          (reset.root.list[1] as Phaser.GameObjects.Text).setText('Apagar progresso?');
          return;
        }
        clearSave();
        this.go(true);
      });
      buttons.push(reset);
    }
    buttons.push(button(this, x, saved ? 580 : 500, 360, 'Opções', () => this.scene.start('Options', { from: 'Title' })));
    menuNav(this, buttons);

    if (!isTouchDevice()) this.add.text(16, GAME_H - 38, '↑ ↓ escolher · ENTER confirmar', textStyle(22)).setAlpha(0.85);
    this.cameras.main.fadeIn(500);
    playMusic(this, 'title');
  }

  /** Jogo novo começa pela abertura; continuar vai direto ao mapa. */
  private go(intro = false) {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () =>
      intro ? this.scene.start('Cutscene', { slides: INTRO, next: 'Map' }) : this.scene.start('Map'),
    );
  }
}
