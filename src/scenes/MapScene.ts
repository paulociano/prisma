import Phaser from 'phaser';
import { applyColorblind } from '../systems/Settings';
import { GAME_H, GAME_W } from '../config';
import { has } from '../gfx/art';
import { panel, textStyle } from '../gfx/ui';
import { LEVEL_META, isUnlocked } from '../levels';
import { WORLDS, worldInfo } from '../levels/worlds';
import { playMusic, playSfx } from '../systems/Audio';
import { loadSave, type SaveData } from '../systems/Save';
import { Ambient } from '../systems/Ambient';
import { overviewFx } from '../systems/WorldFx';

// Ícones do atlas "map_icons".
const ICON = { locked: 0, open: 1, done: 2, bossLocked: 3, bossDone: 4, iris: 5, flag: 6, dots: 7, shard: 8 };

// Mapa-múndi: cada mundo é uma clareira do mapa; embaixo, um resumo das fases do mundo.
// ← → escolhe o mundo, ENTER abre o mapa daquele mundo (onde se escolhe a fase).
export class MapScene extends Phaser.Scene {
  private save!: SaveData;
  private cursor = 0;
  private token!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private cards!: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;
  private fx?: Ambient;

  constructor() {
    super('Map');
  }

  create(data: { focus?: number }) {
    applyColorblind(this);
    this.save = loadSave();
    const unlocked = LEVEL_META.filter((l) => isUnlocked(l.index, this.save.completed)).map((l) => l.index);
    this.cursor = Phaser.Math.Clamp(data?.focus ?? this.save.level, 0, Math.max(...unlocked));
    if (!isUnlocked(this.cursor, this.save.completed)) this.cursor = Math.max(...unlocked);

    this.fx = undefined;
    if (has(this, 'world_map')) {
      this.add.image(GAME_W / 2, GAME_H / 2, 'world_map').setDisplaySize(GAME_W, (GAME_W / 1536) * 1024);
      this.fx = new Ambient(this, 0);
      overviewFx(this.fx);
    } else this.add.rectangle(0, 0, GAME_W, GAME_H, 0x6a8ad8).setOrigin(0);

    // clareiras dos mundos
    for (const w of WORLDS) {
      const levels = LEVEL_META.filter((l) => l.world === w.id);
      const open = levels.length > 0 && isUnlocked(levels[0].index, this.save.completed);
      const done = levels.length > 0 && levels.every((l) => this.save.completed.includes(l.id));
      const frame = done ? ICON.done : open ? ICON.open : ICON.locked;
      const icon = this.icon(w.map.x, w.map.y, frame, 0.55);
      if (open) {
        icon.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.enterWorld(this.firstOpenOf(w.id)));
        if (!done) this.tweens.add({ targets: icon, scale: icon.scale * 1.08, duration: 700, yoyo: true, repeat: -1 });
      }
    }

