import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { applyColorblind } from '../systems/Settings';
import { playSfx } from '../systems/Audio';
import { PENNANTS, type Pennant } from '../story/pennants';
import { has } from '../gfx/art';

const SERIF = 'Georgia, "Palatino Linotype", "Book Antiqua", serif';

// Cartão da bandeirola: um pergaminho grande no centro da tela, por cima do jogo (pausado).
// Mostra a flâmula, o nome, "o que é" e "como respeitar". Fecha com pular/golpear/Enter ou clique.
export class PennantScene extends Phaser.Scene {
  private pennant!: Pennant;
  private onDone?: () => void;
  private openedAt = 0;
  private closing = false;

  constructor() {
    super('Pennant');
  }

  init(data: { pennant: Pennant; onDone?: () => void }) {
    this.pennant = data.pennant;
    this.onDone = data.onDone;
    this.closing = false;
  }

  create() {
    applyColorblind(this);
    const p = this.pennant;
    this.openedAt = this.time.now;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0a0614, 0.62).setOrigin(0).setInteractive();

    const W = 960, H = 560, cx = GAME_W / 2, cy = GAME_H / 2;
    const root = this.add.container(cx, cy);
    const g = this.add.graphics();
    const art = this.textures.exists('pergaminho');
    if (art) {
      // arte pronta do pergaminho (área útil 960x560 no centro)
      const bg = this.add.image(0, 0, 'pergaminho');
      bg.setScale(GAME_H * 1.1 / bg.height); // ocupa quase toda a altura da tela
      root.add(bg);
    }
    // folha
    if (!art) {
    g.fillStyle(0x000000, 0.28).fillRoundedRect(-W / 2 + 8, -H / 2 + 16, W, H, 14); // sombra
    g.fillStyle(0xf3e4b8, 1).fillRect(-W / 2 + 14, -H / 2, W - 28, H);
    g.fillStyle(0xe6d29a, 1);
    for (let i = 0; i < 14; i++) g.fillRect(-W / 2 + 14, -H / 2 + 20 + i * 38, W - 28, 2); // fibras
    g.fillStyle(0xd9bf80, 0.55).fillRect(-W / 2 + 14, -H / 2, 26, H).fillRect(W / 2 - 40, -H / 2, 26, H); // bordas escuras
    // rolos de cima e de baixo
    for (const y of [-H / 2 - 4, H / 2 + 4]) {
      g.fillStyle(0xb98a4a, 1).fillRoundedRect(-W / 2 - 14, y - 22, W + 28, 44, 22);
      g.fillStyle(0xd4a965, 1).fillRoundedRect(-W / 2 - 14, y - 22, W + 28, 18, 9);
      g.fillStyle(0x7a5528, 1).fillCircle(-W / 2 - 14, y, 14).fillCircle(W / 2 + 14, y, 14);
      g.lineStyle(3, 0x6b4a20, 1).strokeRoundedRect(-W / 2 - 14, y - 22, W + 28, 44, 22);
    }
    }
    root.add(g);

    // layout: sobre a arte o papel é maior (quase a tela inteira); no desenho por código usa 960x560
    const L = art
      ? { left: -440, width: 880, flagX: -400, flagY: -196, ruleY: -150, textTop: -128, bottom: 205, hintY: 288 }
      : { left: -W / 2 + 75, width: W - 150, flagX: -W / 2 + 70, flagY: -H / 2 + 64, ruleY: -H / 2 + 128, textTop: -H / 2 + 148, bottom: H / 2 - 50, hintY: H / 2 - 30 };

    // flâmula em miniatura: as listras da bandeira
    const fx = L.flagX, fy = L.flagY, fw = 130, fh = 80;
    const idx = PENNANTS.findIndex((q) => q.id === p.id);
    if (has(this, 'pennants')) {
      const img = this.add.image(fx + fw / 2 - 10, fy + 6, 'pennants', String(idx)).setOrigin(0.5);
      img.setScale(110 / img.height);
      root.add(img);
    }
    const flag = this.add.graphics();
    (p.id === 'intersexo' ? [0xffd800] : p.colors).forEach((c, i, arr) => flag.fillStyle(c, 1).fillRect(fx, fy - fh / 2 + (fh * i) / arr.length, fw, Math.ceil(fh / arr.length) + 1));
    if (p.id === 'intersexo') flag.lineStyle(9, 0x7902aa, 1).strokeCircle(fx + fw / 2, fy, 24);
    flag.lineStyle(4, 0x4a3320, 1).strokeRect(fx, fy - fh / 2, fw, fh);
    if (!has(this, 'pennants')) root.add(flag);

    const title = this.add.text(fx + fw + 36, fy, p.title, { fontFamily: SERIF, fontSize: '40px', fontStyle: 'bold', color: '#4a2c14', wordWrap: { width: L.width - fw - 60 } }).setOrigin(0, 0.5);
    root.add(title);
    root.add(this.add.graphics().lineStyle(3, 0x8a6a3a, 0.8).lineBetween(L.left, L.ruleY, L.left + L.width, L.ruleY));

    // texto: começa em 32px e diminui até caber no papel (qualquer fonte, qualquer tamanho de texto)
    const what = this.add.text(L.left, L.textTop, p.what, {});
    const h2 = this.add.text(L.left, 0, 'Como respeitar e ajudar', { fontFamily: SERIF, fontStyle: 'bold', color: '#7a3c8a' });
    const how = this.add.text(L.left, 0, p.how, {});
    for (let fs = 40; fs >= 20; fs -= 1) {
      const st = { fontFamily: SERIF, fontSize: `${fs}px`, color: '#3a2412', wordWrap: { width: L.width }, lineSpacing: Math.round(fs / 4) };
      what.setStyle(st).setText(p.what);
      h2.setFontSize(Math.round(fs * 0.95));
      h2.y = what.y + what.height + 14;
      how.setStyle(st).setText(p.how);
      how.y = h2.y + h2.height + 6;
      if (how.y + how.height <= L.bottom) break;
    }
    root.add([what, h2, how]);

    const hint = this.add.text(0, L.hintY, 'Aperte PULAR ou ENTER para guardar', { fontFamily: SERIF, fontSize: '20px', fontStyle: 'italic', color: art ? '#fff1c9' : '#6b4a20', stroke: art ? '#4a2c14' : undefined, strokeThickness: art ? 4 : 0 }).setOrigin(0.5);
    root.add(hint);
    this.tweens.add({ targets: hint, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

    // abre como um pergaminho que se desenrola
    root.setAlpha(0).setScale(0.92, 0.4);
    this.tweens.add({ targets: root, alpha: 1, scaleX: 1, scaleY: 1, duration: 320, ease: 'Back.Out' });
    playSfx(this, 'dialogue_blip', 0);

    const kb = this.input.keyboard!;
    for (const k of ['SPACE', 'Z', 'X', 'J', 'K', 'C', 'ENTER', 'UP', 'W', 'ESC']) kb.on(`keydown-${k}`, () => this.close());
    this.input.on('pointerdown', () => this.close());
    this.input.gamepad?.on('down', () => this.close());
  }

  private close() {
    if (this.closing || this.time.now - this.openedAt < 500) return; // evita fechar sem querer logo ao abrir
    this.closing = true;
    this.tweens.add({
      targets: this.children.list,
      alpha: 0,
      duration: 160,
      onComplete: () => {
        this.scene.stop();
        this.onDone?.();
      },
    });
  }
}
