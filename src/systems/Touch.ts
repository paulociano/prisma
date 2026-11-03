import Phaser from 'phaser';
import { GAME_W } from '../config';

/** Estado dos botões de tela; o `Controls` soma isso ao teclado e ao gamepad. */
export const touchState = { left: false, right: false, down: false, jump: false, attack: false, shoot: false, dash: false, pause: false };

let touchMode: boolean | undefined;
/** Aparelho de toque? (tela "grossa" ou o primeiro toque já visto). */
export function isTouchDevice(): boolean {
  if (touchMode === undefined) {
    try {
      touchMode = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;
    } catch {
      touchMode = false;
    }
  }
  return touchMode;
}
export function markTouchSeen() {
  touchMode = true;
}

interface Btn {
  key: keyof typeof touchState;
  x: number;
  y: number;
  r: number;
  label: string;
  color: number;
  gfx?: Phaser.GameObjects.Arc;
}

/**
 * Botões de tela para celular/tablet. Cada quadro lê todos os dedos apoiados e marca os botões tocados
 * (dá para deslizar de um botão para outro e apertar vários ao mesmo tempo).
 */
export class TouchControls {
  private btns: Btn[];
  private objs: Phaser.GameObjects.GameObject[] = [];
  private shown = false;

  constructor(private scene: Phaser.Scene, mirrored = false) {
    scene.input.addPointer(4); // até 6 dedos no total
    const mx = (x: number) => (mirrored ? GAME_W - x : x);
    this.btns = [
      { key: 'left', x: mx(105), y: 622, r: 74, label: '◀', color: 0x5b6cff },
      { key: 'right', x: mx(285), y: 622, r: 74, label: '▶', color: 0x5b6cff },
      { key: 'down', x: mx(195), y: 504, r: 50, label: '▼', color: 0x3ccfd8 },
      { key: 'jump', x: mx(GAME_W - 118), y: 612, r: 88, label: 'PULAR', color: 0x5fd068 },
      { key: 'attack', x: mx(GAME_W - 300), y: 650, r: 58, label: 'GOLPE', color: 0xff9a3c },
      { key: 'dash', x: mx(GAME_W - 118), y: 448, r: 54, label: 'DASH', color: 0xb15bff },
      { key: 'shoot', x: mx(GAME_W - 292), y: 530, r: 52, label: 'TIRO', color: 0xff4d5e },
      { key: 'pause', x: mx(GAME_W - 36), y: 150, r: 30, label: 'II', color: 0x888899 },
    ];
    for (const b of this.btns) {
      b.gfx = scene.add.circle(b.x, b.y, b.r, b.color, 0.28).setStrokeStyle(4, 0xffffff, 0.55).setDepth(500);
      const size = b.label.length > 2 ? Math.round(b.r * 0.38) : Math.round(b.r * 0.7);
      const t = scene.add.text(b.x, b.y, b.label, { fontFamily: '"Trebuchet MS", sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setDepth(501).setAlpha(0.9);
      this.objs.push(b.gfx, t);
    }
    this.setVisible(isTouchDevice());
    scene.events.once('shutdown', () => this.reset());
    scene.events.once('destroy', () => this.reset());
  }

  setVisible(v: boolean) {
    this.shown = v;
    this.objs.forEach((o) => (o as Phaser.GameObjects.Components.Visible & Phaser.GameObjects.GameObject).setVisible?.(v));
    if (!v) this.reset();
  }

  private reset() {
    for (const k of Object.keys(touchState) as (keyof typeof touchState)[]) touchState[k] = false;
  }

  update() {
    const input = this.scene.input;
    const pts = [input.pointer1, input.pointer2, input.pointer3, input.pointer4, input.pointer5, input.pointer6].filter((p) => p && p.isDown && p.wasTouch);
    if (pts.length) {
      markTouchSeen();
      if (!this.shown) this.setVisible(true); // primeiro toque num aparelho híbrido: mostra os botões
    }
    if (!this.shown) return;
    const on: Record<string, boolean> = {};
    for (const p of pts) {
      for (const b of this.btns) {
        const reach = b.r * 1.15; // um pouco mais folgado que o desenho
        if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 <= reach * reach) on[b.key] = true;
      }
    }
    for (const b of this.btns) {
      const v = !!on[b.key];
      touchState[b.key] = v;
      b.gfx?.setFillStyle(b.color, v ? 0.62 : 0.28);
      b.gfx?.setScale(v ? 0.94 : 1);
    }
  }
}

