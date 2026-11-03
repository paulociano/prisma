import Phaser from 'phaser';
import { GAME_H, GAME_W, RAINBOW } from '../config';
import { createAnims } from '../gfx/art';
import { makePlaceholders } from '../gfx/textures';
import { worldOf } from '../systems/Loader';

interface ManifestEntry {
  key: string;
  type: 'atlas' | 'image';
  file: string;
  json?: string;
  res: number;
}

// Frames do atlas "loading_icons": 7 gemas coloridas, gema vazia e 4 quadros da Faísca voando.
// O brilho fica no atlas "loading_twinkle".
const GEMS = [0, 1, 2, 3, 4, 5, 6];
const GEM_EMPTY = 7;
const SPARK = [8, 9, 10, 11];
const TWINKLE = [0, 1, 2, 3]; // atlas à parte: loading_twinkle
const GEM_SCALE = 0.36; // gemas com ~80 px na tela

const TIPS = [
  'Segure pular para ir mais alto.',
  'Pule em cima dos Desbotados ou golpeie com a echarpe.',
  'Cada inimigo restaurado devolve um pouco de cor à fase.',
  'Três fragmentos de prisma se escondem em cada fase.',
  'Junte todos os fragmentos para ver o final verdadeiro.',
  'Bandeiras de checkpoint enchem seus corações.',
  'Ninguém precisa se apagar para caber.',
];

const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';
const MIN_SHOW_MS = 1400; // tempo mínimo para a animação aparecer, mesmo carregando rápido

// Carrega o manifest gerado por `npm run assets` e depois os assets listados nele.
// Se existir a arte "loading_icons", a tela de carregamento vira sete gemas que acendem
// em arco-íris com a Faísca voando por cima; senão, uma barra arco-íris simples.
export class BootScene extends Phaser.Scene {
  private manifest?: { sprites: ManifestEntry[]; audio?: { key: string; file: string }[] };

  constructor() {
    super('Boot');
  }

  preload() {
    this.load.json('manifest', 'assets/manifest.json');
  }

  create() {
    this.manifest = this.cache.json.get('manifest');
    const icons = this.manifest?.sprites.filter((s) => s.key === 'loading_icons' || s.key === 'loading_twinkle') ?? [];
    if (icons.length < 2) return this.loadAll(false);
    // primeiro só os ícones do carregamento (e o logo); depois todo o resto
    for (const s of icons) this.load.atlas(s.key, `assets/${s.file}`, `assets/${s.json}`);
    const logo = this.manifest?.sprites.find((s) => s.key === 'logo');
    if (logo) this.load.image(logo.key, `assets/${logo.file}`);
    // começa a segunda etapa no próximo quadro: se fosse dentro deste aviso de "complete",
    // o aviso da segunda etapa disparava junto e a tela título abria antes de tudo carregar
    this.load.once('complete', () => this.time.delayedCall(0, () => this.loadAll(true)));
    this.load.start();
  }

  private loadAll(fancy: boolean) {
    const res: Record<string, number> = {};
    // mundos 2 a 7 só baixam quando o jogador chega neles (ver systems/Loader.ts)
    for (const a of this.manifest?.audio ?? []) if (worldOf(a.key) <= 1) this.load.audio(a.key, `assets/${a.file}`);
    for (const s of this.manifest?.sprites ?? []) {
      res[s.key] = s.res;
      if (worldOf(s.key) > 1 || this.textures.exists(s.key)) continue;
      if (s.type === 'atlas') this.load.atlas(s.key, `assets/${s.file}`, `assets/${s.json}`);
      else this.load.image(s.key, `assets/${s.file}`);
    }
    this.registry.set('res', res);

    const onProgress = fancy ? this.fancyLoader() : this.simpleLoader();
    this.load.on('progress', onProgress);
    this.tips();

    const t0 = this.time.now;
    this.load.once('complete', () => {
      onProgress(1);
      makePlaceholders(this);
      createAnims(this);
      const wait = Math.max(0, MIN_SHOW_MS - (this.time.now - t0));
      this.time.delayedCall(wait + 300, () => {
        this.cameras.main.fadeOut(300);
        this.time.delayedCall(320, () => this.scene.start('Title'));
      });
    });
    this.load.start();
  }

