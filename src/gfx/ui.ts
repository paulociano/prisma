import Phaser from 'phaser';
import { playSfx } from '../systems/Audio';
import { has } from './art';

export const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

// Frames do atlas "ui_panels" (ordem dos recortes no pipeline).
export const UI = { bubble: 0, frame: 1, panel: 2, button: 3, buttonHover: 4, buttonDown: 5, toggleOff: 6, toggleOn: 7, slider: 8, box: 9, boxChecked: 10, arrow: 11 };

export function textStyle(size: number, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#3b2252', strokeThickness: Math.max(3, size / 5) };
}

/**
 * Painel esticável (nine-slice) do kit de interface. Os frames estão em 2x,
 * por isso o painel é criado com o dobro do tamanho e exibido em escala 0.5.
 */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, frame = UI.panel) {
  if (!has(scene, 'ui_panels')) {
    return scene.add.rectangle(x, y, w, h, 0x2a1840, 0.9).setStrokeStyle(4, 0xffffff, 0.8);
  }
  const f = scene.textures.getFrame('ui_panels', String(frame));
  const slice = Math.floor(Math.min(f.width, f.height) * 0.3);
  return scene.add.nineslice(x, y, 'ui_panels', String(frame), w * 2, h * 2, slice, slice, slice, slice).setScale(0.5);
}

export interface Button {
  root: Phaser.GameObjects.Container;
  setFocus(on: boolean): void;
  press(): void;
}

/** Botão com estados normal / em foco / apertado; responde a clique e toque. */
export function button(scene: Phaser.Scene, x: number, y: number, w: number, label: string, onPress: () => void): Button {
  const h = 64;
  const art = has(scene, 'ui_panels');
  const bg = panel(scene, 0, 0, w, h, UI.button);
  const text = scene.add.text(0, -2, label, textStyle(28)).setOrigin(0.5);
  const root = scene.add.container(x, y, [bg, text]).setSize(w, h).setInteractive({ useHandCursor: true });
  const setFrame = (frame: number) => {
    if (art) (bg as Phaser.GameObjects.NineSlice).setFrame(String(frame));
  };
  const b: Button = {
    root,
    setFocus(on) {
      setFrame(on ? UI.buttonHover : UI.button);
      root.setScale(on ? 1.06 : 1);
    },
    press() {
      playSfx(scene, 'menu_select', 0);
      setFrame(UI.buttonDown);
      scene.tweens.add({ targets: root, scale: 0.94, duration: 60, yoyo: true, onComplete: onPress });
    },
  };
  root.on('pointerover', () => b.setFocus(true));
  root.on('pointerout', () => b.setFocus(false));
  root.on('pointerdown', () => b.press());
  return b;
}

/** Navegação por teclado/gamepad numa lista vertical de botões. */
export function menuNav(scene: Phaser.Scene, buttons: Button[], start = 0) {
  let i = start;
  const focus = (n: number, quiet = false) => {
    if (!quiet) playSfx(scene, 'menu_move');
    i = (n + buttons.length) % buttons.length;
    buttons.forEach((b, k) => b.setFocus(k === i));
  };
  focus(i, true);
  const kb = scene.input.keyboard!;
  kb.on('keydown-UP', () => focus(i - 1));
  kb.on('keydown-W', () => focus(i - 1));
  kb.on('keydown-DOWN', () => focus(i + 1));
  kb.on('keydown-S', () => focus(i + 1));
  for (const k of ['ENTER', 'SPACE', 'Z', 'X', 'J']) kb.on(`keydown-${k}`, () => buttons[i].press());
  scene.input.gamepad?.on('down', (_pad: Phaser.Input.Gamepad.Gamepad, btn: Phaser.Input.Gamepad.Button) => {
    if (btn.index === 12) focus(i - 1);
    else if (btn.index === 13) focus(i + 1);
    else if (btn.index === 0) buttons[i].press();
  });
  return { focus };
}
