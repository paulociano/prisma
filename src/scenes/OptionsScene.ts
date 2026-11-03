import Phaser from 'phaser';
import { GAME_H, GAME_W, RAINBOW } from '../config';
import { button, menuNav, panel, textStyle } from '../gfx/ui';
import { applyMusicVolume, playSfx } from '../systems/Audio';
import { isTouchDevice } from '../systems/Touch';
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
  type Settings,
} from '../systems/Settings';

const MODES: ColorblindMode[] = ['off', 'protan', 'deutan', 'tritan'];
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];
const SMALL = { fontFamily: '"Trebuchet MS", sans-serif', fontSize: '22px', color: '#3b2252', align: 'center' };
const PAGES = ['Jogo', 'Acessibilidade', 'Som e controles'];

type ToggleKey = 'reduceFlashes' | 'reduceCameraShake' | 'reduceMotion' | 'extraVisualSignals' | 'largeText' | 'autoDialogue';

// Opções em três páginas: Jogo (dificuldade e daltonismo), Acessibilidade (sinais e textos) e
// Som e controles (volumes e lista de teclas). Abre por cima do título ou da pausa e volta para quem chamou.
// ↑ ↓ escolhe a linha, ← → (ou ENTER) troca o valor.
export class OptionsScene extends Phaser.Scene {
  private from = 'Title';
  private page = 0;

  constructor() {
    super('Options');
  }

  init(data: { from?: string; page?: number }) {
    this.from = data.from ?? 'Title';
    this.page = data.page ?? 0;
  }