  /** Sete gemas que acendem em ordem; a Faísca voa sobre a gema da vez. */
  private fancyLoader() {
    const y = GAME_H / 2 + 10, gap = 96, x0 = GAME_W / 2 - gap * 3;
    if (this.textures.exists('logo')) {
      // logo pequeno, discreto, no alto da tela
      const logo = this.add.image(GAME_W / 2, 60, 'logo').setScale(0.2);
      this.tweens.add({ targets: logo, y: logo.y - 4, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    } else this.add.text(GAME_W / 2, y - 150, 'Prisma', { fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);

    const gems = GEMS.map((_, i) => {
      const g = this.add.image(x0 + i * gap, y, 'loading_icons', String(GEM_EMPTY)).setScale(GEM_SCALE);
      this.tweens.add({ targets: g, y: y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 120 });
      return g;
    });

    const spark = this.add.sprite(x0, y - 82, 'loading_icons', String(SPARK[0])).setScale(0.42);
    if (!this.anims.exists('loading-spark')) {
      this.anims.create({ key: 'loading-spark', frames: SPARK.map((f) => ({ key: 'loading_icons', frame: String(f) })), frameRate: 10, repeat: -1 });
      this.anims.create({ key: 'loading-twinkle', frames: TWINKLE.map((f) => ({ key: 'loading_twinkle', frame: String(f) })), frameRate: 16 });
    }
    spark.play('loading-spark');
    this.tweens.add({ targets: spark, y: y - 90, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    let lit = 0;
    let move: Phaser.Tweens.Tween | undefined;
    return (p: number) => {
      const target = Math.min(7, Math.floor(p * 7 + 0.0001));
      while (lit < target) {
        const g = gems[lit];
        g.setFrame(String(GEMS[lit]));
        this.tweens.add({ targets: g, scale: { from: GEM_SCALE * 1.35, to: GEM_SCALE }, duration: 300, ease: 'Back.Out' });
        const fx = this.add.sprite(g.x, g.y, 'loading_twinkle', String(TWINKLE[0])).setScale(0.6).setDepth(2);
        fx.play('loading-twinkle').once('animationcomplete', () => fx.destroy());
        lit++;
      }
      move?.stop();
      move = this.tweens.add({ targets: spark, x: gems[Math.min(6, lit)].x, duration: 250, ease: 'Sine.Out' });
    };
  }

  /** Barra arco-íris simples (enquanto a arte do carregamento não existe). */
  private simpleLoader() {
    const w = 520, x = GAME_W / 2 - w / 2, y = GAME_H / 2;
    this.add.text(GAME_W / 2, y - 40, 'Prisma', { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.add.rectangle(x, y, w, 14, 0x3b2252).setOrigin(0, 0.5);
    const bar = this.add.rectangle(x, y, 1, 14, RAINBOW[0]).setOrigin(0, 0.5);
    return (p: number) => {
      bar.width = Math.max(1, w * p);
      bar.fillColor = RAINBOW[Math.min(6, Math.floor(p * 7))];
    };
  }

  /** Dicas que trocam suavemente na parte de baixo. */
  private tips() {
    const tip = this.add
      .text(GAME_W / 2, GAME_H - 70, '', { fontFamily: FONT, fontSize: '19px', color: '#e9dcff', align: 'center' })
      .setOrigin(0.5)
      .setAlpha(0);
    let i = Phaser.Math.Between(0, TIPS.length - 1);
    const show = () => {
      tip.setText(`✦  ${TIPS[i++ % TIPS.length]}`);
      this.tweens.add({ targets: tip, alpha: { from: 0, to: 0.9 }, duration: 400 });
    };
    show();
    this.time.addEvent({ delay: 2600, loop: true, callback: () => this.tweens.add({ targets: tip, alpha: 0, duration: 300, onComplete: show }) });
  }
}
