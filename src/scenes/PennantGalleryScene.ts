import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { has } from '../gfx/art';
import { button, panel, textStyle } from '../gfx/ui';
import { applyColorblind } from '../systems/Settings';
import { loadSave } from '../systems/Save';
import { playSfx } from '../systems/Audio';
import { PENNANTS } from '../story/pennants';

// Galeria das bandeirolas: as 12 flâmulas em grade; as já guardadas abrem o pergaminho de novo.
export class PennantGalleryScene extends Phaser.Scene {
  constructor() {
    super('PennantGallery');
  }

  create() {
    applyColorblind(this);
    const learned = loadSave().learned;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120d1a, 0.94).setOrigin(0);
    panel(this, GAME_W / 2, GAME_H / 2, 1120, 660);
    const got = PENNANTS.filter((p) => learned[`p:${p.id}`]).length;
    this.add.text(GAME_W / 2, 74, `Bandeirolas  ${got}/${PENNANTS.length}`, textStyle(40, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 6);
    this.add.text(GAME_W / 2, 118, 'Toque ou clique numa bandeirola guardada para reler.', { fontFamily: '"Trebuchet MS", sans-serif', fontSize: '22px', color: '#3b2252' }).setOrigin(0.5);

    const cols = 4, cw = 262, ch = 140, x0 = GAME_W / 2 - (cols * cw) / 2 + cw / 2, y0 = 212;
    PENNANTS.forEach((p, i) => {
      const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * (ch + 14);
      const own = !!learned[`p:${p.id}`];
      const card = this.add.rectangle(x, y, cw - 14, ch, own ? 0xf3e4b8 : 0xc9bfd9, 1).setStrokeStyle(3, own ? 0x8a6a3a : 0x9a8fb3);
      if (own) {
        if (has(this, 'pennants')) {
          const img = this.add.image(x - 66, y, 'pennants', String(i));
          img.setScale(Math.min(100 / img.height, 84 / img.width));
        }
        else p.colors.forEach((c, k, arr) => this.add.rectangle(x - 100, y - 30 + (60 * k) / arr.length + 30 / arr.length, 60, 60 / arr.length + 1, c).setOrigin(0.5));
        this.add.text(x + 44, y, p.title, { fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold', color: '#4a2c14', align: 'center', wordWrap: { width: 128 } }).setOrigin(0.5);
        card.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          playSfx(this, 'menu_select', 0);
          this.scene.launch('Pennant', { pennant: p });
          this.scene.bringToTop('Pennant');
        });
      } else {
        this.add.text(x, y, '?', textStyle(56, '#8a7fa5')).setOrigin(0.5);
      }
    });

    const back = button(this, GAME_W / 2, GAME_H - 66, 300, 'Voltar', () => this.back());
    back.setFocus(true);
    const kb = this.input.keyboard!;
    for (const k of ['ESC']) kb.on(`keydown-${k}`, () => this.back());
  }

  private back() {
    if (this.scene.isActive('Pennant')) return;
    this.scene.stop();
    this.scene.wake('Map');
  }
}