  create() {
    applyColorblind(this);
    const cx = GAME_W / 2, cy = GAME_H / 2;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120d1a, this.from === 'Title' ? 0.92 : 0.6).setOrigin(0);
    panel(this, cx, cy, 700, 696);
    this.add.text(cx, cy - 312, 'Opções', textStyle(40, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 6);
    this.add.text(cx, cy - 268, `${PAGES[this.page]}  ·  ${this.page + 1}/${PAGES.length}`, textStyle(24, '#7a3c8a')).setOrigin(0.5).setStroke('#ffffff', 4);

    const buttons: ReturnType<typeof button>[] = [];
    const setLabel = (b: ReturnType<typeof button>, t: string) => (b.root.list[1] as Phaser.GameObjects.Text).setText(t);
    let onChange: ((d: number) => void)[] = []; // ← → de cada botão (mesmo índice de `buttons`)
    const add = (b: ReturnType<typeof button>, change?: (d: number) => void) => {
      buttons.push(b);
      onChange.push(change ?? (() => undefined));
      return b;
    };

    const toggle = (y: number, key: ToggleKey, name: string) => {
      const label = () => `${name}: ${getSettings()[key] ? 'Ligado' : 'Desligado'}`;
      const flip = () => {
        setSettings({ [key]: !getSettings()[key] } as Partial<Settings>);
        setLabel(b, label());
        playSfx(this, 'menu_move');
      };
      const b = add(button(this, cx, y, 520, label(), flip), flip);
      return b;
    };
    const volume = (y: number, key: 'musicVol' | 'sfxVol', name: string) => {
      const label = () => `${name}: ${getSettings()[key]}%`;
      const step = (d: number) => {
        const v = getSettings()[key];
        setSettings({ [key]: d > 0 ? (v >= 100 ? 0 : v + 10) : v <= 0 ? 100 : v - 10 } as Partial<Settings>);
        setLabel(b, label());
        if (key === 'musicVol') applyMusicVolume();
        playSfx(this, 'menu_move');
      };
      const b = add(button(this, cx, y, 520, label(), () => step(1)), step);
      return b;
    };

    if (this.page === 0) {
      this.add.text(cx, cy - 226, 'Dificuldade', textStyle(24, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 4);
      const diffNote = this.add.text(cx, cy - 130, '', SMALL).setOrigin(0.5, 0);
      const diffLabel = () => `◀  ${DIFFICULTY_LABEL[getSettings().difficulty]}  ▶`;
      const showDiffNote = () => diffNote.setText(DIFFICULTY_NOTE[getSettings().difficulty] + (this.from === 'Title' ? '' : '\n(vale a partir da próxima fase)'));
      const cycleDiff = (d: number) => {
        const i = LEVELS.indexOf(getSettings().difficulty);
        setSettings({ difficulty: LEVELS[(i + d + LEVELS.length) % LEVELS.length] });
        setLabel(diff, diffLabel());
        showDiffNote();
        playSfx(this, 'menu_move');
      };
      const diff = add(button(this, cx, cy - 176, 520, diffLabel(), () => cycleDiff(1)), cycleDiff);
      showDiffNote();

      this.add.text(cx, cy + 0, 'Modo daltônico', textStyle(24, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 4);
      const cbNote = this.add.text(cx, cy + 148, '', SMALL).setOrigin(0.5, 0);
      const cbLabel = () => `◀  ${COLORBLIND_LABEL[getSettings().colorblind]}  ▶`;
      const updateCbNote = () =>
        cbNote.setText(getSettings().colorblind === 'off' ? 'Ajusta as cores para cada tipo de daltonismo.' : 'Cores ajustadas. Avisos extras ligados:\num alvo branco pisca sobre o chefão quando ele pode levar dano.');
      const cycleCb = (d: number) => {
        const i = MODES.indexOf(getSettings().colorblind);
        setSettings({ colorblind: MODES[(i + d + MODES.length) % MODES.length] });
        setLabel(mode, cbLabel());
        refreshColorblind(this.game);
        updateCbNote();
        playSfx(this, 'menu_move');
      };
      const mode = add(button(this, cx, cy + 46, 520, cbLabel(), () => cycleCb(1)), cycleCb);
      RAINBOW.forEach((c, i) => this.add.circle(cx + (i - 3) * 50, cy + 112, 16, c).setStrokeStyle(3, 0xffffff));
      updateCbNote();
    } else if (this.page === 1) {
      toggle(cy - 200, 'reduceFlashes', 'Reduzir flashes');
      toggle(cy - 138, 'reduceCameraShake', 'Reduzir tremor');
      toggle(cy - 76, 'reduceMotion', 'Reduzir movimento');
      toggle(cy - 14, 'extraVisualSignals', 'Sinais extras');
      toggle(cy + 48, 'largeText', 'Texto grande');
      toggle(cy + 110, 'autoDialogue', 'Diálogo automático');
      this.add.text(cx, cy + 156, 'Texto grande aumenta falas e legendas.\nDiálogo automático avança sozinho depois de um tempo de leitura.', SMALL).setOrigin(0.5, 0);
    } else {
      volume(cy - 200, 'musicVol', 'Música');
      volume(cy - 138, 'sfxVol', 'Efeitos');
      const touch = isTouchDevice();
      const lines = touch
        ? ['TOQUE NA TELA', '◀ ▶ andar  ·  ▼ descer/mergulho', 'PULAR (segure para ir mais alto)', 'GOLPE de echarpe  ·  TIRO  ·  DASH', 'II pausa']
        : ['TECLADO', '← → ou A D: andar    ↓ ou S: descer / mergulho', 'ESPAÇO, Z ou ↑: pular (segure para ir mais alto)', 'X ou J: golpe   C ou I: tiro   SHIFT ou L: dash', 'P ou ESC: pausa   M: som   R: reiniciar', '', 'GAMEPAD', 'A pular · X golpe · B tiro · Y ou R1 dash · Start pausa'];
      this.add.text(cx, cy - 86, lines.join('\n'), { ...SMALL, fontSize: '21px', lineSpacing: 6 }).setOrigin(0.5, 0);
    }

    const next = add(button(this, cx, cy + 232, 440, `Próxima página ▶`, () => this.goPage((this.page + 1) % PAGES.length)), (d) => this.goPage((this.page + d + PAGES.length) % PAGES.length));
    void next;
    add(button(this, cx, cy + 304, 300, 'Voltar', () => this.back()));
    menuNav(this, buttons);

    // ← → muda o valor da linha em foco (a linha em foco é a ampliada)
    const focused = () => buttons.findIndex((b) => b.root.scale > 1.01);
    const kb = this.input.keyboard!;
    for (const k of ['LEFT', 'A']) kb.on(`keydown-${k}`, (event: KeyboardEvent) => { if (!event.repeat) onChange[focused()]?.(-1); });
    for (const k of ['RIGHT', 'D']) kb.on(`keydown-${k}`, (event: KeyboardEvent) => { if (!event.repeat) onChange[focused()]?.(1); });
    kb.on('keydown-ESC', () => this.back());
  }

  private goPage(page: number) {
    this.scene.restart({ from: this.from, page });
  }

  private back() {
    this.scene.stop();
    if (this.from === 'Title') this.scene.start('Title');
    else this.scene.wake(this.from);
  }
}
