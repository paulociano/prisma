import Phaser from 'phaser';
import { RAINBOW, TILE } from '../config';
import type { Entity } from '../levels/LevelBuilder';

// A cor como mecânica: três objetos de fase que respondem ao que Íris restaura.
//
//  - flor-ponte (`bloom`): um botão cinza no ar que desabrocha em plataforma quando um
//    Desbotado é restaurado (ou um checkpoint é aceso) ali por perto;
//  - plataforma desbotada (`fadeplat`): só fica sólida quando a fase recupera cor suficiente;
//    antes disso é um contorno que vai ficando mais nítido conforme a cor volta;
//  - porta de cor (`colorgate`): abre depois de N restaurações na fase; as luzes no alto contam.
//
// Todas guardam recompensas opcionais: o caminho até a saída nunca depende delas.
// As texturas são desenhadas aqui; quando existir arte (chaves cm_*), ela tem prioridade.

type Zone = Phaser.GameObjects.Zone;
type Image = Phaser.GameObjects.Image;

export interface ColorHost {
  scene: Phaser.Scene;
  oneways: Phaser.Physics.Arcade.StaticGroup;
  gates: Phaser.Physics.Arcade.StaticGroup;
  worldColor: number;
  /** 0 a 1: quanto da cor da fase já voltou. */
  progress(): number;
  burst(x: number, y: number, n: number, colors?: number[]): void;
  sfx(name: string): void;
}

const BLOOM_RANGE = 9 * TILE;

const css = (c: number, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
const lighten = (c: number, k: number) => {
  const f = (v: number) => Math.round(v + (255 - v) * k);
  return (f((c >> 16) & 255) << 16) | (f((c >> 8) & 255) << 8) | f(c & 255);
};
const darken = (c: number, k: number) => {
  const f = (v: number) => Math.round(v * (1 - k));
  return (f((c >> 16) & 255) << 16) | (f((c >> 8) & 255) << 8) | f(c & 255);
};

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  draw(tex.getContext());
  tex.refresh();
}

