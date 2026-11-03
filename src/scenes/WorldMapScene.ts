import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { has } from '../gfx/art';
import { panel, textStyle } from '../gfx/ui';
import { LEVEL_META, isUnlocked } from '../levels';
import { worldInfo } from '../levels/worlds';
import { playMusic, playSfx } from '../systems/Audio';
import { loadSave, type SaveData } from '../systems/Save';
import { applyColorblind } from '../systems/Settings';
import { Ambient } from '../systems/Ambient';
import { mapFx } from '../systems/WorldFx';

// Ícones do atlas "map_icons".
const ICON = { locked: 0, open: 1, done: 2, bossLocked: 3, bossDone: 4, iris: 5 };

/**
 * Posição das 4 clareiras em cada mapa de mundo (frações da tela). O prompt pede as clareiras
 * nesses pontos; se a imagem gerada sair diferente, basta ajustar aqui por mundo.
 */
export const DEFAULT_NODES: [number, number][] = [
  [0.13, 0.66],
  [0.37, 0.44],
  [0.62, 0.62],
  [0.86, 0.38],
];
/**
 * Centro das 4 clareiras em cada ilustração (pixels da imagem original 1536x1024),
 * medidos nas imagens geradas. Convertidos para a tela em `imageNodes`.
 */
export const ART_NODES: Record<number, [number, number][]> = {
  1: [[232, 595], [592, 377], [957, 527], [1306, 331]],
  2: [[186, 620], [536, 447], [938, 568], [1300, 410]],
  3: [[215, 623], [568, 458], [940, 580], [1312, 418]],
  4: [[198, 632], [570, 452], [942, 594], [1336, 417]],
  5: [[230, 610], [566, 452], [930, 570], [1312, 410]],
  6: [[214, 617], [566, 435], [930, 592], [1306, 383]],
  7: [[212, 642], [562, 446], [944, 566], [1314, 395]],
};

/** A ilustração ocupa a largura da tela (1280x853) centralizada na vertical. */
function imageNodes(world: number): [number, number][] | undefined {
  const pts = ART_NODES[world];
  if (!pts) return undefined;
  const s = GAME_W / 1536, top = GAME_H / 2 - (1024 * s) / 2;
  return pts.map(([x, y]) => [(x * s) / GAME_W, (top + y * s) / GAME_H]);
}

// Mapa de um mundo: as 4 fases ligadas por um caminho. ← → escolhe, ENTER joga, ESC volta.
export class WorldMapScene extends Phaser.Scene {
  private save!: SaveData;
  private world = 1;
  private levels: (typeof LEVEL_META)[number][] = [];
  private cursor = 0; // índice dentro do mundo (0..3)
  private token!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private info!: Phaser.GameObjects.Text;
  private markers: (Phaser.GameObjects.Image | Phaser.GameObjects.Arc)[] = [];
  private markerLabels: Phaser.GameObjects.Text[] = [];
  private leaving = false;
  private fx?: Ambient;
  private fxColor = 1;

  constructor() {
    super('WorldMap');
  }

