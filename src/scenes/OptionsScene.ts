import Phaser from 'phaser';
import { GAME_H, GAME_W, RAINBOW } from '../config';
import { button, menuNav, panel, textStyle } from '../gfx/ui';
import { playSfx } from '../systems/Audio';
import { syncRenderer3D } from '../render3d';
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
    panel(this, cx, cy, 660, 716);
    this.add.text(cx, cy - 307, 'Opções', textStyle(40, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 6);

    // dificuldade
    this.add.text(cx, cy - 251, 'Dificuldade', textStyle(22, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 4);
    const diffNote = this.add.text(cx, cy - 167, '', SMALL).setOrigin(0.5, 0);
    const diffLabel = () => `◀  ${DIFFICULTY_LABEL[getSettings().difficulty]}  ▶`;
    const cycleDiff = (d: number) => {
      const i = LEVELS.indexOf(getSettings().difficulty);
      setSettings({ difficulty: LEVELS[(i + d + LEVELS.length) % LEVELS.length] });
      (diff.root.list[1] as Phaser.GameObjects.Text).setText(diffLabel());
      diffNote.setText(DIFFICULTY_NOTE[getSettings().difficulty] + (this.from === 'Title' ? '' : '\n(vale a partir da próxima fase)'));
      playSfx(this, 'menu_move');
    };

    // modo daltônico
    this.add.text(cx, cy - 116, 'Modo daltônico', textStyle(22, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 4);
    RAINBOW.forEach((c, i) => this.add.circle(cx + (i - 3) * 46, cy - 10, 15, c).setStrokeStyle(3, 0xffffff));
    const cbNote = this.add.text(cx, cy + 17, '', SMALL).setOrigin(0.5, 0);
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

    const diff = button(this, cx, cy - 204, 460, diffLabel(), () => cycleDiff(1));
    const mode = button(this, cx, cy - 73, 460, cbLabel(), () => cycleCb(1));
    const toggle = (y: number, key: 'reduceFlashes' | 'reduceCameraShake' | 'extraVisualSignals' | 'visual3d', name: string) => {
      const label = () => `${name}: ${getSettings()[key] ? 'Ligado' : 'Desligado'}`;
      const b = button(this, cx, y, 460, label(), () => {
        setSettings({ [key]: !getSettings()[key] });
        if (key === 'visual3d') syncRenderer3D(this.game);
        (b.root.list[1] as Phaser.GameObjects.Text).setText(label());
        playSfx(this, 'menu_move');
      });
      return b;
    };
    const flashes = toggle(cy + 88, 'reduceFlashes', 'Reduzir flashes');
    const shake = toggle(cy + 146, 'reduceCameraShake', 'Reduzir tremor');
    const signals = toggle(cy + 204, 'extraVisualSignals', 'Sinais extras');
    const visual3d = toggle(cy + 262, 'visual3d', 'Visual 3D (beta)');
    const back = button(this, cx, cy + 318, 300, 'Voltar', () => this.back());
    const buttons = [diff, mode, flashes, shake, signals, visual3d, back];
    menuNav(this, buttons);
    diffNote.setText(DIFFICULTY_NOTE[getSettings().difficulty] + (this.from === 'Title' ? '' : '\n(vale a partir da próxima fase)'));
    updateCbNote();

    // ← → muda a opção da linha em foco (a linha em foco é a que está ampliada)
    const focused = () => buttons.findIndex((b) => b.root.scale > 1.01);
    const change = (d: number) => {
      const f = focused();
      if (f === 0) cycleDiff(d);
      else if (f === 1) cycleCb(d);
    };
    const kb = this.input.keyboard!;
    for (const k of ['LEFT', 'A']) kb.on(`keydown-${k}`, (event: KeyboardEvent) => { if (!event.repeat) change(-1); });
    for (const k of ['RIGHT', 'D']) kb.on(`keydown-${k}`, (event: KeyboardEvent) => { if (!event.repeat) change(1); });
    kb.on('keydown-ESC', () => this.back());
  }

  private back() {
    this.scene.stop();
    if (this.from === 'Title') this.scene.start('Title');
    else this.scene.wake(this.from);
  }
}
