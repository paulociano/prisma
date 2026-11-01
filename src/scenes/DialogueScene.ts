import Phaser from 'phaser';
import { applyColorblind } from '../systems/Settings';
import { GAME_H, GAME_W } from '../config';
import { has } from '../gfx/art';
import { playSfx } from '../systems/Audio';

export type Speaker = 'iris' | 'spark' | 'ruby' | 'judge' | 'sol' | 'luna' | 'serpent' | 'aurora' | 'branch' | 'spotlight' | 'thornweed' | 'marina' | 'bix' | 'kraken' | 'eclipse' | 'ace' | 'mono';

export interface Line {
  who: Speaker;
  mood: string;
  text: string;
}

// Retrato de cada personagem: [atlas, frame] por humor e escala de exibição.
type Mood = [tex: string, frame: number];
const PORTRAITS: Record<Speaker, { name: string; color: string; moods: Record<string, Mood>; scale: number; originY?: number }> = {
  iris: {
    name: 'Íris',
    color: '#c79bff',
    moods: { happy: ['iris_portraits', 0], determined: ['iris_portraits', 1], surprised: ['iris_portraits', 2], sad: ['iris_portraits', 3] },
    scale: 0.5,
  },
  spark: {
    name: 'Faísca',
    color: '#ffb8f0',
    moods: {
      neutral: ['spark_portraits', 0],
      happy: ['spark_portraits', 1],
      talking: ['spark_portraits', 2],
      surprised: ['spark_portraits', 3],
      worried: ['spark_portraits', 4],
      excited: ['spark_portraits', 5],
    },
    scale: 0.55,
  },
  ruby: {
    name: 'Mãe Rubi',
    color: '#ff6b81',
    moods: { happy: ['w1_guardian', 3], proud: ['w1_guardian', 4], worried: ['w1_guardian', 5], grateful: ['w1_guardian', 6] },
    scale: 0.62,
  },
  // corpo inteiro: mostra só a parte de cima
  judge: { name: 'Juiz de Pedra', color: '#c9c9d4', moods: { angry: ['w1_boss_idle', 0], restored: ['w1_boss_end', 3] }, scale: 0.26, originY: 0.28 },
  sol: {
    name: 'Sol',
    color: '#ff9a3c',
    moods: { happy: ['w2_guardian', 3], proud: ['w2_guardian', 4], worried: ['w2_guardian', 5], grateful: ['w2_guardian', 6] },
    scale: 0.62,
  },
  luna: {
    name: 'Luna',
    color: '#ff8fc8',
    moods: { happy: ['w2_luna', 3], proud: ['w2_luna', 4], worried: ['w2_luna', 5], grateful: ['w2_luna', 6] },
    scale: 0.62,
  },
  aurora: {
    name: 'Aurora',
    color: '#ffd93d',
    moods: { happy: ['w3_guardian', 3], proud: ['w3_guardian', 4], worried: ['w3_guardian', 5], grateful: ['w3_guardian', 6] },
    scale: 0.62,
  },
  branch: {
    name: 'Ramo',
    color: '#5fd068',
    moods: { happy: ['w4_guardian', 3], proud: ['w4_guardian', 4], worried: ['w4_guardian', 5], grateful: ['w4_guardian', 6] },
    scale: 0.6,
  },
  marina: {
    name: 'Marina',
    color: '#7fd8ff',
    moods: { happy: ['w5_guardian', 3], proud: ['w5_guardian', 4], worried: ['w5_guardian', 5], grateful: ['w5_guardian', 6] },
    scale: 0.6,
  },
  bix: {
    name: 'Bix',
    color: '#d08cff',
    moods: { happy: ['w6_guardian', 3], proud: ['w6_guardian', 4], worried: ['w6_guardian', 5], grateful: ['w6_guardian', 6] },
    scale: 0.6,
  },
  kraken: { name: 'Kraken do Silêncio', color: '#b8e8ff', moods: { angry: ['w5_boss_idle', 0], restored: ['w5_boss_end', 3] }, scale: 0.3, originY: 0.38 },
  eclipse: { name: 'Eclipse', color: '#c8b8ff', moods: { angry: ['w6_boss_idle', 0], restored: ['w6_boss_end', 3] }, scale: 0.3, originY: 0.35 },
  ace: {
    name: 'Ás',
    color: '#c79bff',
    moods: { happy: ['w7_guardian', 3], proud: ['w7_guardian', 4], worried: ['w7_guardian', 5], grateful: ['w7_guardian', 6] },
    scale: 0.6,
  },
  mono: { name: 'Monocromo', color: '#d8d8e8', moods: { angry: ['w7_boss_p1_idle', 0], restored: ['w7_boss_p2_end', 3] }, scale: 0.3, originY: 0.3 },
  spotlight: { name: 'Holofote Frio', color: '#d8dcff', moods: { angry: ['w3_boss_idle', 0], restored: ['w3_boss_end', 3] }, scale: 0.3, originY: 0.42 },
  thornweed: { name: 'Espinheira', color: '#9be08a', moods: { angry: ['w4_boss_idle', 0], restored: ['w4_boss_end', 3] }, scale: 0.32, originY: 0.35 },
  serpent: { name: 'Serpente das Areias', color: '#ffb36b', moods: { angry: ['w2_boss_idle', 1], restored: ['w2_boss_end', 3] }, scale: 0.3, originY: 0.3 },
};