    const start = worldInfo(LEVEL_META[this.cursor].world).map;
    this.token = has(this, 'map_icons')
      ? this.add.image(start.x, start.y - 30, 'map_icons', String(ICON.iris)).setOrigin(0.5, 1).setScale(0.6)
      : this.add.circle(start.x, start.y - 30, 16, 0xb06cf0);
    this.tweens.add({ targets: this.token, y: '-=8', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    panel(this, GAME_W / 2, GAME_H - 105, 1100, 190);
    this.title = this.add.text(GAME_W / 2, GAME_H - 178, '', textStyle(30)).setOrigin(0.5);
    this.cards = this.add.container(0, 0);
    this.add.text(GAME_W - 16, 16, '← → escolher mundo · ENTER entrar · ESC título', textStyle(18)).setOrigin(1, 0);

    const kb = this.input.keyboard!;
    const step = (d: number) => {
      // pula de mundo em mundo (só os liberados)
      const w = LEVEL_META[this.cursor].world + d;
      const first = LEVEL_META.find((l) => l.world === w);
      if (first && isUnlocked(first.index, this.save.completed)) this.select(this.firstOpenOf(w));
    };
    kb.on('keydown-LEFT', () => step(-1));
    kb.on('keydown-A', () => step(-1));
    kb.on('keydown-RIGHT', () => step(1));
    kb.on('keydown-D', () => step(1));
    for (const k of ['ENTER', 'SPACE', 'Z', 'X', 'J']) kb.on(`keydown-${k}`, () => this.play());
    kb.on('keydown-ESC', () => this.scene.start('Title'));
    this.input.gamepad?.on('down', (_p: Phaser.Input.Gamepad.Gamepad, b: Phaser.Input.Gamepad.Button) => {
      if (b.index === 14) step(-1);
      else if (b.index === 15) step(1);
      else if (b.index === 0) this.play();
    });

    this.select(this.cursor, true);
    this.cameras.main.fadeIn(400);
    playMusic(this, 'map');
  }

  update(_time: number, delta: number) {
    this.fx?.update(delta / 1000);
  }

  private icon(x: number, y: number, frame: number, scale: number) {
    return has(this, 'map_icons')
      ? this.add.image(x, y, 'map_icons', String(frame)).setScale(scale)
      : this.add.circle(x, y, 26, frame === ICON.locked ? 0x777777 : 0xffe9a8);
  }

  private firstOpenOf(world: number) {
    const levels = LEVEL_META.filter((l) => l.world === world);
    return (levels.find((l) => !this.save.completed.includes(l.id)) ?? levels[0]).index;
  }

  private select(index: number, instant = false) {
    if (!instant) playSfx(this, 'menu_move');
    this.cursor = index;
    const meta = LEVEL_META[index];
    const w = worldInfo(meta.world);
    this.title.setText(`Mundo ${w.id} · ${w.name}`).setColor(Phaser.Display.Color.IntegerToColor(w.color).rgba);
    this.tweens.killTweensOf(this.token);
    this.tweens.add({
      targets: this.token,
      x: w.map.x,
      y: w.map.y - 30,
      duration: instant ? 0 : 450,
      ease: 'Sine.InOut',
      onComplete: () => this.tweens.add({ targets: this.token, y: '-=8', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' }),
    });
    this.drawCards(meta.world);
  }

  /** Cartões das fases do mundo: estado, fragmentos e destaque na fase escolhida. */
  private drawCards(world: number) {
    this.cards.removeAll(true);
    const levels = LEVEL_META.filter((l) => l.world === world);
    const cw = 240, gap = 20;
    const x0 = GAME_W / 2 - ((levels.length - 1) * (cw + gap)) / 2;
    levels.forEach((l, i) => {
      const x = x0 + i * (cw + gap), y = GAME_H - 92;
      const open = isUnlocked(l.index, this.save.completed);
      const done = this.save.completed.includes(l.id);
      const selected = l.index === this.cursor;
      const bg = this.add.rectangle(x, y, cw, 92, selected ? 0xffe9a8 : 0x3b2252, selected ? 0.95 : 0.75).setStrokeStyle(selected ? 5 : 2, 0xffffff);
      const frame = l.boss ? (done ? ICON.bossDone : ICON.bossLocked) : done ? ICON.done : open ? ICON.open : ICON.locked;
      const icon = this.icon(x - cw / 2 + 40, y, open || done ? frame : ICON.locked, 0.38);
      const color = selected ? '#3b2252' : '#ffffff';
      // Reserva a largura interna do cartão para o título, sem invadir o vizinho.
      const textX = x - cw / 2 + 76;
      const maxTextWidth = cw - 86;
      const name = this.add.text(textX, y - 30, `${l.id}\n${l.name}`, {
        ...textStyle(18, color),
        strokeThickness: selected ? 0 : 4,
        lineSpacing: 2,
        wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
      });
      // Títulos longos cabem sem quebrar a faixa inferior de fragmentos.
      if (name.height > 51 || name.width > maxTextWidth) {
        name.setFontSize(15);
        name.setWordWrapWidth(maxTextWidth, true);
      }
      const items: Phaser.GameObjects.GameObject[] = [bg, icon, name];
      if (!l.boss && open) {
        const got = (this.save.shards[l.id] ?? []).filter(Boolean).length;
        items.push(this.add.text(x - cw / 2 + 76, y + 18, `◆ ${got}/3${this.save.secrets[l.id] ? '  ✦' : ''}`, { ...textStyle(16, selected ? '#7a3cc0' : '#c9b6ff'), strokeThickness: selected ? 0 : 3 }));
      }
      if (open) bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.enterWorld(l.index));
      this.cards.add(items);
    });
  }

  /** ENTER: abre o mapa do mundo selecionado, com o cursor na fase escolhida. */
  private play() {
    this.enterWorld(this.cursor);
  }

  private enterWorld(focus: number) {
    if (!isUnlocked(focus, this.save.completed)) return;
    this.input.keyboard!.removeAllListeners();
    playSfx(this, 'menu_select', 0);
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start('WorldMap', { world: LEVEL_META[focus].world, focus }));
  }
}
