import Phaser from 'phaser';
import { applyColorblind } from '../systems/Settings';
import { GAME_H, GAME_W } from '../config';
import { button, menuNav, panel, textStyle } from '../gfx/ui';
import { playSfx } from '../systems/Audio';

// Pausa por cima da fase (ESC ou P): continuar, reiniciar ou voltar ao mapa.
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    applyColorblind(this);
    playSfx(this, 'pause', 0);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120d1a, 0.6).setOrigin(0);
    panel(this, GAME_W / 2, GAME_H / 2, 480, 480);
    this.add.text(GAME_W / 2, GAME_H / 2 - 180, 'Pausa', textStyle(44, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 6);

    const cx = GAME_W / 2;
    const buttons = [
      button(this, cx, GAME_H / 2 - 90, 340, 'Continuar', () => this.resume()),
      button(this, cx, GAME_H / 2 - 10, 340, 'Reiniciar fase', () => this.leave(() => this.scene.get('Game').scene.restart())),
      button(this, cx, GAME_H / 2 + 70, 340, 'Opções', () => {
        this.scene.sleep();
        this.scene.launch('Options', { from: 'Pause' });
      }),
      button(this, cx, GAME_H / 2 + 150, 340, 'Mapa do mundo', () =>
        this.leave(() => {
          this.scene.stop('Game');
          this.scene.stop('Hud');
          const g = this.scene.get('Game') as Phaser.Scene & { level?: { world: number } };
          this.scene.start('WorldMap', { world: g.level?.world ?? 1 });
        }),
      ),
    ];
    menuNav(this, buttons);
    this.input.keyboard!.on('keydown-ESC', () => this.resume());
    this.input.keyboard!.on('keydown-P', () => this.resume());
  }

  private resume() {
    this.scene.resume('Game');
    this.scene.stop();
  }

  private leave(action: () => void) {
    this.scene.stop();
    action();
  }
}
