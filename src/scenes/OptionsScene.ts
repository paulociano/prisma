import Phaser from 'phaser';
import { GAME_H, GAME_W, RAINBOW } from '../config';
import { button, menuNav, panel, textStyle } from '../gfx/ui';
import { playSfx } from '../systems/Audio';
import {
  COLORBLIND_LABEL,
  DIFFICULTY_LABEL,
  DIFFICULTY_NOTE,
  applyColorblind,
  getSettings,
  refreshColorblind,
  setSettings,
  type ColorblindMode,
  type Difficulty,
} from '../systems/Settings';

const MODES: ColorblindMode[] = ['off', 'protan', 'deutan', 'tritan'];
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];
const SMALL = { fontFamily: '"Trebuchet MS", sans-serif', fontSize: '15px', color: '#3b2252', align: 'center' };

// Opções: dificuldade e modo daltônico (com amostra das sete cores do jogo).
// Abre por cima do título ou da pausa e volta para quem chamou.
// ↑ ↓ escolhe a linha, ← → (ou ENTER) troca o valor.
export class OptionsScene extends Phaser.Scene {
  private from = 'Title';

  constructor() {
    super('Options');
  }

  init(data: { from?: string }) {
    this.from = data.from ?? 'Title';
  }

  create() {
    applyColorblind(this);
    const cx = GAME_W / 2, cy = GAME_H / 2;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120d1a, this.from === 'Title' ? 0.92 : 0.6).setOrigin(0);
    panel(this, cx, cy, 660, 600);
    this.add.text(cx, cy - 255, 'Opções', textStyle(40, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 6);

    // dificuldade
    this.add.text(cx, cy - 200, 'Dificuldade', textStyle(22, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 4);
    const diffNote = this.add.text(cx, cy - 110, '', SMALL).setOrigin(0.5, 0);
    const diffLabel = () => `◀  ${DIFFICULTY_LABEL[getSettings().difficulty]}  ▶`;
    const cycleDiff = (d: number) => {
      const i = LEVELS.indexOf(getSettings().difficulty);
      setSettings({ difficulty: LEVELS[(i + d + LEVELS.length) % LEVELS.length] });
      (diff.root.list[1] as Phaser.GameObjects.Text).setText(diffLabel());
      diffNote.setText(DIFFICULTY_NOTE[getSettings().difficulty] + (this.from === 'Title' ? '' : '\n(vale a partir da próxima fase)'));
      playSfx(this, 'menu_move');
    };

    // modo daltônico
    this.add.text(cx, cy - 40, 'Modo daltônico', textStyle(22, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 4);
    RAINBOW.forEach((c, i) => this.add.circle(cx + (i - 3) * 46, cy + 92, 15, c).setStrokeStyle(3, 0xffffff));
    const cbNote = this.add.text(cx, cy + 120, '', SMALL).setOrigin(0.5, 0);
    const cbLabel = () => `◀  ${COLORBLIND_LABEL[getSettings().colorblind]}  ▶`;
    const updateCbNote = () =>
      cbNote.setText(
        getSettings().colorblind === 'off'
          ? 'Ajusta as cores para cada tipo de daltonismo.'
          : 'Cores ajustadas. Avisos extras ligados:\num alvo branco pisca sobre o chefão quando ele pode levar dano.',
      );
    const cycleCb = (d: number) => {
      const i = MODES.indexOf(getSettings().colorblind);
      setSettings({ colorblind: MODES[(i + d + MODES.length) % MODES.length] });
      (mode.root.list[1] as Phaser.GameObjects.Text).setText(cbLabel());
      refreshColorblind(this.game);
      updateCbNote();
      playSfx(this, 'menu_move');
    };

    const diff = button(this, cx, cy - 150, 460, diffLabel(), () => cycleDiff(1));
    const mode = button(this, cx, cy + 22, 460, cbLabel(), () => cycleCb(1));
    const back = button(this, cx, cy + 235, 300, 'Voltar', () => this.back());
    const buttons = [diff, mode, back];
    menuNav(this, buttons);
    cycleDiff(0);
    updateCbNote();

    // ← → muda a opção da linha em foco (a linha em foco é a que está ampliada)
    const focused = () => buttons.findIndex((b) => b.root.scale > 1.01);
    const change = (d: number) => {
      const f = focused();
      if (f === 0) cycleDiff(d);
      else if (f === 1) cycleCb(d);
    };
    const kb = this.input.keyboard!;
    for (const k of ['LEFT', 'A']) kb.on(`keydown-${k}`, () => change(-1));
    for (const k of ['RIGHT', 'D']) kb.on(`keydown-${k}`, () => change(1));
    kb.on('keydown-ESC', () => this.back());
  }

  private back() {
    this.scene.stop();
    if (this.from === 'Title') this.scene.start('Title');
    else this.scene.wake(this.from);
  }
}