const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';
const CPS = 45; // letras por segundo

// Caixa de diálogo por cima do jogo. Avança com pular/golpear/Enter ou clique.
// Ao terminar, chama `onDone` e se fecha.
export class DialogueScene extends Phaser.Scene {
  private lines: Line[] = [];
  private index = 0;
  private shown = 0;
  private onDone?: () => void;
  private portrait!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private arrow!: Phaser.GameObjects.Text;

  constructor() {
    super('Dialogue');
  }

  init(data: { lines: Line[]; onDone?: () => void }) {
    this.lines = data.lines;
    this.onDone = data.onDone;
    this.index = 0;
  }

  create() {
    applyColorblind(this);
    // caixa no topo: a cena (quem está falando) continua visível embaixo
    const boxW = 1120, boxH = 190, x = GAME_W / 2, y = boxH / 2 + 24;
    const g = this.add.graphics();
    g.fillStyle(0x24133a, 0.92).fillRoundedRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 24);
    g.lineStyle(4, 0xffffff, 0.85).strokeRoundedRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 24);
    g.fillStyle(0x3b2252, 1).fillCircle(x - boxW / 2 + 110, y, 78);
    g.lineStyle(4, 0xffd93d, 1).strokeCircle(x - boxW / 2 + 110, y, 78);

    this.portrait = this.add.image(x - boxW / 2 + 110, y, 'pixel');
    const mask = this.make.graphics({}, false).fillCircle(x - boxW / 2 + 110, y, 76);
    this.portrait.setMask(mask.createGeometryMask());
    const textX = x - boxW / 2 + 215;
    this.nameText = this.add.text(textX, y - boxH / 2 + 20, '', { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', stroke: '#24133a', strokeThickness: 6 });
    this.bodyText = this.add.text(textX, y - boxH / 2 + 64, '', {
      fontFamily: FONT,
      fontSize: '26px',
      color: '#ffffff',
      wordWrap: { width: boxW - 260 },
      lineSpacing: 6,
    });
    this.arrow = this.add.text(x + boxW / 2 - 40, y + boxH / 2 - 36, '▼', { fontFamily: FONT, fontSize: '24px', color: '#ffd93d' });
    this.tweens.add({ targets: this.arrow, y: this.arrow.y + 6, duration: 400, yoyo: true, repeat: -1 });

    const kb = this.input.keyboard!;
    for (const k of ['SPACE', 'Z', 'X', 'J', 'K', 'C', 'ENTER', 'UP', 'W']) kb.on(`keydown-${k}`, () => this.advance());
    this.input.on('pointerdown', () => this.advance());
    this.input.gamepad?.on('down', () => this.advance());

    this.showLine();
  }

  private showLine() {
    const line = this.lines[this.index];
    const p = PORTRAITS[line.who];
    this.nameText.setText(p.name).setColor(p.color);
    const [tex, frame] = p.moods[line.mood] ?? Object.values(p.moods)[0];
    if (has(this, tex)) {
      this.portrait.setTexture(tex, String(frame)).setScale(p.scale).setOrigin(0.5, p.originY ?? 0.5).setVisible(true);
    } else this.portrait.setVisible(false);
    this.bodyText.setText('');
    this.shown = 0;
    this.arrow.setVisible(false);
  }

  private advance() {
    const line = this.lines[this.index];
    if (this.shown < line.text.length) {
      this.shown = line.text.length; // primeiro toque completa a frase
      return;
    }
    this.index++;
    playSfx(this, 'dialogue_blip', 120);
    if (this.index >= this.lines.length) {
      this.scene.stop();
      this.onDone?.();
      return;
    }
    this.showLine();
  }

  update(_t: number, dtMs: number) {
    const line = this.lines[this.index];
    if (!line) return;
    if (this.shown < line.text.length) this.shown = Math.min(line.text.length, this.shown + (CPS * dtMs) / 1000);
    this.bodyText.setText(line.text.slice(0, Math.floor(this.shown)));
    this.arrow.setVisible(this.shown >= line.text.length);
  }
}
