import Phaser from 'phaser';
import { applyColorblind } from '../systems/Settings';
import { GAME_W, GAME_H } from '../config';
import { F, has } from '../gfx/art';
import type { HudState } from './GameScene';
import type { LevelData } from '../levels/LevelBuilder';

const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

interface Result {
  coins: number;
  shards: number;
  restored: number;
  enemies: number;
  boss: boolean;
  worldDone: number;
  worldName: string;
  nextWorld: string;
}

// Interface por cima do jogo: corações, faíscas, fragmentos e a tela de fase concluída.
export class HudScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private coinText!: Phaser.GameObjects.Text;
  private shardIcons: Phaser.GameObjects.Image[] = [];
  private overlay?: Phaser.GameObjects.Container;

  constructor() {
    super('Hud');
  }

  private art = false;

  /** Ícone do atlas "hud" (ou textura provisória). */
  private icon(x: number, y: number, frame: number, placeholder: string) {
    return this.art ? this.add.image(x, y, 'hud', String(frame)).setScale(0.5) : this.add.image(x, y, placeholder);
  }

  private setIcon(img: Phaser.GameObjects.Image, frame: number, placeholder: string) {
    if (this.art) img.setFrame(String(frame));
    else img.setTexture(placeholder);
  }

  create() {
    applyColorblind(this);
    // a instância da cena é reaproveitada ao reiniciar: começa as listas do zero
    this.hearts = [];
    this.shardIcons = [];
    this.overlay = undefined;
    this.bossUi = undefined;
    this.art = has(this, 'hud');
    if (this.art) this.add.image(48, 56, 'hud', String(F.hud.iris)).setScale(0.7);
    const hx = this.art ? 96 : 40;
    for (let i = 0; i < 3; i++) this.hearts.push(this.icon(hx + i * 46, 40, F.hud.heart, 'heart'));

    const coin = this.icon(hx, 88, F.hud.coin, 'coin');
    if (!this.art) coin.setTint(0xffd93d);
    this.coinText = this.add.text(hx + 26, 88, '0', this.style(26)).setOrigin(0, 0.5);

    for (let i = 0; i < 3; i++) this.shardIcons.push(this.icon(GAME_W - 130 + i * 46, 44, F.hud.shardEmpty, 'shard'));

    const game = this.scene.get('Game');
    game.events.on('hud', this.refresh, this);
    game.events.on('level-start', this.showTitle, this);
    game.events.on('level-complete', this.showComplete, this);
    game.events.on('boss-hp', this.bossBar, this);
    game.events.on('toast', this.toast, this);
    // se o HUD for reiniciado, não deixa ouvintes duplicados na cena do jogo
    this.events.once('shutdown', () => {
      for (const ev of ['hud', 'level-start', 'level-complete', 'boss-hp', 'toast']) game.events.off(ev, undefined, this);
    });
  }

  private bossUi?: Phaser.GameObjects.Container;

  /** Nome e "pedras de vida" do chefão no topo da tela; null esconde. */
  private bossBar(b: { name: string; hp: number; max: number } | null) {
    this.bossUi?.destroy();
    this.bossUi = undefined;
    if (!b) return;
    const items: Phaser.GameObjects.GameObject[] = [this.add.text(GAME_W / 2, 30, b.name, this.style(26)).setOrigin(0.5)];
    for (let i = 0; i < b.max; i++) {
      const x = GAME_W / 2 + (i - (b.max - 1) / 2) * 44;
      items.push(this.add.rectangle(x, 68, 34, 16, i < b.hp ? 0xc9c9d4 : 0x3a2f4a).setStrokeStyle(3, 0x24133a));
    }
    this.bossUi = this.add.container(0, 0, items);
  }

  private lastToast?: Phaser.GameObjects.Text;

  private toast(text: string) {
    this.lastToast?.destroy(); // um aviso por vez
    const t =this.add.text(GAME_W / 2, GAME_H * 0.42, text, { ...this.style(34), align: 'center', color: '#ffd93d' }).setOrigin(0.5).setScale(0.6).setAlpha(0);
    this.tweens.chain({
      targets: t,
      tweens: [
        { alpha: 1, scale: 1, duration: 350, ease: 'Back.Out' },
        { alpha: 0, y: t.y - 30, duration: 500, delay: 1800 },
      ],
      onComplete: () => t.destroy(),
    });
    this.lastToast = t;
  }

  private style(size: number): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color: '#ffffff', stroke: '#3b2252', strokeThickness: 6 };
  }

  private refresh(s: HudState) {
    const hx = this.art ? 96 : 40;
    while (this.hearts.length < s.maxHp) this.hearts.push(this.icon(hx + this.hearts.length * 46, 40, F.hud.heart, 'heart'));
    this.hearts.forEach((h, i) => (i < s.hp ? this.setIcon(h, F.hud.heart, 'heart') : this.setIcon(h, F.hud.heartEmpty, 'heart_empty')));
    // faíscas da fase e o progresso até o próximo coração (a cada 50)
    this.coinText.setText(`${s.coins}  ·  ${s.coinBank}/50 ♥`);
    this.shardIcons.forEach((icon, i) => {
      icon.setVisible(s.showShards);
      if (this.art) icon.setFrame(String(s.shards[i] ? F.hud.shard : F.hud.shardEmpty));
      else icon.setTint(s.shards[i] ? 0xffffff : 0x3a2f4a).setAlpha(s.shards[i] ? 1 : 0.7);
    });
  }

  private showTitle(l: LevelData) {
    this.overlay?.destroy();
    this.overlay = undefined;
    this.bossBar(null);
    const t = this.add.text(GAME_W / 2, GAME_H * 0.3, `${l.id}  ·  ${l.name}`, this.style(44)).setOrigin(0.5).setAlpha(0);
    this.tweens.chain({
      targets: t,
      tweens: [
        { alpha: 1, y: GAME_H * 0.28, duration: 500 },
        { alpha: 0, duration: 600, delay: 1600 },
      ],
      onComplete: () => t.destroy(),
    });
  }

  private showComplete(r: Result) {
    const bg = this.add.rectangle(GAME_W / 2, GAME_H / 2, 600, 300, 0x2a1840, 0.85).setStrokeStyle(4, 0xffffff, 0.8);
    const titleText = r.worldDone ? `Mundo ${r.worldDone} restaurado!` : 'A cor voltou!';
    const title = this.add.text(GAME_W / 2, GAME_H / 2 - 90, titleText, this.style(48)).setOrigin(0.5);
    const lines = r.boss
      ? [`A cor voltou ao ${r.worldName}!`, `Próximo destino: ${r.nextWorld}`]
      : [`Faíscas: ${r.coins}`, `Fragmentos: ${r.shards} / 3`, `Desbotados restaurados: ${r.restored} / ${r.enemies}`];
    const body = this.add.text(GAME_W / 2, GAME_H / 2 + 5, lines.join('\n'), { ...this.style(26), align: 'center', lineSpacing: 8 }).setOrigin(0.5);
    const hint = this.add.text(GAME_W / 2, GAME_H / 2 + 110, 'aperte qualquer tecla para voltar ao mapa', this.style(18)).setOrigin(0.5);
    this.overlay = this.add.container(0, 0, [bg, title, body, hint]).setAlpha(0);
    this.tweens.add({ targets: this.overlay, alpha: 1, duration: 500, delay: 600 });
  }
}