  create(data: { world: number; focus?: number }) {
    applyColorblind(this);
    this.save = loadSave();
    this.leaving = false;
    this.fx = undefined;
    this.markers = [];
    this.markerLabels = [];
    this.world = data.world;
    this.levels = LEVEL_META.filter((l) => l.world === this.world);
    const focus = this.levels.findIndex((l) => l.index === data.focus);
    const lastOpen = Math.max(0, ...this.levels.map((l, i) => (isUnlocked(l.index, this.save.completed) ? i : 0)));
    this.cursor = focus >= 0 && isUnlocked(this.levels[focus].index, this.save.completed) ? focus : lastOpen;

    const w = worldInfo(this.world);
    const art = has(this, `w${this.world}_map`);
    const nodes = (art && imageNodes(this.world)) || DEFAULT_NODES;
    const pts = nodes.map(([fx, fy]) => new Phaser.Math.Vector2(fx * GAME_W, fy * GAME_H));

    // fundo: a ilustração do mapa do mundo; sem ela, o cenário do mundo escurecido + caminho desenhado
    if (art) {
      this.add.image(GAME_W / 2, GAME_H / 2, `w${this.world}_map`).setDisplaySize(GAME_W, (GAME_W / 1536) * 1024);
      // água, cachoeiras, névoa e fumaça em movimento por cima da ilustração (abaixo das clareiras)
      this.fx = new Ambient(this, 0);
      mapFx(this.fx, this.world);
      // quanto mais fases concluídas, mais o mundo "respira" (menos névoa, mais vida)
      const done = this.levels.filter((l) => this.save.completed.includes(l.id)).length;
      this.fxColor = 0.5 + 0.5 * (done / Math.max(1, this.levels.length));
    } else {
      const bg = `w${this.world}_bg_far`;
      if (has(this, bg)) this.add.image(GAME_W / 2, GAME_H / 2, bg).setDisplaySize((GAME_H / 720) * 2160, GAME_H);
      this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120d1a, 0.35).setOrigin(0);
      const path = this.add.graphics();
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        for (let k = 0; k <= 12; k++) path.fillStyle(0xfff3c4, 0.85).fillCircle(Phaser.Math.Linear(a.x, b.x, k / 12), Phaser.Math.Linear(a.y, b.y, k / 12), 4);
      }
    }

    this.add.text(GAME_W / 2, 34, `Mundo ${w.id} · ${w.name}`, textStyle(34, Phaser.Display.Color.IntegerToColor(w.color).rgba)).setOrigin(0.5);

    // clareiras das fases
    this.levels.forEach((l, i) => {
      const open = isUnlocked(l.index, this.save.completed);
      const done = this.save.completed.includes(l.id);
      const frame = l.boss ? (done ? ICON.bossDone : open ? ICON.bossLocked : ICON.locked) : done ? ICON.done : open ? ICON.open : ICON.locked;
      const p = pts[i];
      const node = has(this, 'map_icons')
        ? this.add.image(p.x, p.y, 'map_icons', String(frame)).setScale(l.boss ? 0.7 : 0.55)
        : this.add.circle(p.x, p.y, 26, open ? 0xffe9a8 : 0x777777);
      this.markers.push(node);
      if (open && !done) this.tweens.add({ targets: node, scale: node.scale * 1.08, duration: 700, yoyo: true, repeat: -1 });
      if (open) node.setInteractive({ useHandCursor: true }).on('pointerdown', () => (i === this.cursor ? this.play() : this.select(i)));

      const got = (this.save.shards[l.id] ?? []).filter(Boolean).length;
      const label = l.boss ? `${l.id}  ♛` : `${l.id}  ◆ ${got}/3`;
      this.markerLabels.push(this.add.text(p.x, p.y + 44, label, textStyle(17, open ? '#ffffff' : '#9a93a8')).setOrigin(0.5, 0));
    });

    const p0 = pts[this.cursor];
    this.token = has(this, 'map_icons')
      ? this.add.image(p0.x, p0.y - 34, 'map_icons', String(ICON.iris)).setOrigin(0.5, 1).setScale(0.6)
      : this.add.circle(p0.x, p0.y - 34, 16, 0xb06cf0);
    this.bob();

    // Painel e instruções ficam dentro da área segura do mapa, sem escapar da ilustração.
    const panelY = GAME_H - 77;
    panel(this, GAME_W / 2, panelY, 900, 118);
    this.info = this.add.text(GAME_W / 2, panelY + 5, '', { ...textStyle(24, '#3b2252'), align: 'center', wordWrap: { width: 810, useAdvancedWrap: true } }).setOrigin(0.5).setStroke('#ffffff', 4);
    this.add.text(GAME_W / 2, panelY + 39, '← → escolher fase   ·   ENTER jogar   ·   ESC mapa-múndi', textStyle(16, '#3b2252')).setOrigin(0.5).setStroke('#ffffff', 2);

    const kb = this.input.keyboard!;
    const step = (d: number) => {
      const n = this.cursor + d;
      if (n >= 0 && n < this.levels.length && isUnlocked(this.levels[n].index, this.save.completed)) this.select(n);
    };
    for (const k of ['LEFT', 'A', 'UP', 'W']) kb.on(`keydown-${k}`, () => step(-1));
    for (const k of ['RIGHT', 'D', 'DOWN', 'S']) kb.on(`keydown-${k}`, () => step(1));
    for (const k of ['ENTER', 'SPACE', 'Z', 'X', 'J']) kb.on(`keydown-${k}`, () => this.play());
    kb.on('keydown-ESC', () => this.back());
    this.input.gamepad?.on('down', (_p: Phaser.Input.Gamepad.Gamepad, b: Phaser.Input.Gamepad.Button) => {
      if (b.index === 14) step(-1);
      else if (b.index === 15) step(1);
      else if (b.index === 0) this.play();
      else if (b.index === 1) this.back();
    });

    this.pts = pts;
    this.select(this.cursor, true);
    this.cameras.main.fadeIn(400);
    playMusic(this, 'map');
  }

  private pts: Phaser.Math.Vector2[] = [];

  update(_time: number, delta: number) {
    this.fx?.update(delta / 1000, 0, this.fxColor);
  }

  private bob() {
    this.tweens.add({ targets: this.token, y: '-=8', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  private select(i: number, instant = false) {
    if (!instant) playSfx(this, 'menu_move');
    this.cursor = i;
    // A clareira já faz parte da arte; não sobrepor o ícone de fase ao token da Íris.
    this.markers.forEach((marker, index) => marker.setVisible(index !== i));
    this.markerLabels.forEach((label, index) => label.setVisible(index !== i));
    const l = this.levels[i];
    this.info.setText(`${l.id} · ${l.name}`);
    // Evita que nomes extensos ocupem a linha das instruções abaixo.
    this.info.setFontSize(this.info.height > 56 ? 19 : 24);
    const p = this.pts[i];
    this.tweens.killTweensOf(this.token);
    this.tweens.add({ targets: this.token, x: p.x, y: p.y - 34, duration: instant ? 0 : 400, ease: 'Sine.InOut', onComplete: () => this.bob() });
  }

  private play() {
    const l = this.levels[this.cursor];
    if (this.leaving || !isUnlocked(l.index, this.save.completed)) return;
    this.leaving = true;
    playSfx(this, 'menu_select', 0);
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start('Game', { level: l.index }));
  }

  private back() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(250);
    this.time.delayedCall(270, () => this.scene.start('Map', { focus: this.levels[this.cursor].index }));
  }
}