/** Texturas em 2x (mostradas com escala 0,5), uma versão por cor de mundo. */
function ensureTextures(scene: Phaser.Scene, color: number) {
  const id = color.toString(16);
  // botão fechado
  bake(scene, 'cm_bud', 96, 112, (c) => {
    c.strokeStyle = '#6f6a7c'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(48, 108); c.quadraticCurveTo(40, 88, 48, 70); c.stroke();
    const g = c.createLinearGradient(20, 10, 76, 76);
    g.addColorStop(0, '#d5d2dc'); g.addColorStop(1, '#8b8798');
    c.fillStyle = g; c.strokeStyle = '#4a4656'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(48, 6); c.bezierCurveTo(84, 30, 82, 66, 48, 78); c.bezierCurveTo(14, 66, 12, 30, 48, 6); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(74,70,86,0.6)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(48, 10); c.quadraticCurveTo(60, 44, 48, 76); c.moveTo(48, 10); c.quadraticCurveTo(36, 44, 48, 76); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(36, 30, 6, 11, -0.4, 0, Math.PI * 2); c.fill();
  });
  // flor aberta, vista de lado: pétalas largas formando o piso (2 blocos de largura + sobra)
  bake(scene, `cm_flower_${id}`, 320, 128, (c) => {
    const petal = (x: number, y: number, rx: number, ry: number, rot: number, fill: string) => {
      c.fillStyle = fill; c.strokeStyle = css(darken(color, 0.55)); c.lineWidth = 5;
      c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill(); c.stroke();
    };
    // pétalas de trás, caídas
    petal(52, 62, 50, 20, 0.5, css(darken(color, 0.28)));
    petal(268, 62, 50, 20, -0.5, css(darken(color, 0.28)));
    petal(160, 80, 54, 24, 0, css(darken(color, 0.22)));
    // cálice
    c.fillStyle = '#5f9a55'; c.strokeStyle = '#2f5a35'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(118, 56); c.quadraticCurveTo(160, 132, 202, 56); c.closePath(); c.fill(); c.stroke();
    // pétalas da frente: o piso
    const g = c.createLinearGradient(0, 18, 0, 70);
    g.addColorStop(0, css(lighten(color, 0.5))); g.addColorStop(0.5, css(color)); g.addColorStop(1, css(darken(color, 0.2)));
    c.fillStyle = g; c.strokeStyle = css(darken(color, 0.55)); c.lineWidth = 5;
    c.beginPath(); c.moveTo(10, 30); c.quadraticCurveTo(70, 8, 160, 22); c.quadraticCurveTo(250, 8, 310, 30);
    c.quadraticCurveTo(290, 64, 214, 60); c.quadraticCurveTo(160, 76, 106, 60); c.quadraticCurveTo(30, 64, 10, 30); c.closePath(); c.fill(); c.stroke();
    // miolo e brilho
    const m = c.createRadialGradient(160, 30, 2, 160, 30, 34);
    m.addColorStop(0, '#fff6c8'); m.addColorStop(1, '#ffc93d');
    c.fillStyle = m; c.strokeStyle = '#b97a12'; c.lineWidth = 4;
    c.beginPath(); c.ellipse(160, 30, 34, 13, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(36, 30); c.quadraticCurveTo(70, 18, 110, 22); c.moveTo(210, 22); c.quadraticCurveTo(250, 18, 284, 30); c.stroke();
  });
  // plataforma desbotada: contorno (apagada) e laje de cristal (acesa)
  const slab = (c: CanvasRenderingContext2D, lit: boolean) => {
    const path = () => { c.beginPath(); c.moveTo(14, 8); c.lineTo(242, 8); c.lineTo(252, 26); c.lineTo(226, 56); c.lineTo(30, 56); c.lineTo(4, 26); c.closePath(); };
    if (lit) {
      const g = c.createLinearGradient(0, 8, 0, 56);
      g.addColorStop(0, css(lighten(color, 0.6))); g.addColorStop(0.45, css(color)); g.addColorStop(1, css(darken(color, 0.35)));
      c.fillStyle = g; path(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(22, 12); c.lineTo(234, 12); c.lineTo(240, 20); c.lineTo(16, 20); c.closePath(); c.fill();
      c.strokeStyle = css(darken(color, 0.6)); c.lineWidth = 5; path(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3;
      for (const x of [70, 128, 186]) { c.beginPath(); c.moveTo(x, 22); c.lineTo(x - 14, 54); c.stroke(); }
    } else {
      c.fillStyle = 'rgba(210,206,224,0.4)'; path(); c.fill();
      c.setLineDash([14, 10]); c.strokeStyle = 'rgba(240,238,248,0.95)'; c.lineWidth = 5; path(); c.stroke();
      c.setLineDash([]);
    }
  };
  bake(scene, 'cm_slab_off', 256, 64, (c) => slab(c, false));
  bake(scene, `cm_slab_${id}`, 256, 64, (c) => slab(c, true));
  // porta de cor: barra de cristal cinza (ladrilhável na vertical) e a luz do contador
  bake(scene, 'cm_gate', 128, 128, (c) => {
    const g = c.createLinearGradient(20, 0, 108, 0);
    g.addColorStop(0, '#6d6880'); g.addColorStop(0.35, '#cfcbdc'); g.addColorStop(0.6, '#a09bb2'); g.addColorStop(1, '#575268');
    c.fillStyle = g; c.fillRect(24, 0, 80, 128);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(40, 0, 10, 128);
    c.strokeStyle = '#2f2a3a'; c.lineWidth = 6; c.beginPath(); c.moveTo(24, 0); c.lineTo(24, 128); c.moveTo(104, 0); c.lineTo(104, 128); c.stroke();
    c.strokeStyle = 'rgba(47,42,58,0.45)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(24, 40); c.lineTo(64, 64); c.lineTo(104, 40); c.moveTo(24, 104); c.lineTo(64, 128); c.moveTo(104, 104); c.lineTo(64, 128); c.stroke();
  });
  bake(scene, 'cm_pip', 48, 48, (c) => {
    c.fillStyle = '#ffffff'; c.strokeStyle = '#2f2a3a'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(24, 4); c.lineTo(44, 24); c.lineTo(24, 44); c.lineTo(4, 24); c.closePath(); c.fill(); c.stroke();
  });
}

interface Bloom { x: number; y: number; w: number; zone: Zone; bud: Image; flower: Image; open: boolean }
interface FadePlat { x: number; y: number; at: number; zone: Zone; off: Image; on: Image; lit: boolean }
interface ColorGate { x: number; top: number; h: number; need: number; body: Phaser.GameObjects.TileSprite; pips: Image[]; open: boolean }

export class ColorMechanics {
  private blooms: Bloom[] = [];
  private plats: FadePlat[] = [];
  private gates: ColorGate[] = [];
  private restored = 0;

  constructor(private host: ColorHost) {}

  /** Cria o objeto se `e` for um dos três tipos; devolve false para os demais. */
  add(e: Entity): boolean {
    if (e.type !== 'bloom' && e.type !== 'fadeplat' && e.type !== 'colorgate') return false;
    const { scene } = this.host;
    const id = this.host.worldColor.toString(16);
    ensureTextures(scene, this.host.worldColor);
    const oneway = (x: number, y: number, w: number) => {
      const z = scene.add.zone(x, y + 10, w, 20);
      this.host.oneways.add(z);
      const b = z.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.down = b.checkCollision.left = b.checkCollision.right = false;
      b.enable = false;
      return z;
    };
    if (e.type === 'bloom') {
      const w = (e.data?.w ?? 2) * TILE;
      const x = e.col * TILE + w / 2, y = e.row * TILE;
      const bud = scene.add.image(x, y + 34, 'cm_bud').setScale(0.5).setDepth(4);
      scene.tweens.add({ targets: bud, y: y + 28, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const flower = scene.add.image(x, y + 26, `cm_flower_${id}`).setDepth(4).setVisible(false);
      flower.setDisplaySize(w + 30, 64);
      this.blooms.push({ x, y, w, zone: oneway(x, y, w), bud, flower, open: false });
    } else if (e.type === 'fadeplat') {
      const w = (e.data?.w ?? 2) * TILE;
      const x = e.col * TILE + w / 2, y = e.row * TILE;
      const off = scene.add.image(x, y + 14, 'cm_slab_off').setDisplaySize(w + 8, 32).setDepth(4);
      const on = scene.add.image(x, y + 14, `cm_slab_${id}`).setDisplaySize(w + 8, 32).setDepth(4).setVisible(false);
      this.plats.push({ x, y, at: e.data?.at ?? 0.5, zone: oneway(x, y, w), off, on, lit: false });
    } else {
      const h = e.data?.h ?? 2, need = Math.max(1, e.data?.need ?? 3);
      const x = e.col * TILE + TILE / 2, top = e.row * TILE;
      const body = scene.add.tileSprite(x, top + (h * TILE) / 2, TILE, h * TILE, 'cm_gate').setTileScale(0.5).setDepth(5);
      this.host.gates.add(body);
      (body.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      const pips: Image[] = [];
      for (let i = 0; i < need; i++) {
        // luzes do contador ao longo da própria barra (visíveis mesmo com teto logo acima)
        const py = top + ((i + 0.5) * h * TILE) / need;
        pips.push(scene.add.image(x, py, 'cm_pip').setScale(0.4).setDepth(6).setTint(0x8d889c));
      }
      this.gates.push({ x, top, h, need, body, pips, open: false });
    }
    return true;
  }

  /** Um Desbotado foi restaurado em (x, y). */
  onRestore(x: number, y: number) {
    this.restored++;
    this.wake(x, y);
    for (const g of this.gates) {
      if (g.open) continue;
      const n = Math.min(this.restored, g.need);
      const pip = g.pips[n - 1];
      if (pip?.tintTopLeft === 0x8d889c) {
        pip.setTint(RAINBOW[(n - 1) % RAINBOW.length]);
        this.host.scene.tweens.add({ targets: pip, scale: 0.66, duration: 140, yoyo: true });
      }
      if (this.restored >= g.need) this.openGate(g);
    }
  }

  /** Um checkpoint foi aceso em (x, y): também acorda as flores por perto. */
  onCheckpoint(x: number, y: number) {
    this.wake(x, y);
  }

  private wake(x: number, y: number) {
    for (const b of this.blooms) {
      if (b.open || Math.abs(b.x - x) > BLOOM_RANGE || Math.abs(b.y - y) > BLOOM_RANGE) continue;
      b.open = true;
      (b.zone.body as Phaser.Physics.Arcade.StaticBody).enable = true;
      const { scene } = this.host;
      scene.tweens.killTweensOf(b.bud);
      scene.tweens.add({ targets: b.bud, scale: 0.2, alpha: 0, duration: 220, onComplete: () => b.bud.setVisible(false) });
      const sx = b.flower.scaleX, sy = b.flower.scaleY;
      b.flower.setVisible(true).setScale(sx * 0.2, sy * 0.2);
      scene.tweens.add({ targets: b.flower, scaleX: sx, scaleY: sy, duration: 520, ease: 'Back.Out', delay: 160 });
      scene.time.delayedCall(160, () => {
        this.host.burst(b.x, b.y + 16, 16, [this.host.worldColor, 0xffffff, 0xffe27a]);
        this.host.sfx('checkpoint');
      });
    }
  }

  private openGate(g: ColorGate) {
    g.open = true;
    const { scene } = this.host;
    (g.body.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.host.burst(g.x, g.top + (g.h * TILE) / 2, 30);
    this.host.sfx('checkpoint');
    scene.tweens.add({ targets: g.body, alpha: 0, scaleX: 0.2, duration: 380, onComplete: () => g.body.setVisible(false) });
    scene.tweens.add({ targets: g.pips, alpha: 0, duration: 500 });
  }

  update() {
    if (!this.plats.length) return;
    const p = this.host.progress();
    for (const f of this.plats) {
      if (f.lit) continue;
      if (p >= f.at) {
        f.lit = true;
        (f.zone.body as Phaser.Physics.Arcade.StaticBody).enable = true;
        f.off.setVisible(false);
        f.on.setVisible(true).setAlpha(0);
        this.host.scene.tweens.add({ targets: f.on, alpha: 1, duration: 350 });
        this.host.burst(f.x, f.y + 14, 14, [this.host.worldColor, 0xffffff]);
        this.host.sfx('checkpoint');
      } else {
        // o contorno fica mais nítido conforme a cor volta, com um leve pulsar
        const k = Phaser.Math.Clamp(p / f.at, 0, 1);
        f.off.setAlpha(0.55 + 0.35 * k + 0.1 * Math.sin(this.host.scene.time.now / 380));
      }
    }
  }
}
