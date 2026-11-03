import Phaser from 'phaser';
import { applyColorblind, canFlashScreen, canShakeCamera, difficultyTuning, extraSignals, getSettings } from '../systems/Settings';
import { COLOR_POINTS, GAME_H, GAME_W, PHYS, RAINBOW, TILE } from '../config';
import { F, has } from '../gfx/art';
import { texRes } from '../gfx/textures';
import { LEVELS } from '../levels';
import { T, type LevelData } from '../levels/LevelBuilder';
import { Enemy, type EnemyHost, type EnemyKind } from '../objects/Enemy';
import { Player } from '../objects/Player';
import type { Boss, BossHost } from '../objects/Boss';
import { ColdSpotlight } from '../objects/ColdSpotlight';
import { Eclipse } from '../objects/Eclipse';
import { Monochrome } from '../objects/Monochrome';
import { Kraken } from '../objects/Kraken';
import { SandSerpent } from '../objects/SandSerpent';
import { Thornweed } from '../objects/Thornweed';
import { StoneJudge } from '../objects/StoneJudge';
import { worldInfo } from '../levels/worlds';
import { STORY } from '../story';
import { isMuted, musicForLevel, playMusic, playSfx, toggleMute } from '../systems/Audio';
import { ColorRestore } from '../systems/ColorRestore';
import { BossDamage } from '../systems/BossDamage';
import { Controls } from '../systems/Controls';
import { Ambient } from '../systems/Ambient';
import { ensureBlockTextures, PORTAL_FRAMES } from '../gfx/blocks';
import { buildSub } from '../levels/subs';
import { arenaFx, levelFx, type Rect } from '../systems/WorldFx';
import { loadSave, writeSave, type SaveData } from '../systems/Save';
import { ENDING, TRUE_ENDING } from './CutsceneScene';
import { worldEpilogueWithFallback } from '../story/cutsceneWorlds';
import type { Line } from './DialogueScene';

interface Mover {
  zone: Phaser.GameObjects.Zone;
  view: Phaser.GameObjects.Image;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  period: number;
  t: number;
}

interface Guardian {
  zone: Phaser.GameObjects.Zone;
  view: Phaser.GameObjects.Image;
  hits: number;
  freed: boolean;
}

type SubFrom = { level: number; x: number; y: number };
type Sprite = Phaser.Physics.Arcade.Sprite;

export interface HudState {
  hp: number;
  maxHp: number;
  coins: number;
  shards: boolean[];
  levelName: string;
  levelId: string;
  showShards: boolean;
  coinBank: number;
}

const ENEMY_KINDS = new Set<string>(['blot', 'moth', 'megaphone', 'padlock', 'beetle', 'scorpion', 'drone', 'snapper', 'puffer', 'comet', 'sentinel']);

/** Para onde cada chefão olha na arte original ('front' = de frente, não precisa virar). */
const BOSS_ART_FACING: Record<number, 'left' | 'right' | 'front'> = { 1: 'left', 2: 'left', 3: 'front', 4: 'right', 5: 'front', 6: 'front', 7: 'right' };

/** Chefão de cada mundo. */
const BOSSES = { 1: StoneJudge, 2: SandSerpent, 3: ColdSpotlight, 4: Thornweed, 5: Kraken, 6: Eclipse, 7: Monochrome } as const;

const COINS_PER_HEART = 50;
/** Fragmentos necessários para cada Coração de Prisma (+1 coração máximo, até 2). */
const SHARDS_PER_HEART = 21;
const totalShards = (s: SaveData) => Object.values(s.shards).reduce((n, a) => n + a.filter(Boolean).length, 0);
const prismHearts = (s: SaveData) => Math.min(2, Math.floor(totalShards(s) / SHARDS_PER_HEART));

/** Altura do piso desenhado em cada arena de chefão (fração da altura da imagem). */
const BEHIND_FX = -5;
/** Altura (base) dos pesos de pedra pendurados nas arenas. */
const WEIGHT_Y = 380;

const ARENA_FLOOR: Record<number, number> = { 1: 0.757, 2: 0.742, 3: 0.78, 4: 0.77, 5: 0.757, 6: 0.69, 7: 0.79 };

/** Gêiser de vapor: ciclo de descanso → aviso → jato que lança Íris. */
interface Vent {
  area: Phaser.Geom.Rectangle;
  steam: Phaser.GameObjects.Particles.ParticleEmitter;
  period: number;
  t: number;
  launched: boolean;
}

/** Rajada de areia: área que empurra Íris horizontalmente. */
interface Wind {
  area: Phaser.Geom.Rectangle;
  push: number;
}

export class GameScene extends Phaser.Scene implements EnemyHost {
  private level!: LevelData;
  private player!: Player;
  private controls!: Controls;
  private color!: ColorRestore;
  private world!: Phaser.GameObjects.Container;
  private bgFar?: Phaser.GameObjects.TileSprite;
  private bgMid?: Phaser.GameObjects.TileSprite;
  private bgNear?: Phaser.GameObjects.TileSprite;
  private spark!: Phaser.GameObjects.Sprite;

  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private oneways!: Phaser.Physics.Arcade.StaticGroup;
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private crates!: Phaser.Physics.Arcade.StaticGroup;
  private pickups!: Phaser.Physics.Arcade.Group;
  private props!: Phaser.Physics.Arcade.StaticGroup;
  private shots!: Phaser.Physics.Arcade.Group;
  private enemies: Enemy[] = [];

  private respawnPoint = new Phaser.Math.Vector2();
  private coins = 0;
  private shards = [false, false, false];
  private finished = false;
  private swingHits = new Set<object>();
  private camOffsetX = 0;

  private levelIndex = 0;
  private save!: SaveData;
  private saveWarningShown = false;
  private movers: Mover[] = [];
  private cages!: Phaser.Physics.Arcade.StaticGroup;
  private guardian?: Guardian;
  private boss?: Boss;
  private vents: Vent[] = [];
  private winds: Wind[] = [];
  private bossWind = 0;
  // blocos interativos, segredos e recompensas dinâmicas
  private bumps!: Phaser.Physics.Arcade.StaticGroup;
  private gatesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private pushboxes!: Phaser.Physics.Arcade.Group;
  private plates: { x: number; y: number; id: number; view: Phaser.GameObjects.Image; on: boolean }[] = [];
  private gates: { ts: Phaser.GameObjects.TileSprite; id: number; open: boolean }[] = [];
  private portals: { x: number; y: number; sub: number; view: Phaser.GameObjects.Image; mode: number; on: boolean }[] = [];
  private fakewalls: Phaser.GameObjects.TileSprite[] = [];
  private portalLock = false;
  private doors: { x: number; y: number; id: number }[] = [];
  private doorLock = false;
  private risk?: Phaser.GameObjects.Image;
  private combo = 0;
  private mercyGiven = false;
  private bossStarted = false;
  private fissureT = 8;
  private bossLost = 0;
  private weights: { x: number; s: Phaser.GameObjects.Sprite; chain: Phaser.GameObjects.Rectangle; shadow: Phaser.GameObjects.Ellipse; vy: number; state: 'hang' | 'fall' | 'gone'; back: number }[] = [];
  private bossGround = 0;
  private isSub = false;
  private initData: { level?: number; sub?: number; from?: SubFrom; back?: SubFrom } = {};
  private bossDamage?: BossDamage;
  private tuning = difficultyTuning(1);
  private coinBank = 0;

  constructor() {
    super('Game');
  }

  create(data: { level?: number; sub?: number; from?: SubFrom; back?: SubFrom }) {
    applyColorblind(this);
    ensureBlockTextures(this);
    this.save = loadSave();
    this.saveWarningShown = false;
    this.initData = data ?? {};
    this.isSub = data?.sub !== undefined && !!data?.from;
    this.levelIndex = Phaser.Math.Clamp((this.isSub ? data.from!.level : data?.level) ?? this.save.level, 0, LEVELS.length - 1);
    this.level = this.isSub ? buildSub(Math.floor(this.levelIndex / 4) + 1, data.sub!) : LEVELS[this.levelIndex]();
    this.plates = []; this.gates = []; this.portals = []; this.doors = []; this.doorLock = false; this.risk = undefined; this.fakewalls = []; this.weights = []; this.fissureT = 8; this.bossLost = 0;
    this.portalLock = false; this.combo = 0; this.mercyGiven = false; this.bossStarted = false;
    this.enemies = [];
    this.movers = [];
    this.guardian = undefined;
    this.boss = undefined;
    this.bossDamage = undefined;
    this.dimRect = undefined;
    this.bossMarker = undefined;
    this.vents = [];
    this.searchlights = [];
    this.waterY = Infinity;
    this.winds = [];
    this.bossWind = 0;
    this.coins = 0;
    this.shards = [false, false, false];
    this.finished = false;

    const worldW = this.level.cols * TILE;
    const worldH = this.level.rows * TILE;
    this.physics.world.setBounds(0, 0, worldW, worldH + 600);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.controls = new Controls(this);
    this.arenaRect = undefined;
    this.bgFarFx = this.bgMidFx = undefined;
    this.ambient = new Ambient(this, BEHIND_FX);
    this.buildBackground();
    this.world = this.add.container(0, 0).setDepth(0);
    this.buildTiles();
    if (!this.level.arena) this.buildDecor();
    const colorTotal = this.buildEntities();
    this.buildHints();
    if (this.boss) this.buildWeights();
    if (data?.back) {
      // voltando de um sub-nível: reaparece ao lado do portal, que só reativa depois de Íris se afastar
      const b = data.back;
      const px = b.x - TILE * 1.5;
      this.player.hit.setPosition(px, b.y - 46);
      this.respawnPoint.set(px, b.y - 46);
      this.portalLock = true;
    }
    this.player.canDoubleJump = this.save.doubleJump;
    this.player.canDash = this.save.dash;
    this.player.canWallJump = this.save.wallJump;
    this.player.canGlide = this.save.glide;
    this.player.canShoot = this.save.shot;
    this.player.canPound = this.save.pound;
    // corações: 3 + escudo de Ás + corações de prisma (fragmentos) + ajuste da dificuldade
    this.tuning = difficultyTuning(this.level.world);
    Enemy.speedScale = this.tuning.enemySpeed;
    this.player.hp = this.player.maxHp = Math.max(2, 3 + (this.save.extraHeart ? 1 : 0) + prismHearts(this.save) + this.tuning.hearts);
    this.coinBank = 0;
    this.player.gravityScale = this.level.gravity ?? 1;
    this.buildWater();

    this.color = new ColorRestore([this.bgContainer, this.world], Math.max(1, colorTotal));
    // fundo vivo: água, cachoeiras, névoa, fumaça… (as cachoeiras ficam presas à arte do fundo)
    if (this.arenaRect) arenaFx(this.ambient, this.level.world, this.arenaRect, this.bgContainer);
    else if (this.bgFarFx && this.bgMidFx) levelFx(this.ambient, this.level.world, { far: this.bgFar, mid: this.bgMid, farInto: this.bgFarFx, midInto: this.bgMidFx });

    this.setupCollisions();
    this.setupEvents();
    this.physics.world.off('worldstep').on('worldstep', (delta: number) => this.stepMovers(delta));
    this.stepMovers(0.0001); // velocidade inicial antes do primeiro passo

    const cam = this.cameras.main;
    if (this.level.arena) {
      cam.setBounds(0, 0, worldW, GAME_H); // arena: câmera parada
    } else {
      // fase mais estreita que a tela (torres verticais): centraliza em vez de encostar na esquerda
      const pad = Math.max(0, GAME_W - worldW) / 2;
      cam.setBounds(-pad, 0, worldW + pad * 2, worldH);
      cam.startFollow(this.player.hit, true, 0.12, 0.12);
      cam.setDeadzone(60, 140);
    }
    cam.fadeIn(400);

    if (!this.scene.isActive('Hud')) this.scene.launch('Hud');
    // espera o HUD terminar de montar antes de mandar o estado
    this.time.delayedCall(30, () => {
      this.pushHud();
      this.events.emit('level-start', this.level);
      playMusic(this, musicForLevel(this.level.world, !!this.level.arena));
      if (this.boss) this.time.delayedCall(900, () => this.talk(STORY[this.level.world].bossIntro, () => {
        this.bossStarted = true;
        this.boss?.start();
      }));
    });

    // atalho de desenvolvimento: teclas 1 a 9 pulam para a fase correspondente
    if (import.meta.env.DEV) {
      this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => {
        const n = Number(ev.key);
        if (n >= 1 && n <= LEVELS.length) this.scene.restart({ level: n - 1 });
      });
    }
  }

  private shakeCamera(duration: number, intensity: number) {
    if (canShakeCamera()) this.cameras.main.shake(duration, intensity);
  }

  private flashScreen(duration: number, red: number, green: number, blue: number) {
    if (canFlashScreen()) this.cameras.main.flash(duration, red, green, blue);
  }

  private sfx(name: string, detune?: number) {
    playSfx(this, name, detune);
  }

  /** Abre um diálogo com o jogo pausado para Íris. */
  private talk(lines: Line[], onDone?: () => void) {
    this.player.frozen = true;
    this.scene.launch('Dialogue', {
      lines,
      onDone: () => {
        this.player.frozen = this.finished;
        onDone?.();
      },
    });
  }

  // ---------- construção da fase ----------

  private bgContainer!: Phaser.GameObjects.Container;
  private ambient!: Ambient;
  private bgFarFx?: Phaser.GameObjects.Container;
  private bgMidFx?: Phaser.GameObjects.Container;
  private waves: { ts: Phaser.GameObjects.TileSprite; speed: number; sc: number }[] = [];
  private arenaRect?: Rect;

  private buildBackground() {
    if (this.level.arena && has(this, this.level.arena)) {
      // posiciona a arte para o piso desenhado ficar na altura do chão do jogo (y = 640)
      const img = this.add.image(0, 0, this.level.arena).setOrigin(0);
      const floor = ARENA_FLOOR[this.level.world];
      img.setScale(Math.max(GAME_W / img.width, 640 / (floor * img.height)));
      img.x = (GAME_W - img.displayWidth) / 2;
      img.y = 640 - floor * img.displayHeight;
      this.arenaRect = { x: img.x, y: img.y, w: img.displayWidth, h: img.displayHeight };
      this.bgContainer = this.add.container(0, 0, [img]);
    } else if (has(this, this.tex('bg_far'))) {
      this.bgFar = this.add.tileSprite(0, 0, GAME_W, GAME_H, this.tex('bg_far')).setOrigin(0);
      this.bgMid = this.add.tileSprite(0, 40, GAME_W, GAME_H, this.tex('bg_mid')).setOrigin(0);
      // primeiro plano baixo: só o topo da folhagem aparece, sem cobrir buracos e espinhos
      this.bgNear = this.add.tileSprite(0, 330, GAME_W, GAME_H, this.tex('bg_near')).setOrigin(0);
      // largura real das imagens (o TileSprite esconde isso): os efeitos presos à arte precisam dela
      for (const [layer, name] of [[this.bgFar, 'bg_far'], [this.bgMid, 'bg_mid']] as const) {
        const src = this.textures.get(this.tex(name)).getSourceImage();
        layer.setData({ period: src.width, height: src.height });
      }
      this.bgFarFx = this.add.container(0, 0);
      this.bgMidFx = this.add.container(0, 0);
      this.bgContainer = this.add.container(0, 0, [this.bgFar, this.bgFarFx, this.bgMid, this.bgMidFx, this.bgNear]);
    } else {
      const sky = this.add.image(0, 0, 'sky').setOrigin(0).setDisplaySize(GAME_W, GAME_H);
      this.bgFar = this.add.tileSprite(0, GAME_H - 420, GAME_W, 360, 'hills_far').setOrigin(0);
      this.bgMid = this.add.tileSprite(0, GAME_H - 330, GAME_W, 360, 'hills_mid').setOrigin(0);
      this.bgContainer = this.add.container(0, 0, [sky, this.bgFar, this.bgMid]);
    }
    this.bgContainer.setScrollFactor(0).setDepth(-10);
  }

  /** Nome da textura do mundo atual: tex('tiles') → 'w2_tiles'. */
  private tex(name: string) {
    return `w${this.level.world}_${name}`;
  }

  private tileAt(c: number, r: number): T {
    if (c < 0 || c >= this.level.cols) return T.Solid; // bordas laterais contam como parede
    if (r < 0 || r >= this.level.rows) return T.Empty;
    return this.level.tiles[r][c];
  }

  isSolidAt(x: number, y: number) {
    const t = this.tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
    return t === T.Solid || t === T.OneWay;
  }

  private buildTiles() {
    this.solids = this.physics.add.staticGroup();
    this.oneways = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    const { rows, cols, tiles } = this.level;
    const art = has(this, this.tex('tiles'));
    const fills = this.add.container(0, 0);
    this.decor = this.add.container(0, 0);
    const tops = this.add.container(0, 0);
    this.world.add([fills, this.decor, tops]); // decoração fica atrás da grama do topo
    if (this.level.arena && has(this, this.level.arena)) {
      // na arena o piso já está desenhado no fundo; só a colisão importa
      fills.setVisible(false);
      tops.setVisible(false);
    }

    // A arte do chão é 3D: os pés pisam DENTRO da face de cima do bloco, não na borda.
    // Por isso a linha de superfície da peça é desenhada SINK px acima da linha física.
    const SINK = 14;
    const strip = art && has(this, this.tex('tiles_strip'));
    const surface = (frame: number) => {
      const f = this.textures.getFrame(this.tex('tiles'), String(frame));
      return { pivotY: f.customPivot ? f.pivotY : 0, h: f.height / 2 };
    };
    const capAt = (c: number, y: number, frame: number) => {
      const s = surface(frame);
      tops.add(this.add.image(c * TILE + TILE / 2, y - SINK, this.tex('tiles'), String(frame)).setOrigin(0.5, s.pivotY).setScale(0.5));
    };
    /** Desenha um trecho contínuo de topo de chão (colunas c0..c1). */
    const drawTopRun = (c0: number, c1: number, y: number) => {
      const openL = this.tileAt(c0 - 1, Math.floor(y / TILE)) !== T.Solid;
      const openR = this.tileAt(c1 + 1, Math.floor(y / TILE)) !== T.Solid;
      if (strip) {
        // faixa contínua (sem emendas) e, nas pontas abertas, as peças de canto por cima
        const s = surface(F.w1Tiles.top);
        const ts = this.add.tileSprite(c0 * TILE, y - SINK - s.pivotY * s.h, (c1 - c0 + 1) * TILE, s.h, this.tex('tiles_strip'));
        tops.add(ts.setOrigin(0).setTileScale(0.5).setTilePosition(c0 * TILE * 2, 0));
        if (openL && c1 > c0) capAt(c0, y, F.w1Tiles.topLeft);
        if (openR && c1 > c0) capAt(c1, y, F.w1Tiles.topRight);
        return;
      }
      for (let c = c0; c <= c1; c++) {
        const l = c === c0 && openL, rr = c === c1 && openR;
        capAt(c, y, l && !rr ? F.w1Tiles.topLeft : rr && !l ? F.w1Tiles.topRight : F.w1Tiles.top);
      }
    };

    for (let r = 0; r < rows; r++) {
      let runStart = -1;
      let fillStart = -1;
      let fillTop = false;
      let topStart = -1;
      for (let c = 0; c <= cols; c++) {
        const t = c < cols ? tiles[r][c] : T.Empty;
        const x = c * TILE, y = r * TILE;
        const solid = t === T.Solid;
        const top = solid && this.tileAt(c, r - 1) !== T.Solid;

        // trechos de topo: desenhados de uma vez quando o trecho termina
        if (top && topStart < 0) topStart = c;
        if (!top && topStart >= 0) {
          if (art) drawTopRun(topStart, c - 1, y);
          else for (let i = topStart; i < c; i++) tops.add(this.add.image(i * TILE, y, 'tile_top').setOrigin(0));
          topStart = -1;
        }

        if (t === T.OneWay) {
          if (art) tops.add(this.add.image(x + TILE / 2, y - 2, this.tex('tiles'), String(F.w1Tiles.plank)).setOrigin(0.5, 0).setDisplaySize(TILE + 4, 18));
          else tops.add(this.add.image(x, y, 'oneway').setOrigin(0));
          const z = this.add.zone(x + TILE / 2, y + 8, TILE, 16);
          this.oneways.add(z);
          const body = z.body as Phaser.Physics.Arcade.StaticBody;
          body.checkCollision.down = body.checkCollision.left = body.checkCollision.right = false;
        } else if (t === T.Spike) {
          // perigos ficam fora do filtro de cor: precisam ser legíveis desde o início
          if (art) {
            const img = this.add.image(x + TILE / 2, y + TILE + 4, this.tex('tiles'), String(F.w1Tiles.thorns)).setOrigin(0.5, 1);
            img.setScale((TILE + 8) / img.width).setDepth(2);
          } else this.add.image(x, y, 'spike').setOrigin(0).setDepth(2);
          this.hazards.add(this.add.zone(x + TILE / 2, y + 44, TILE - 8, 36));
        }

        // interior do chão: textura contínua em faixas. Nas linhas de topo ela começa
        // um pouco abaixo, escondida atrás da peça de topo (sem buraco entre as duas).
        const fill = solid && (art || !top);
        if (fillStart >= 0 && (!fill || top !== fillTop)) {
          const fx = fillStart * TILE, w = (c - fillStart) * TILE;
          const fy = fillTop ? y + 24 : y;
          if (art && has(this, this.tex('ground'))) {
            fills.add(this.add.tileSprite(fx, fy, w, y + TILE - fy, this.tex('ground')).setOrigin(0).setTileScale(0.5).setTilePosition(fx * 2, fy * 2));
          } else for (let i = fillStart; i < c; i++) fills.add(this.add.image(i * TILE, y, 'tile_fill').setOrigin(0));
          fillStart = -1;
        }
        if (fill && fillStart < 0) {
          fillStart = c;
          fillTop = top;
        }

        // colisão sólida em faixas horizontais contínuas (evita "tropeçar" nas emendas)
        if (solid && runStart < 0) runStart = c;
        if (!solid && runStart >= 0) {
          const w = (c - runStart) * TILE;
          this.solids.add(this.add.zone(runStart * TILE + w / 2, y + TILE / 2, w, TILE));
          runStart = -1;
        }
      }
    }
  }

  private decor!: Phaser.GameObjects.Container;

  /** Espalha objetos decorativos sobre o chão (sorteio fixo por fase, sempre igual). */
  private buildDecor() {
    const decor = worldInfo(this.level.world).decor;
    if (!decor || !has(this, this.tex('props'))) return;
    const rng = new Phaser.Math.RandomDataGenerator([this.level.id]);
    const busy = new Set(this.level.entities.map((e) => e.col));
    const place = (c: number, r: number, frame: number, scale: number) =>
      this.decor.add(this.add.image(c * TILE + TILE / 2, r * TILE + 16, this.tex('props'), String(frame)).setOrigin(0.5, 1).setScale(0.5 * scale));

    // marcos: casinha no início e arco antes da saída
    place(9, this.surfaceRow(9), decor.start, 0.75);
    const exit = this.level.entities.find((e) => e.type === 'exit');
    if (exit) place(exit.col - 4, this.surfaceRow(exit.col - 4), decor.end, 0.7);
    const small = decor.small;

    for (let c = 1; c < this.level.cols - 1; c++) {
      if (c > 5 && c < 14) continue; // em volta da casinha
      if (busy.has(c) || rng.frac() > 0.2) continue;
      const r = this.surfaceRow(c);
      if (r < 0) continue;
      place(c, r, rng.pick(small), rng.realInRange(0.5, 0.7));
    }
  }

  /** Linha do topo do chão numa coluna, ou -1 se não houver chão. */
  private surfaceRow(c: number) {
    for (let r = 1; r < this.level.rows; r++) if (this.tileAt(c, r) === T.Solid && this.tileAt(c, r - 1) === T.Empty) return r;
    return -1;
  }

  /** Cria entidades e devolve o total de pontos de cor da fase. */
  private buildEntities(): number {
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    this.crates = this.physics.add.staticGroup();
    this.props = this.physics.add.staticGroup();
    this.shots = this.physics.add.group({ allowGravity: false });
    this.cages = this.physics.add.staticGroup();
    this.cracked = this.physics.add.staticGroup();
    this.pshots = this.physics.add.group({ allowGravity: false });
    this.bumps = this.physics.add.staticGroup();
    this.gatesGroup = this.physics.add.staticGroup();
    this.pushboxes = this.physics.add.group();

    let total = 0;
    let shardIndex = 0;
    let coinIndex = 0;
    for (const e of this.level.entities) {
      const cx = e.col * TILE + TILE / 2;
      const bottom = (e.row + 1) * TILE;
      const cy = e.row * TILE + TILE / 2;

      if (ENEMY_KINDS.has(e.type)) {
        const enemy = new Enemy(this, this, e.type as EnemyKind, cx, e.type === 'moth' ? cy + 22 : e.type === 'drone' ? cy + 23 : e.type === 'puffer' || e.type === 'comet' ? cy : bottom);
        enemy.hit.setData('enemy', enemy);
        this.enemies.push(enemy);
        total += COLOR_POINTS.enemy;
        continue;
      }

      switch (e.type) {
        case 'player':
          this.player = new Player(this, cx, bottom - 46);
          this.respawnPoint.set(cx, bottom - 46);
          break;
        case 'coin': {
          const s = this.pickup(cx, cy, 'coin', F.collectibles.coin[0], 0.36);
          if (has(this, 'collectibles')) s.play({ key: 'coin-spin', startFrame: coinIndex % 4 });
          else s.setTint(RAINBOW[coinIndex % RAINBOW.length]);
          coinIndex++;
          this.tweens.add({ targets: s, y: cy - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: (coinIndex * 90) % 700 });
          total += COLOR_POINTS.coin;
          break;
        }
        case 'shard': {
          const s = this.pickup(cx, cy, 'shard', F.collectibles.shard, 0.42);
          s.setData('index', shardIndex++);
          this.tweens.add({ targets: s, y: cy - 10, angle: 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
          total += COLOR_POINTS.shard;
          break;
        }
        case 'heart': {
          const s = this.pickup(cx, cy, 'heart', F.collectibles.heart, 0.34);
          this.tweens.add({ targets: s, scale: s.scale * 1.12, duration: 500, yoyo: true, repeat: -1 });
          break;
        }
        case 'crate': {
          const art = has(this, 'level_objects');
          const s = this.crates.create(cx, cy, art ? 'level_objects' : 'crate', art ? String(F.objects.crate) : undefined) as Sprite;
          s.setDisplaySize(TILE, TILE).setDepth(4).refreshBody();
          total += COLOR_POINTS.crate;
          break;
        }
        case 'spring':
          this.prop('spring', cx, bottom, 52, 26, F.objects.springUp, 0.55, 'spring');
          break;
        case 'checkpoint':
          this.prop('checkpoint', cx, bottom, 40, 128, F.objects.checkpointOff, 0.62, 'checkpoint_off');
          total += COLOR_POINTS.checkpoint;
          break;
        case 'exit':
          this.addExit(cx, bottom);
          break;
        case 'mover':
          this.addMover(e.col, e.row, e.data ?? {});
          break;
        case 'guardian': {
          const art = has(this, this.tex('guardian'));
          const view = (art ? this.add.image(cx, bottom + 4, this.tex('guardian'), '7').setScale(0.6) : this.add.image(cx, bottom, 'crate').setScale(1.5))
            .setOrigin(0.5, 1)
            .setDepth(5);
          const zone = this.add.zone(cx, bottom - 80, 90, 160);
          this.cages.add(zone);
          this.guardian = { zone, view, hits: 0, freed: false };
          total += COLOR_POINTS.checkpoint * 2;
          break;
        }
        case 'boss': {
          const Kind = BOSSES[this.level.world as keyof typeof BOSSES] ?? StoneJudge;
          this.bossGround = bottom;
          this.boss = new Kind(this, this.bossHost(bottom), cx, this.solids);
          this.bossDamage = new BossDamage(this, this.boss);
          break;
        }
        case 'bump': {
          const b = this.bumps.create(cx, cy, 'blk_bump') as Sprite;
          if ((e.data?.reward ?? 0) === 3) b.setAlpha(0); // bloco invisível: só aparece depois da cabeçada
          b.setDepth(4).setData('reward', e.data?.reward ?? 0).setData('baseY', cy).refreshBody();
          break;
        }
        case 'pushbox': {
          const box = this.pushboxes.create(cx, cy, 'blk_pushbox') as Sprite;
          box.setDepth(5).setDragX(700).setMaxVelocity(170, 900).setData('origin', [cx, cy]);
          (box.body as Phaser.Physics.Arcade.Body).setSize(60, 60).setMass(1);
          break;
        }
        case 'plate': {
          const view = this.add.image(cx, bottom, 'blk_plate').setOrigin(0.5, 1).setDepth(3);
          this.plates.push({ x: cx, y: bottom, id: e.data?.id ?? 1, view, on: false });
          break;
        }
        case 'gate': {
          const h = e.data?.h ?? 4;
          const ts = this.add.tileSprite(cx, e.row * TILE + (h * TILE) / 2, TILE, h * TILE, 'blk_gate').setDepth(5);
          this.gatesGroup.add(ts);
          (ts.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
          this.gates.push({ ts, id: e.data?.id ?? 1, open: false });
          break;
        }
        case 'portal': {
          const view = this.add.image(cx, bottom, 'blk_portal').setOrigin(0.5, 1).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
          const mode = e.data?.hidden ?? 0; // 0 visível; 1 bloco invisível; 2 caixas; 3 piso rachado
          const p = { x: cx, y: bottom, sub: e.data?.sub ?? 0, view, mode, on: mode === 0 };
          if (this.textures.exists('blk_portal0')) view.setScale(1.1).setBlendMode(Phaser.BlendModes.NORMAL); // a arte já traz o brilho
          if (mode) view.setVisible(false);
          else this.tweens.add({ targets: view, alpha: 0.55, scaleX: 1.12, duration: 900, yoyo: true, repeat: -1 });
          this.portals.push(p);
          break;
        }
        case 'door': {
          this.add.image(cx, bottom, 'blk_door').setOrigin(0.5, 1).setDepth(3);
          this.doors.push({ x: cx, y: bottom, id: e.data?.id ?? 1 });
          break;
        }
        case 'chest': {
          const art = has(this, 'collectibles');
          const c = this.pickups.create(cx, bottom - 28, art ? 'collectibles' : 'crate', art ? String(F.collectibles.chest) : undefined) as Sprite;
          c.setData('kind', 'chest').setDepth(6);
          if (art) c.setScale(0.5); else c.setTint(0xffd86b);
          break;
        }
        case 'fakewall': {
          const w = e.data?.w ?? 3, h = e.data?.h ?? 3;
          const ts = this.add.tileSprite(e.col * TILE, bottom, w * TILE, h * TILE, 'blk_wall').setOrigin(0, 1).setDepth(5);
          this.fakewalls.push(ts);
          break;
        }
        case 'vent':
          this.addVent(cx, bottom, e.data ?? {});
          break;
        case 'cracked': {
          const blockArt = this.textures.exists('blk_cracked');
          const art = !blockArt && has(this, this.tex('tiles'));
          const s = this.cracked.create(cx, cy, blockArt ? 'blk_cracked' : art ? this.tex('tiles') : 'crate', art ? String(F.w1Tiles.cracked) : undefined) as Sprite;
          s.setDisplaySize(TILE + 2, TILE + 2).setDepth(4).refreshBody();
          break;
        }
        case 'searchlight':
          this.addSearchlight(cx, e.row, e.data ?? {});
          break;
        case 'wind':
          this.addWind(e.col, e.row, e.data ?? {});
          break;
      }
    }

    // Faísca, a companheira
    const sparkTex = has(this, 'spark_anim') ? 'spark_anim' : 'spark';
    this.spark = this.add.sprite(this.player.hit.x - 50, this.player.hit.y - 80, sparkTex, 0).setScale(1 / texRes(this, sparkTex)).setDepth(11);
    if (sparkTex === 'spark_anim') this.spark.play('spark-fly');
    return total;
  }

  private addExit(cx: number, bottom: number) {
    const view = this.prop('exit', cx, bottom, 60, 120, F.objects.exit, 0.85, 'exit');
    this.tweens.add({ targets: view, alpha: 0.85, duration: 800, yoyo: true, repeat: -1 });
    return view;
  }

  /** Plataforma móvel: corpo imóvel que se desloca por velocidade (assim carrega Íris junto). */
  private addMover(col: number, row: number, d: Record<string, number>) {
    const w = (d.width ?? 2) * TILE;
    const x0 = col * TILE + w / 2, y0 = row * TILE + 10;
    const zone = this.add.zone(x0, y0, w, 20);
    this.physics.add.existing(zone);
    const body = zone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true);
    body.checkCollision.down = body.checkCollision.left = body.checkCollision.right = false;

    let view: Phaser.GameObjects.Image;
    if (has(this, this.tex('tiles'))) {
      // alinha pela linha da superfície da peça (pivô medido no pipeline), não pela borda da imagem:
      // a folhagem acima da superfície faria Íris parecer flutuar
      view = this.add.image(x0, y0, this.tex('tiles'), String(F.w1Tiles.floatMid));
      const f = view.frame;
      view.setOrigin(0.5, f.customPivot ? f.pivotY : 0).setScale((w + 16) / view.width);
    } else view = this.add.image(x0, y0 - 10, 'oneway').setOrigin(0.5, 0).setDisplaySize(w, 24);
    this.world.add(view);
    const period = d.period ?? 4;
    this.movers.push({ zone, view, x0, y0, dx: (d.dx ?? 0) * TILE, dy: (d.dy ?? 0) * TILE, period, t: (d.phase ?? 0) * period });
  }

  /**
   * Roda a cada passo da física (evento 'worldstep'), não a cada quadro de tela: assim a
   * velocidade calculada é aplicada exatamente uma vez e a plataforma não oscila.
   */
  private stepMovers(delta: number) {
    for (const m of this.movers) {
      m.t += delta;
      // vai e volta com aceleração suave (cosseno); velocidade = chegar ao ponto do próximo passo
      const k = 0.5 - 0.5 * Math.cos(((m.t + delta) / m.period) * Math.PI * 2);
      const body = m.zone.body as Phaser.Physics.Arcade.Body;
      body.setVelocity((m.x0 + m.dx * k - body.center.x) / delta, (m.y0 + m.dy * k - body.center.y) / delta);
    }
  }

  private syncMoverViews() {
    // topo físico = zone.y - 10; a superfície desenhada fica 4 px abaixo para os pés "afundarem" de leve
    for (const m of this.movers) m.view.setPosition(m.zone.x, m.view.originY > 0 ? m.zone.y - 6 : m.zone.y - 10);
  }

  // ---------- gêiseres e vento ----------

  private addVent(cx: number, bottom: number, d: Record<string, number>) {
    // base: fonte termal da decoração do mundo, se houver
    if (has(this, this.tex('props')) && this.level.world === 2) {
      this.world.add(this.add.image(cx, bottom + 10, this.tex('props'), '3').setOrigin(0.5, 1).setScale(0.22));
    } else this.world.add(this.add.ellipse(cx, bottom - 4, 56, 16, 0x8a6a5a));
    const steam = this.add.particles(cx, bottom - 10, 'dot', {
      speedY: { min: -760, max: -520 },
      speedX: { min: -40, max: 40 },
      lifespan: 520,
      scale: { start: 1.3, end: 0.2 },
      alpha: { start: 0.75, end: 0 },
      tint: 0xffffff,
      frequency: 20,
      emitting: false,
    });
    steam.setDepth(6);
    const period = d.period ?? 2.6;
    this.vents.push({ area: new Phaser.Geom.Rectangle(cx - 26, bottom - 4 * TILE, 52, 4 * TILE), steam, period, t: (d.phase ?? 0) * period, launched: false });
  }

  /** Fases do ciclo: 0–55% descanso, 55–75% aviso (fumacinha), 75–100% jato. */
  private updateVents(dt: number) {
    const pb = this.player.body;
    const pr = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);
    for (const v of this.vents) {
      v.t = (v.t + dt) % v.period;
      const k = v.t / v.period;
      const active = k >= 0.75;
      v.steam.emitting = k >= 0.55;
      v.steam.frequency = active ? 15 : 90;
      if (!active) v.launched = false;
      if (active && !v.launched && Phaser.Geom.Intersects.RectangleToRectangle(v.area, pr) && pb.velocity.y > -PHYS.ventVel * 0.6) {
        v.launched = true;
        this.player.bounce(PHYS.ventVel);
        this.sfx('spring');
        this.dust(this.player.hit.x, pb.bottom);
      }
    }
  }

  private addWind(col: number, row: number, d: Record<string, number>) {
    const area = new Phaser.Geom.Rectangle(col * TILE, row * TILE, (d.w ?? 4) * TILE, (d.h ?? 4) * TILE);
    const dir = d.dir ?? 1;
    this.winds.push({ area, push: dir * (d.strength ?? 230) });
    // riscos de areia atravessando a área
    const em = this.add.particles(0, 0, 'dot', {
      emitZone: { type: 'random', source: area, quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
      speedX: { min: dir * 380, max: dir * 560 },
      speedY: { min: -20, max: 20 },
      lifespan: 700,
      scaleX: { start: 1.6, end: 0.4 },
      scaleY: 0.25,
      alpha: { start: 0.7, end: 0 },
      tint: [0xf2d2a2, 0xe8b98a],
      frequency: 30,
    });
    em.setDepth(3);
  }

  // ---------- holofotes de vigia (Mundo 3) ----------

  private searchlights: { x: number; y: number; reach: number; swing: number; period: number; t: number; g: Phaser.GameObjects.Graphics }[] = [];

  /** Holofote preso no alto que balança um cone de luz; a luz fria machuca. */
  private addSearchlight(cx: number, row: number, d: Record<string, number>) {
    const y = row * TILE + 20;
    const lamp = this.add.image(cx, y, has(this, 'w3_boss_projectiles') ? 'w3_boss_projectiles' : 'dot', has(this, 'w3_boss_projectiles') ? '2' : undefined);
    lamp.setScale(0.16).setAngle(180).setDepth(4);
    const g = this.add.graphics().setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
    const period = d.period ?? 3.2;
    this.searchlights.push({ x: cx, y: y + 14, reach: (d.reach ?? 5) * TILE, swing: (d.swing ?? 3) * TILE, period, t: (d.phase ?? 0) * period, g });
  }

  private updateSearchlights(dt: number) {
    const pb = this.player.body;
    for (const s of this.searchlights) {
      s.t += dt;
      const fx = s.x + Math.sin((s.t / s.period) * Math.PI * 2) * s.swing; // ponto iluminado no chão
      const fy = s.y + s.reach;
      s.g.clear();
      s.g.fillStyle(0xe8f0ff, 0.22).fillTriangle(s.x - 8, s.y, s.x + 8, s.y, fx + 48, fy).fillTriangle(s.x - 8, s.y, fx - 48, fy, fx + 48, fy);
      s.g.fillStyle(0xffffff, 0.35).fillEllipse(fx, fy, 104, 18);
      // a área perigosa é a parte de baixo do cone, perto do chão
      if (Math.abs(pb.center.x - fx) < 40 && pb.bottom > fy - 70 && pb.top < fy) {
        if (this.player.hurt(fx)) this.feedbackHurt();
      }
    }
  }

  private updateWind() {
    const p = this.player.hit;
    let w = this.bossWind;
    for (const z of this.winds) if (z.area.contains(p.x, p.y)) w += z.push;
    this.player.wind = w;
  }

  // ---------- guardiã ----------

  private hitCage() {
    const g = this.guardian!;
    g.hits++;
    this.sfx(g.hits >= 3 ? 'break_block' : 'hit_enemy');
    this.sparkle(g.zone.x, g.zone.y, 0xffffff);
    this.shakeCamera(100, 0.005);
    this.tweens.add({ targets: g.view, x: g.view.x + 6, duration: 40, yoyo: true, repeat: 2 });
    if (g.hits >= 3) this.freeGuardian();
  }

  private freeGuardian() {
    const g = this.guardian!;
    g.freed = true;
    g.zone.destroy();
    this.burst(g.zone.x, g.zone.y, 50);
    this.fx('fx-burst', g.zone.x, g.zone.y, 1);
    this.color.add(COLOR_POINTS.checkpoint * 2);
    if (g.view.texture.key === this.tex('guardian')) g.view.setFrame('0').setScale(0.5);
    this.tweens.add({ targets: g.view, scale: g.view.scale * 1.05, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const story = STORY[this.level.world];
    this.time.delayedCall(700, () =>
      this.talk(story.guardianFreed, () => {
        this.save[story.ability] = true;
        this.persistProgress();
        const p = this.player;
        ({ doubleJump: () => (p.canDoubleJump = true), dash: () => (p.canDash = true), wallJump: () => (p.canWallJump = true), glide: () => (p.canGlide = true), shot: () => (p.canShoot = true), pound: () => (p.canPound = true),
          extraHeart: () => {
            p.hp = p.maxHp = 4;
            this.pushHud();
          },
        })[story.ability]();
        this.events.emit('toast', story.abilityToast);
        // falas extras (ex.: reencontro com a Luna) só quando a arte opcional existe
        const extra = story.extra && has(this, story.extra.tex) ? story.extra : undefined;
        const after = extra ? [...extra.lines, ...story.guardianAfter] : story.guardianAfter;
        this.time.delayedCall(2600, () => {
          if (!extra) return this.talk(after);
          // a personagem extra (Luna) entra correndo pela direita até ficar ao lado do guardião
          const ground = g.view.y;
          const friend = this.add.image(this.cameras.main.worldView.right + 60, ground, extra.tex, '0').setOrigin(0.5, 1).setScale(0.5).setDepth(5);
          this.tweens.add({
            targets: friend,
            x: g.view.x + 95,
            duration: 1100,
            ease: 'Sine.Out',
            onUpdate: () => (friend.y = ground - Math.abs(Math.sin(this.time.now / 90)) * 6), // passinhos
            onComplete: () => {
              friend.y = ground;
              g.view.setFlipX(true); // o guardião se vira para quem chegou
              this.burst(friend.x - 45, ground - 150, 18, [0xff8fc8, 0xff9a3c, 0xffffff]);
              this.talk(after);
            },
          });
        });
      }),
    );
  }

  // ---------- chefão ----------

  private bossHost(groundY: number): BossHost {
    return {
      groundY,
      arenaW: this.level.cols * TILE,
      hurtPlayer: (x) => {
        if (this.player.hurt(x)) this.feedbackHurt();
      },
      playerX: () => this.player.hit.x,
      playerBody: () => this.player.body,
      burst: (x, y, n) => this.burst(x, y, n),
      setWind: (v) => (this.bossWind = v),
      onBossHp: (hp, max) => {
        this.bossLost = max - hp;
        this.events.emit('boss-hp', { name: this.boss?.name ?? '', hp, max });
      },
      onBossDefeated: () => this.bossDefeated(),
      cinematic: (lines, done) => this.talk(lines, done),
      stormFlash: (n) => this.stormFlash(n),
      dim: (a, ms) => this.dimScreen(a, ms),
    };
  }

  private touchBoss() {
    const boss = this.boss!;
    const pb = this.player.body;
    if (this.player.dead || this.player.frozen) return;
    const stomp = pb.velocity.y > 0 && pb.bottom - boss.body.top < 40;
    if (stomp && boss.vulnerable) {
      boss.takeHit();
      this.sfx('boss_hit');
      this.player.bounce(PHYS.stompBounceHeld);
      this.hitStop(80);
    } else if (boss.dangerous && this.player.hurt(boss.hit.x)) {
      this.feedbackHurt();
    }
  }

  // ---------- blocos interativos, segredos e recompensas ----------

  /** Cabeçada de baixo: o bloco sobe, vira cinza e solta o prêmio (a surpresa cura quem está machucado). */
  private bumpBlock(b: Sprite) {
    b.setData('used', true).setTexture('blk_bump_used');
    this.sfx('break_block');
    const y0 = b.getData('baseY') as number;
    this.tweens.add({ targets: b, y: y0 - 12, duration: 90, yoyo: true });
    this.burst(b.x, y0 - 20, 8, [0xffd86b, 0xffffff]);
    const reward = b.getData('reward') as number;
    b.setAlpha(1);
    if (reward === 3) {
      if (this.textures.exists('blk_ghost')) {
        b.setTexture('blk_ghost');
        this.time.delayedCall(900, () => b.active && b.setTexture('blk_bump_used'));
      }
      for (const p of this.portals) if (p.mode === 1 && Math.abs(p.x - b.x) < TILE * 8) this.revealPortal(p);
      return;
    }
    const heart = reward === 2 || (reward === 0 && this.player.hp < this.player.maxHp);
    if (heart) this.popPickup('heart', b.x, y0 - TILE);
    else [-34, 0, 34].forEach((dx, i) => this.time.delayedCall(i * 90, () => this.popPickup('coin', b.x + dx, y0 - TILE - (i % 2) * 18)));
  }

  /** Um portal escondido aparece (bloco invisível batido, caixas ou piso rachado quebrados). */
  private revealPortal(p: { x: number; y: number; view: Phaser.GameObjects.Image; on: boolean }) {
    if (p.on) return;
    p.on = true;
    p.view.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: p.view, alpha: 0.9, duration: 500, onComplete: () => this.tweens.add({ targets: p.view, alpha: 0.55, scaleX: 1.12, duration: 900, yoyo: true, repeat: -1 }) });
    this.burst(p.x, p.y - 48, 18, [0xd9c8ff, 0xffffff, 0xffd86b]);
    this.sfx('spring', 0);
    this.events.emit('toast', 'Uma passagem secreta se abriu!');
  }

  /** Faz um coletável saltar para fora de (x, y) e ficar parado logo acima. */
  private popPickup(kind: 'heart' | 'coin', x: number, y: number) {
    const s = kind === 'heart' ? this.pickup(x, y + 30, 'heart', F.collectibles.heart, 0.34) : this.pickup(x, y + 30, 'coin', F.collectibles.coin[0], 0.36);
    if (kind === 'coin' && has(this, 'collectibles')) s.play({ key: 'coin-spin' });
    s.setAlpha(0);
    this.tweens.add({ targets: s, y, alpha: 1, duration: 260, ease: 'Back.Out' });
    return s;
  }

  /** Deixa cair um coração de cima até (x, y). */
  private dropHeart(x: number, y: number) {
    const h = this.pickup(x, y - 420, 'heart', F.collectibles.heart, 0.34);
    this.tweens.add({ targets: h, y, duration: 900, ease: 'Bounce.Out' });
    this.burst(x, y - 60, 14, [0xff3d5a, 0xffffff]);
  }

  /** Placas, portões, caixas caídas, portais e paredes falsas. */
  private updateInteractive(dt: number) {
    const pb = this.player.body;
    const pr = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);
    const boxes = (this.pushboxes.getChildren() as Sprite[]).filter((b) => b.active);
    const worldH = this.level.rows * TILE;
    for (const b of boxes) {
      if (b.y > worldH + 150) {
        const o = b.getData('origin') as [number, number];
        b.setPosition(o[0], o[1]).setVelocity(0, 0);
      }
    }
    const pressed = new Set<number>();
    for (const pl of this.plates) {
      const area = new Phaser.Geom.Rectangle(pl.x - 28, pl.y - 18, 56, 18);
      const on = Phaser.Geom.Intersects.RectangleToRectangle(area, pr) || boxes.some((b) => Phaser.Geom.Intersects.RectangleToRectangle(area, b.getBounds()));
      if (on !== pl.on) {
        pl.on = on;
        if (this.textures.exists('blk_plate_down')) pl.view.setTexture(on ? 'blk_plate_down' : 'blk_plate');
        else pl.view.setTint(on ? 0xffd86b : 0xffffff).setScale(1, on ? 0.6 : 1);
        if (on) this.sfx('checkpoint', 0);
      }
      if (on) pressed.add(pl.id);
    }
    for (const g of this.gates) {
      const want = pressed.has(g.id);
      const body = g.ts.body as Phaser.Physics.Arcade.StaticBody;
      if (want && !g.open) {
        g.open = true;
        body.enable = false;
        this.tweens.add({ targets: g.ts, alpha: 0.18, duration: 260 });
        this.sfx('spring', 0);
        this.burst(g.ts.x, g.ts.y, 12, [0x9d7bff, 0xffffff]);
      } else if (!want && g.open) {
        const r = g.ts.getBounds();
        const blocked = Phaser.Geom.Intersects.RectangleToRectangle(r, pr) || boxes.some((b) => Phaser.Geom.Intersects.RectangleToRectangle(r, b.getBounds()));
        if (blocked) continue; // não fecha em cima de ninguém
        g.open = false;
        body.enable = true;
        this.tweens.add({ targets: g.ts, alpha: 1, duration: 200 });
      }
    }
    // parede falsa: some quando Íris chega perto e deixa uma cintilação sutil como pista
    for (const w of this.fakewalls) {
      const near = this.player.hit.x > w.x - TILE * 2 && this.player.hit.x < w.x + w.width + TILE * 2 && Math.abs(this.player.hit.y - (w.y - w.height / 2)) < TILE * 3;
      w.alpha += ((near ? 0.3 : 1) - w.alpha) * Math.min(1, dt * 5);
      if (Math.random() < dt * 0.9) this.sparkle(w.x + Math.random() * w.width, w.y - Math.random() * w.height, 0xd9c8ff);
    }
    // salas conectadas: portas em pares levam de um lado ao outro
    if (this.doorLock && this.doors.every((d) => Math.abs(d.x - this.player.hit.x) > TILE * 2.5 || Math.abs(d.y - this.player.body.bottom) > TILE * 2)) this.doorLock = false;
    if (!this.doorLock && !this.finished && !this.player.dead && !this.player.frozen) {
      const d = this.doors.find((q) => Math.abs(q.x - this.player.hit.x) < 26 && Math.abs(q.y - this.player.body.bottom) < 40);
      const to = d && this.doors.find((q) => q !== d && q.id === d.id);
      if (d && to) this.useDoor(to);
    }
    // brilho de risco: borda vermelha pulsando devagar quando resta só 1 coração
    const lowHp = this.player.hp <= 1 && this.player.maxHp > 1 && !this.player.dead && !this.finished;
    if (lowHp && !this.risk) this.risk = this.add.image(GAME_W / 2, GAME_H / 2, 'vig_risk').setScrollFactor(0).setDepth(60).setAlpha(0).setDisplaySize(GAME_W, GAME_H);
    if (this.risk) {
      const calm = getSettings().reduceMotion || !canFlashScreen();
      const want = lowHp ? (calm ? 0.22 : 0.2 + 0.12 * Math.sin(this.time.now / 450)) : 0;
      this.risk.alpha += (want - this.risk.alpha) * Math.min(1, dt * 4);
    }
    // portais escondidos: caixas ao lado ou piso rachado por cima precisam ter sido quebrados
    for (const p of this.portals) {
      if (p.on) continue;
      // pista sutil: cintilações no ar quando Íris passa perto (mais raras com "reduzir movimento")
      if (Math.abs(p.x - this.player.hit.x) < TILE * 6 && Math.random() < dt * (getSettings().reduceMotion ? 0.25 : 0.8)) this.sparkle(p.x + (Math.random() - 0.5) * TILE, p.y - Math.random() * TILE * 1.4, 0xd9c8ff);
      if (p.mode === 2) {
        const near = (this.crates.getChildren() as Sprite[]).filter((c) => Math.abs(c.x - p.x) < TILE * 1.2 && Math.abs(c.y - (p.y - TILE / 2)) < TILE * 0.6).length;
        if (near < 2) this.revealPortal(p);
      } else if (p.mode === 3) {
        const caps = (this.cracked.getChildren() as Sprite[]).filter((c) => Math.abs(c.x - p.x) < TILE * 2.2 && c.y < p.y && p.y - c.y < TILE * 3.5).length;
        if (caps === 0) this.revealPortal(p);
      }
    }
    // quadros do redemoinho dos portais (arte)
    if (this.textures.exists('blk_portal0')) {
      const f = Math.floor(this.time.now / 130) % PORTAL_FRAMES;
      for (const p of this.portals) if (p.on) p.view.setTexture(`blk_portal${f}`);
    }
    // portais para os sub-níveis
    if (this.portalLock && this.portals.every((p) => Math.abs(p.x - this.player.hit.x) > TILE * 3)) this.portalLock = false;
    if (!this.portalLock && !this.finished && !this.player.dead && !this.isSub) {
      const p = this.portals.find((q) => q.on && Math.abs(q.x - this.player.hit.x) < 34 && Math.abs(q.y - this.player.body.bottom) < 40);
      if (p) this.enterSub(p);
    }
    // um coração caído do céu, uma vez por luta, quando Íris está por um fio
    if (this.boss && this.bossStarted && !this.mercyGiven && this.player.hp <= 1 && !this.player.dead && !this.finished) {
      this.mercyGiven = true;
      const px = this.player.hit.x, lo = 200, hi = this.level.cols * TILE - 200;
      let dir = this.boss.hit.x > px ? -1 : 1; // de preferência longe do chefão
      let x = Phaser.Math.Clamp(px + dir * 220, lo, hi);
      if (Math.abs(x - px) < 140) x = Phaser.Math.Clamp(px - dir * 220, lo, hi); // encostado na parede: usa o outro lado
      this.dropHeart(x, this.bossGround - 40);
      this.events.emit('toast', 'Um coração caiu do céu!');
    }
  }

  /** Pesos de pedra pendurados no teto da arena: acerte um (golpe ou tiro) para soltá-lo sobre o chefão. */
  private buildWeights() {
    const w = this.level.cols * TILE;
    const bossRight = this.boss!.hit.x > w / 2;
    const xs = bossRight ? [w * 0.5, w * 0.68] : [w * 0.32, w * 0.5];
    for (const x of xs) this.weights.push(this.makeWeight(x));
  }

  private makeWeight(x: number) {
    // pendurado baixo o bastante para um pulo (ou a echarpe) alcançar, mesmo sem o tiro
    const chain = this.add.rectangle(x, 0, 6, WEIGHT_Y - 96, 0x4a4256).setOrigin(0.5, 0).setDepth(6);
    const s = this.add.sprite(x, WEIGHT_Y, 'blk_weight').setOrigin(0.5, 1).setDepth(6);
    const shadow = this.add.ellipse(x, this.bossGround - 4, 80, 14, 0x000000, 0.22).setDepth(2);
    return { x, s, chain, shadow, vy: 0, state: 'hang' as const, back: 0 };
  }

  private updateWeights(dt: number) {
    if (!this.weights.length || !this.bossStarted) return;
    const boss = this.boss;
    for (const wt of this.weights) {
      if (wt.state === 'gone') {
        wt.back -= dt;
        if (wt.back <= 0 && !this.finished) {
          wt.s.setPosition(wt.x, -40).setVisible(true).setAlpha(1);
          this.tweens.add({ targets: wt.s, y: WEIGHT_Y, duration: 500, ease: 'Bounce.Out' });
          wt.chain.setVisible(true);
          wt.shadow.setVisible(true);
          wt.state = 'hang';
          wt.vy = 0;
        }
        continue;
      }
      const rect = wt.s.getBounds();
      if (wt.state === 'hang') {
        const pbb = this.player.body;
        const bonk = !this.player.dead && Phaser.Geom.Intersects.RectangleToRectangle(new Phaser.Geom.Rectangle(pbb.x, pbb.y, pbb.width, pbb.height), rect);
        let hitBy = bonk || (this.player.attackTime > 0 && Phaser.Geom.Intersects.RectangleToRectangle(this.player.attackRect(), rect));
        for (const sh of this.pshots.getChildren() as Sprite[]) {
          if (Phaser.Geom.Intersects.RectangleToRectangle(sh.getBounds(), rect)) {
            hitBy = true;
            this.popShot(sh);
          }
        }
        if (hitBy) {
          wt.state = 'fall';
          wt.chain.setVisible(false);
          this.sfx('break_block');
          this.burst(wt.x, 60, 10, [0xffd86b, 0xffffff]);
        }
        continue;
      }
      // caindo
      wt.vy = Math.min(1500, wt.vy + 2400 * dt);
      wt.s.y += wt.vy * dt;
      const r = wt.s.getBounds();
      const down = (hit: boolean) => {
        wt.state = 'gone';
        wt.back = 7;
        wt.s.setVisible(false);
        wt.shadow.setVisible(false);
        this.burst(wt.s.x, Math.min(wt.s.y, this.bossGround - 20), hit ? 36 : 16, hit ? RAINBOW : [0x9a9da6, 0xffffff]);
        this.shakeCamera(160, 0.01);
      };
      if (boss && Phaser.Geom.Intersects.RectangleToRectangle(r, new Phaser.Geom.Rectangle(boss.body.x, boss.body.y, boss.body.width, boss.body.height))) {
        if (boss.takeHit()) {
          this.sfx('boss_hit');
          this.hitStop(80);
          this.events.emit('toast', 'Em cheio! O peso acertou o chefão!');
          down(true);
        } else down(false);
        continue;
      }
      const pb = this.player.body;
      if (!this.player.dead && Phaser.Geom.Intersects.RectangleToRectangle(r, new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height)) && this.player.hurt(wt.x)) {
        this.feedbackHurt();
        down(false);
        continue;
      }
      if (wt.s.y >= this.bossGround) down(false);
    }
  }

  /**
   * Fissuras: o chão da arena racha perto de Íris (aviso de ~1,2 s) e solta espinhos de cristal.
   * Fica mais frequente a cada golpe que o chefão leva. Só a posição conta: sem flashes.
   */
  private updateFissures(dt: number) {
    if (!this.boss || !this.bossStarted || this.finished || this.player.dead || this.boss.state === 'transform') return;
    this.fissureT -= dt;
    if (this.fissureT > 0) return;
    const lost = this.bossLost;
    this.fissureT = Math.max(5, 11 - lost * 2) + Math.random() * 2;
    const w = this.level.cols * TILE;
    const x = Phaser.Math.Clamp(this.player.hit.x + Phaser.Math.Between(-220, 220), 160, w - 160);
    const y = this.bossGround;
    const crack = this.add.graphics().setDepth(3);
    crack.lineStyle(6, 0x1a1024, 0.95).beginPath().moveTo(x - 50, y - 2);
    for (let i = 1; i <= 6; i++) crack.lineTo(x - 50 + i * 17, y - 2 + (i % 2 ? -5 : 4));
    crack.strokePath();
    // aviso: faixa avermelhada que pulsa devagar (sem pisca-pisca) sobre a área que vai estourar
    const warn = this.add.rectangle(x, y - 3, 120, 10, 0xff4d5e, 0.55).setDepth(3);
    this.tweens.add({ targets: warn, alpha: 0.2, scaleY: 2, duration: 600, yoyo: true, repeat: 1 });
    this.time.delayedCall(1250, () => warn.destroy());
    this.sfx('break_block');
    const dust = this.add.particles(x, y - 6, 'dot', { speed: { min: 20, max: 60 }, angle: { min: 240, max: 300 }, lifespan: 500, scale: { start: 0.5, end: 0 }, tint: [0xb9a8ff, 0xffffff], frequency: 60 });
    dust.setDepth(4);
    this.time.delayedCall(1200, () => {
      dust.destroy();
      crack.destroy();
      if (this.finished) return;
      this.sfx('spring', 0);
      this.shakeCamera(120, 0.006);
      const spikes: Phaser.GameObjects.Triangle[] = [];
      for (let i = -2; i <= 2; i++) {
        const t = this.add.triangle(x + i * 20, y, 0, 70, 10, 0, 20, 70, 0xb9a8ff, 1).setOrigin(0.5, 1).setDepth(8).setScale(1, 0.1);
        this.tweens.add({ targets: t, scaleY: 1, duration: 120, ease: 'Back.Out' });
        spikes.push(t);
      }
      const area = new Phaser.Geom.Rectangle(x - 55, y - 80, 110, 80);
      const pb = this.player.body;
      if (!this.player.dead && Phaser.Geom.Intersects.RectangleToRectangle(area, new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height)) && this.player.hurt(x)) this.feedbackHurt();
      this.time.delayedCall(650, () => this.tweens.add({ targets: spikes, alpha: 0, duration: 250, onComplete: () => spikes.forEach((t) => t.destroy()) }));
    });
  }

  private useDoor(to: { x: number; y: number }) {
    this.doorLock = true;
    this.player.frozen = true;
    this.sfx('checkpoint', 0);
    this.cameras.main.fadeOut(180, 20, 12, 40);
    this.time.delayedCall(200, () => {
      this.player.hit.setPosition(to.x, to.y - this.player.body.height / 2);
      this.player.body.setVelocity(0, 0);
      this.cameras.main.centerOn(to.x, to.y - 60);
      this.cameras.main.fadeIn(220, 20, 12, 40);
      this.player.frozen = false;
      this.burst(to.x, to.y - 40, 14, [0xb9a8ff, 0xffffff]);
    });
  }

  private enterSub(p: { x: number; y: number; sub: number }) {
    this.player.frozen = true;
    this.sfx('checkpoint', 0);
    this.burst(p.x, p.y - 40, 24, [0xb9a8ff, 0xffffff]);
    this.cameras.main.fadeOut(300, 255, 255, 255);
    const from: SubFrom = { level: this.levelIndex, x: p.x, y: p.y };
    this.time.delayedCall(330, () => this.scene.restart({ sub: p.sub, from }));
  }

  /** Fim de um sub-nível: marca o segredo e volta ao portal, na fase de origem. */
  private finishSub() {
    this.finished = true;
    this.player.frozen = true;
    this.player.victory = true;
    this.burst(this.player.hit.x, this.player.hit.y - 40, 50);
    const id = LEVELS[this.levelIndex]().id;
    const first = !this.save.secrets[id];
    this.save.secrets[id] = true;
    this.persistProgress();
    this.events.emit('toast', first ? 'Segredo descoberto! ✦' : 'Segredo concluído');
    const from = this.initData.from!;
    this.time.delayedCall(1600, () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(320, () => this.scene.restart({ level: from.level, back: from }));
    });
  }

  private dimRect?: Phaser.GameObjects.Rectangle;

  private dimScreen(alpha: number, ms: number) {
    this.dimRect ??= this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0b0714, 1).setOrigin(0).setScrollFactor(0).setDepth(18).setAlpha(0);
    this.tweens.add({ targets: this.dimRect, alpha, duration: ms });
  }

  /** Raios rápidos para marcar o clímax; com "Reduzir flashes" só há um raio fraco e sem piscar. */
  private stormFlash(n: number) {
    if (!canFlashScreen()) return;
    const f = this.add.rectangle(0, 0, GAME_W, GAME_H, 0xffffff, 1).setOrigin(0).setScrollFactor(0).setDepth(19).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    for (let i = 0; i < n; i++) {
      this.time.delayedCall(i * 210, () => {
        f.setFillStyle(i % 2 ? 0xb8a0ff : 0xffffff);
        this.tweens.add({ targets: f, alpha: { from: 0.45, to: 0 }, duration: 160 });
        this.bolt();
      });
    }
    this.time.delayedCall(n * 210 + 300, () => f.destroy());
  }

  /** Um raio em zigue-zague caindo do alto da tela. */
  private bolt() {
    const cam = this.cameras.main;
    const g = this.add.graphics().setDepth(19).setBlendMode(Phaser.BlendModes.ADD);
    let x = cam.scrollX + Phaser.Math.Between(120, GAME_W - 120), y = 0;
    g.lineStyle(5, 0xe8dcff, 1).beginPath().moveTo(x, y);
    while (y < GAME_H * 0.8) {
      x += Phaser.Math.Between(-40, 40);
      y += Phaser.Math.Between(40, 90);
      g.lineTo(x, y);
    }
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  private bossDefeated() {
    this.bossDamage?.finale();
    this.color.complete();
    this.sfx('boss_restored', 0);
    this.events.emit('boss-hp', null);
    this.time.delayedCall(800, () =>
      this.talk(STORY[this.level.world].bossRestored, () => {
        if (this.level.world === 7) return this.toEnding();
        // portal no lado oposto ao chefão (e na frente dele), para nunca ficar escondido
        const arenaW = this.level.cols * TILE;
        const bossRight = (this.boss?.hit.x ?? arenaW) > arenaW / 2;
        const exit = this.addExit(bossRight ? 6 * TILE + TILE / 2 : arenaW - 6 * TILE - TILE / 2, 10 * TILE);
        exit.setAlpha(0).setDepth(9);
        this.tweens.add({ targets: exit, alpha: 1, duration: 600 });
        this.burst(exit.x, exit.y - 80, 40);
      }),
    );
  }

  private glideSnd?: Phaser.Sound.BaseSound;

  /** Som de vento contínuo enquanto Íris plana. */
  private updateGlideSound() {
    const on = this.player.gliding && !isMuted() && this.cache.audio.exists('sfx_glide_loop');
    if (on && !this.glideSnd) {
      this.glideSnd = this.sound.add('sfx_glide_loop', { loop: true, volume: 0.35 });
      this.glideSnd.play();
      this.events.once('shutdown', () => this.stopGlideSound());
    } else if (!on && this.glideSnd) this.stopGlideSound();
  }

  private stopGlideSound() {
    this.glideSnd?.stop();
    this.glideSnd?.destroy();
    this.glideSnd = undefined;
  }

  /** Fim do jogo: salva como concluído e vai para a tela final. */
  private toEnding() {
    if (!this.save.completed.includes(this.level.id)) this.save.completed.push(this.level.id);
    this.save.finished = true;
    this.persistProgress();
    this.cameras.main.fadeOut(1200, 255, 255, 255);
    this.time.delayedCall(1250, () => {
      this.scene.stop('Hud');
      this.scene.stop('Dialogue');
      // final verdadeiro: só com todos os fragmentos das fases (chefões não têm)
      const all = LEVELS.map((b) => b()).filter((l) => !l.arena);
      const got = all.reduce((n, l) => n + (this.save.shards[l.id] ?? []).filter(Boolean).length, 0);
      const perfect = got >= all.length * 3;
      this.scene.start('Cutscene', {
        slides: perfect ? [...worldEpilogueWithFallback(7, (tex) => has(this, tex)), ...ENDING, TRUE_ENDING] : [...worldEpilogueWithFallback(7, (tex) => has(this, tex)), ...ENDING],
        next: 'Ending',
        music: 'ending',
        footer: perfect ? '' : `Fragmentos: ${got} / ${all.length * 3} · junte todos para o final verdadeiro`,
      });
    });
  }

  private bossMarker?: Phaser.GameObjects.Text;
  private dangerMarker?: Phaser.GameObjects.Text;
  private wasBossDangerous = false;
  private dangerUntil = 0;

  /** Indicador não dependente de cor para o estado vulnerável do chefão. */
  private updateBossMarker() {
    const b = this.boss;
    const dangerous = !!b?.dangerous;
    if (dangerous && !this.wasBossDangerous) this.dangerUntil = this.time.now + 850;
    this.wasBossDangerous = dangerous;
    const attacks: Record<string, string> = {
      slamWind: '⚠ IMPACTO', throwWind: '⚠ PROJÉTEIS', stompWind: '⚠ PISÃO',
      spitWind: '⚠ DISPAROS', stormWind: '⚠ TEMPESTADE', warn: '⚠ ERUPÇÃO',
      dropWind: '⚠ QUEDA', charge: '⚠ INVESTIDA',
      lashWind: '⚠ CHICOTE', eruptWind: '⚠ ESPINHOS', rollWind: '⚠ ROLAGEM',
      riseWind: '⚠ SUBIDA', sweepWind: '⚠ VARREDURA', inkWind: '⚠ TINTA',
      gustWind: '⚠ RAJADA', orbsWind: '⚠ ESFERAS',
      masksWind: '⚠ MÁSCARAS', spikesWind: '⚠ ESPINHOS', bouldersWind: '⚠ PEDRAS', tornadoWind: '⚠ TORNADO',
    };
    const attackLabel = b?.state ? attacks[b.state] : undefined;
    const warn = !!attackLabel || (dangerous && this.time.now < this.dangerUntil && !b?.vulnerable);
    if (warn && !this.dangerMarker) {
      this.dangerMarker = this.add.text(0, 0, '⚠  CUIDADO', { fontFamily: '"Trebuchet MS", sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#fff4b8', stroke: '#24133a', strokeThickness: 5 }).setOrigin(0.5).setDepth(15);
    }
    if (!warn) { this.dangerMarker?.destroy(); this.dangerMarker = undefined; }
    else this.dangerMarker!.setText(attackLabel ?? '⚠ CUIDADO').setPosition(b!.hit.x, b!.body.top - 48);
    const show = !!b && b.vulnerable;
    if (show && !this.bossMarker) {
      this.bossMarker = this.add
        .text(0, 0, '◎  ATACAR', { fontFamily: '"Trebuchet MS", sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffffff', stroke: '#24133a', strokeThickness: 5 })
        .setOrigin(0.5)
        .setDepth(15);
      this.tweens.add({ targets: this.bossMarker, scale: 1.12, duration: 400, yoyo: true, repeat: -1 });
    }
    if (!show) {
      this.bossMarker?.destroy();
      this.bossMarker = undefined;
      return;
    }
    this.bossMarker!.setPosition(b!.hit.x, b!.body.top - 48);
  }

  /** Coletável: frame do atlas "collectibles" ou textura provisória. */
  private pickup(x: number, y: number, kind: string, frame: number, scale: number) {
    const art = has(this, 'collectibles');
    const s = this.pickups.create(x, y, art ? 'collectibles' : kind, art ? String(frame) : undefined) as Sprite;
    s.setData('kind', kind).setOrigin(0.5).setDepth(6);
    if (art) s.setScale(scale);
    return s;
  }

  /** Objeto de fase: zona de colisão invisível + visual separado (arte ou provisório). */
  private prop(kind: string, cx: number, bottom: number, w: number, h: number, frame: number, scale: number, placeholder: string) {
    const art = has(this, 'level_objects');
    const view = art
      ? this.add.image(cx, bottom + 4, 'level_objects', String(frame)).setScale(scale)
      : this.add.image(cx, bottom, placeholder);
    view.setOrigin(0.5, 1).setDepth(3);
    const z = this.add.zone(cx, bottom - h / 2, w, h);
    this.props.add(z);
    z.setData('kind', kind).setData('view', view);
    return view;
  }

  private hintBubbles: Phaser.GameObjects.Container[] = [];

  /**
   * Dicas como balõezinhos discretos: fundo translúcido arredondado, texto leve,
   * e só aparecem (com fade) quando Íris se aproxima.
   */
  private buildHints() {
    this.hintBubbles = [];
    for (const h of this.level.hints) {
      const hintText = h.text.replace('← →  andar', '← → / analógico  andar').replace('ESPAÇO  pular', 'ESPAÇO / A  pular').replace('X  golpe de echarpe', 'X / botão X  golpe de echarpe');
      const text = this.add
        .text(0, 0, hintText, {
          fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
          fontSize: '21px',
          color: '#fff6ec',
          align: 'center',
          wordWrap: { width: 420 },
        })
        .setOrigin(0.5)
        .setShadow(0, 1, '#2a1640', 3, false, true);
      const w = text.width + 44, hgt = text.height + 18;
      const bg = this.add.graphics();
      bg.fillStyle(0x2a1640, 0.5).fillRoundedRect(-w / 2, -hgt / 2, w, hgt, hgt / 2);
      bg.lineStyle(2, 0xffffff, 0.25).strokeRoundedRect(-w / 2, -hgt / 2, w, hgt, hgt / 2);
      const star = this.add.text(-w / 2 + 16, 0, '✦', { fontSize: '14px', color: '#ffd9f4' }).setOrigin(0.5);
      text.x = 6;
      const bubble = this.add.container(h.col * TILE, h.row * TILE, [bg, star, text]).setDepth(2).setAlpha(0);
      bubble.setData('baseY', h.row * TILE);
      this.hintBubbles.push(bubble);
    }
  }

  private updateHints(dt: number) {
    const px = this.player.hit.x;
    for (const b of this.hintBubbles) {
      const near = Math.abs(b.x - px) < 7 * TILE && Math.abs(b.y - this.player.hit.y) < 5 * TILE;
      b.alpha += ((near ? 1 : 0) - b.alpha) * Math.min(1, dt * 4);
      b.y = (b.getData('baseY') as number) + Math.sin(this.time.now / 700 + b.x) * 3; // flutua de leve
    }
  }

  // ---------- colisões ----------

  private setupCollisions() {
    const p = this.player.hit;
    this.physics.add.collider(p, this.solids);
    this.physics.add.collider(p, this.oneways);
    this.physics.add.collider(p, this.crates);
    this.physics.add.collider(p, this.cages);
    this.physics.add.collider(p, this.cracked);
    this.physics.add.collider(p, this.gatesGroup);
    this.physics.add.collider(p, this.bumps, (_pl, b) => {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if ((body.blocked.up || body.touching.up) && !(b as Sprite).getData('used')) this.bumpBlock(b as Sprite);
    });
    this.physics.add.collider(p, this.pushboxes);
    for (const g of [this.solids, this.oneways, this.crates, this.cages, this.cracked, this.gatesGroup, this.bumps]) this.physics.add.collider(this.pushboxes, g);
    this.physics.add.collider(this.pushboxes, this.pushboxes);
    this.physics.add.collider(this.pshots, this.pushboxes, (s) => this.popShot(s as Sprite));
    this.physics.add.collider(this.pshots, this.bumps, (s) => this.popShot(s as Sprite));
    // cristais de prisma: restauram inimigos, quebram caixas, contam no cristal do guardião e no chefão
    this.physics.add.collider(this.pshots, this.solids, (s) => this.popShot(s as Sprite));
    this.physics.add.collider(this.pshots, this.cracked, (s) => this.popShot(s as Sprite));
    this.physics.add.overlap(this.pshots, this.enemies.map((e) => e.hit), (a, b) => {
      // a ordem dos dois objetos pode vir trocada: o inimigo é o que tem o dado 'enemy'
      const [s, eh] = (a as Sprite).getData('enemy') ? [b, a] : [a, b];
      const e = (eh as Sprite).getData('enemy') as Enemy;
      if (e.restored || !e.exposed) return;
      if (e.armoredFront) this.sparkle(e.hit.x, e.hit.y, 0xdddddd);
      else this.restoreEnemy(e);
      this.popShot(s as Sprite);
    });
    this.physics.add.collider(this.pshots, this.crates, (s, cr) => {
      this.burst((cr as Sprite).x, (cr as Sprite).y, 12, [0x9a9da6, 0xffffff]);
      this.color.add(COLOR_POINTS.crate);
      this.sfx('break_block');
      (cr as Sprite).destroy();
      this.popShot(s as Sprite);
    });
    this.physics.add.collider(this.pshots, this.cages, (s) => {
      if (this.guardian && !this.guardian.freed) this.hitCage();
      this.popShot(s as Sprite);
    });
    if (this.boss) {
      const boss = this.boss;
      this.physics.add.overlap(this.pshots, boss.hit, (a, b) => {
        const s = a === boss.hit ? b : a;
        if (boss.takeHit()) {
          this.sfx('boss_hit');
          this.hitStop(80);
        } else this.sparkle((s as Sprite).x, (s as Sprite).y, 0xdddddd);
        this.popShot(s as Sprite);
      });
    }
    if (this.movers.length) this.physics.add.collider(p, this.movers.map((m) => m.zone));
    if (this.boss) {
      const boss = this.boss;
      this.physics.add.overlap(p, boss.hit, () => this.touchBoss());
      this.physics.add.overlap(p, boss.shots, (_p, s) => {
        if (this.player.frozen) return;
        if (this.player.hurt((s as Sprite).x)) this.feedbackHurt();
      });
    }

    const enemyHits = this.enemies.map((e) => e.hit);
    const walkers = this.enemies.filter((e) => e.kind !== 'moth').map((e) => e.hit);
    this.physics.add.collider(walkers, this.solids);
    this.physics.add.collider(walkers, this.oneways);
    this.physics.add.collider(walkers, this.crates);

    this.physics.add.overlap(p, enemyHits, (_p, eh) => this.touchEnemy((eh as Sprite).getData('enemy') as Enemy));
    this.physics.add.overlap(p, this.pickups, (_p, s) => this.collect(s as Sprite));
    this.physics.add.overlap(p, this.hazards, () => this.hitHazard());
    this.physics.add.overlap(p, this.props, (_p, s) => this.touchProp(s as Phaser.GameObjects.Zone));
    this.physics.add.overlap(p, this.shots, (_p, s) => {
      if (this.player.hurt((s as Sprite).x)) this.feedbackHurt();
      (s as Sprite).destroy();
    });
    this.physics.add.collider(this.shots, this.solids, (s) => (s as Sprite).destroy());
  }

  private setupEvents() {
    this.events.off('player-attack').on('player-attack', () => {
      this.sfx('attack_whip');
      this.swing();
    });
    this.events.off('player-land').on('player-land', () => {
      this.sfx('land');
      this.dust(this.player.hit.x, this.player.body.bottom);
    });
    this.events.off('player-jump').on('player-jump', () => {
      if (!this.player.onGround) return; // o pulo duplo tem som próprio
      this.sfx('jump');
      this.dust(this.player.hit.x, this.player.body.bottom);
    });
    this.events.off('player-doublejump').on('player-doublejump', () => {
      // pulo duplo: com a arte desenhada, a pirueta e o anel já vêm no sprite;
      // sem ela, anel de partículas e giro procedural
      const p = this.player;
      this.sfx('double_jump');
      if (p.flipTime > 0) return;
      if (!this.fx('fx-burst', p.hit.x, p.body.bottom, 0.45)) this.sparkle(p.hit.x, p.body.bottom, 0xff6b81);
      this.tweens.add({ targets: p.view, angle: { from: 0, to: 360 * p.facing }, duration: 320, ease: 'Cubic.Out', onComplete: () => p.view.setAngle(0) });
    });
    this.events.off('player-shoot').on('player-shoot', () => this.shootPrism());
    this.events.off('player-pound').on('player-pound', () => this.poundImpact());
    this.events.off('player-swim').on('player-swim', () => this.sfx('jump', 300));
    this.events.off('player-dash').on('player-dash', () => {
      this.sfx('dash');
      // rastro de "fantasmas" coloridos durante o dash
      const p = this.player;
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 30, () => {
          const g = this.add
            .image(p.view.x, p.view.y, p.view.texture.key, p.view.frame.name)
            .setOrigin(p.view.originX, p.view.originY)
            .setScale(p.view.scaleX, p.view.scaleY)
            .setFlipX(p.view.flipX)
            .setTint(RAINBOW[i % RAINBOW.length])
            .setAlpha(0.6)
            .setDepth(9);
          this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
        });
      }
    });
  }

  // ---------- água (Mundo 5) ----------

  private waterY = Infinity;

  /** Água da linha `level.water` para baixo: véu azul por cima de tudo e bolhas subindo. */
  private buildWater() {
    if (this.level.water === undefined) return;
    this.waterY = this.level.water * TILE;
    const w = this.level.cols * TILE, h = this.level.rows * TILE + 600 - this.waterY;
    this.add.rectangle(0, this.waterY, w, h, 0x2bb6d6, 0.16).setOrigin(0).setDepth(14);
    if (this.level.water > 0) this.add.rectangle(0, this.waterY, w, 4, 0xe8fbff, 0.6).setOrigin(0).setDepth(14);
    this.waves = [];
    if (this.ambient.on && this.level.water > 0) {
      // ondas que correm na superfície: uma faixa do tamanho da tela que acompanha a câmera
      for (const [dy, a, speed, sc] of [[-8, 0.5, 36, 1], [-2, 0.3, -24, 0.7]] as const) {
        const ts = this.add.tileSprite(0, this.waterY + dy, GAME_W + 64, 16 * sc, 'fx_wave').setOrigin(0).setTileScale(sc).setAlpha(a).setTint(0xe8fbff).setBlendMode(Phaser.BlendModes.ADD).setDepth(14);
        this.waves.push({ ts, speed, sc });
      }
    }
    this.add
      .particles(0, 0, 'dot', {
        x: { min: 0, max: w },
        y: { min: this.waterY + 100, max: this.level.rows * TILE },
        speedY: { min: -60, max: -25 },
        lifespan: 4000,
        scale: { start: 0.35, end: 0.1 },
        alpha: { start: 0.55, end: 0 },
        tint: 0xdff6ff,
        frequency: 70,
      })
      .setDepth(13);
  }

  // ---------- disparo de prisma e mergulho estelar ----------

  private pshots!: Phaser.Physics.Arcade.Group;
  private cracked!: Phaser.Physics.Arcade.StaticGroup;

  private shootPrism() {
    const p = this.player;
    const art = has(this, 'prism_shot');
    const s = this.pshots.create(p.hit.x + p.facing * 50, p.hit.y - 8, art ? 'prism_shot' : 'shard', art ? '0' : undefined) as Sprite;
    s.setScale(art ? 0.5 : 0.5).setFlipX(p.facing < 0).setDepth(12);
    (s.body as Phaser.Physics.Arcade.Body).setSize(s.width * 0.7, s.height * 0.6);
    s.setVelocityX(p.facing * PHYS.shotSpeed);
    this.sfx('shoot', 120);
    this.time.delayedCall(900, () => s.active && this.popShot(s));
  }

  private popShot(s: Sprite) {
    if (!s.active) return;
    this.sparkle(s.x, s.y, 0xffc6ff);
    s.destroy();
  }

  /** Impacto do mergulho: quebra blocos rachados e caixas logo abaixo e restaura quem está perto. */
  private poundImpact() {
    const p = this.player;
    const x = p.hit.x, y = p.body.bottom;
    this.shakeCamera(180, 0.01);
    this.sfx('ground_pound', 0);
    this.fx('fx-burst', x, y, 0.7);
    this.burst(x, y - 10, 20);
    let broke = false;
    for (const group of [this.cracked, this.crates]) {
      for (const b of [...group.getChildren()] as Sprite[]) {
        if (Math.abs(b.x - x) < 80 && b.y > y - 10 && b.y < y + TILE * 1.5) {
          this.burst(b.x, b.y, 14, [0xb9a8ff, 0xffffff]);
          b.destroy();
          broke = true;
        }
      }
    }
    if (broke) {
      this.sfx('break_block');
      p.body.setVelocityY(200); // continua caindo pelo buraco
    }
    for (const e of this.enemies) {
      if (!e.restored && e.exposed && Math.abs(e.hit.x - x) < 120 && Math.abs(e.body.bottom - y) < 40) this.restoreEnemy(e);
    }
  }

  private touchEnemy(e: Enemy) {
    if (e.restored || !e.exposed || this.player.dead) return;
    const pb = this.player.body;
    const stomp = pb.velocity.y > 0 && pb.bottom - e.body.top < 28 && !e.spiky;
    if (stomp) {
      this.restoreEnemy(e);
      this.player.bounce(this.controls.jumpHeld ? PHYS.stompBounceHeld : PHYS.stompBounce);
    } else if (this.player.hurt(e.hit.x)) {
      this.feedbackHurt();
    }
  }

  private restoreEnemy(e: Enemy) {
    // só comemora (e conta) se a restauração aconteceu de fato
    if (!e.restore()) return;
    if (++this.combo >= 5) {
      this.combo = 0;
      this.dropHeart(this.player.hit.x, this.player.body.bottom - 40);
      this.events.emit('toast', 'Combo de 5! Um coração!');
    }
    this.sfx('hit_enemy');
    this.time.delayedCall(120, () => this.sfx('enemy_restored'));
    this.fx('fx-burst', e.hit.x, e.hit.y, 0.6);
    this.burst(e.hit.x, e.hit.y, 26);
    this.color.add(COLOR_POINTS.enemy);
    this.shakeCamera(90, 0.004);
    this.hitStop(60);
  }

  private swing() {
    const p = this.player;
    this.swingHits.clear();
    if (has(this, 'iris_attack')) return; // o arco já faz parte da animação desenhada
    const slash = this.add
      .image(p.hit.x + p.facing * 30, p.hit.y - 4, 'slash')
      .setOrigin(0.15, 0.5)
      .setFlipX(p.facing < 0)
      .setDepth(12)
      .setScale(0.6);
    if (p.facing < 0) slash.setOrigin(0.85, 0.5);
    this.tweens.add({ targets: slash, scale: 1, alpha: 0, duration: 220, onComplete: () => slash.destroy() });
  }

  private checkSwing() {
    if (this.player.attackTime <= 0) return;
    const r = this.player.attackRect();
    const hits = (b: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody) =>
      Phaser.Geom.Intersects.RectangleToRectangle(r, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height));

    for (const e of this.enemies) {
      if (e.restored || !e.exposed || this.swingHits.has(e) || !hits(e.body)) continue;
      this.swingHits.add(e);
      if (e.armoredFront) {
        this.sparkle(e.hit.x - this.player.facing * 20, e.hit.y, 0xdddddd);
        this.player.body.setVelocityX(-this.player.facing * 260);
        this.shakeCamera(60, 0.003);
      } else this.restoreEnemy(e);
    }
    for (const c of [...this.crates.getChildren()] as Sprite[]) {
      if (!this.swingHits.has(c) && hits(c.body as Phaser.Physics.Arcade.StaticBody)) {
        this.swingHits.add(c);
        this.burst(c.x, c.y, 12, [0x9a9da6, 0xffffff]);
        this.color.add(COLOR_POINTS.crate);
        this.sfx('break_block');
        c.destroy();
      }
    }
    for (const s of [...this.shots.getChildren()] as Sprite[]) {
      if (hits(s.body as Phaser.Physics.Arcade.Body)) {
        this.sparkle(s.x, s.y, 0xffffff);
        s.destroy();
      }
    }
    const g = this.guardian;
    if (g && !g.freed && !this.swingHits.has(g) && hits(g.zone.body as Phaser.Physics.Arcade.StaticBody)) {
      this.swingHits.add(g);
      this.hitCage();
    }
    const boss = this.boss;
    if (boss && !this.swingHits.has(boss) && hits(boss.body)) {
      this.swingHits.add(boss);
      if (boss.takeHit()) {
        this.sfx('boss_hit');
        this.hitStop(80);
      }
      else this.sparkle(boss.hit.x - this.player.facing * 60, this.player.hit.y, 0xdddddd);
    }
  }

  private collect(s: Sprite) {
    const kind = s.getData('kind');
    if (kind === 'coin') {
      this.coins++;
      this.sfx('coin', 150);
      // a cada 50 faíscas: +1 coração (com todos cheios, vira um coração extra temporário)
      if (++this.coinBank >= COINS_PER_HEART) {
        this.coinBank = 0;
        const p = this.player;
        p.hp = Math.min(p.hp + 1, p.maxHp + 1);
        this.sfx('heart', 0);
        this.events.emit('toast', '50 faíscas: +1 coração!');
      }
      this.color.add(COLOR_POINTS.coin);
      this.sparkle(s.x, s.y, s.tintTopLeft);
    } else if (kind === 'shard') {
      this.sfx('shard', 0);
      const index = s.getData('index') as number;
      this.shards[index] = true;
      const previous = this.save.shards[this.level.id] ?? [false, false, false];
      this.save.shards[this.level.id] = Array.from({ length: 3 }, (_, i) => previous[i] === true || this.shards[i]);
      this.persistProgress();
      this.color.add(COLOR_POINTS.shard);
      this.burst(s.x, s.y, 30);
      this.hitStop(80);
    } else if (kind === 'chest') {
      this.sfx('shard', 0);
      this.burst(s.x, s.y - 20, 30, [0xffd86b, 0xffffff, 0xb9a8ff]);
      if (has(this, 'collectibles')) s.setFrame(String(F.collectibles.chestOpen));
      (s.body as Phaser.Physics.Arcade.Body).enable = false;
      s.setData('kind', 'opened');
      this.popPickup('heart', s.x, s.y - TILE * 1.2);
      [-40, 0, 40].forEach((dx, i) => this.time.delayedCall(i * 110, () => this.popPickup('coin', s.x + dx, s.y - TILE * 1.6 - (i % 2) * 22)));
      this.events.emit('toast', 'Baú encontrado!');
      this.pushHud();
      return;
    } else if (kind === 'opened') {
      return;
    } else if (kind === 'heart') {
      if (this.player.hp >= this.player.maxHp) return;
      this.player.hp++;
      this.sfx('heart', 0);
      this.sparkle(s.x, s.y, 0xff3d5a);
    }
    s.destroy();
    this.pushHud();
  }

  private hitHazard() {
    if (this.player.hurt(this.player.hit.x - this.player.facing * 10, false)) {
      this.player.bounce(700);
      this.feedbackHurt();
    }
  }

  private touchProp(s: Phaser.GameObjects.Zone) {
    const kind = s.getData('kind');
    const view = s.getData('view') as Phaser.GameObjects.Image;
    const art = view.texture.key === 'level_objects';
    if (kind === 'spring') {
      // >= 0: ao pousar, o chão já zerou a velocidade antes desta checagem
      if (this.player.body.velocity.y >= 0 && this.time.now > (s.getData('cool') ?? 0)) {
        s.setData('cool', this.time.now + 200);
        this.player.bounce(PHYS.springVel);
        this.sfx('spring');
        if (art) {
          view.setFrame(String(F.objects.springDown));
          this.time.delayedCall(140, () => view.setFrame(String(F.objects.springUp)));
        } else this.tweens.add({ targets: view, scaleY: 0.6, duration: 70, yoyo: true });
      }
    } else if (kind === 'checkpoint' && !s.getData('on')) {
      s.setData('on', true);
      this.sfx('checkpoint', 0);
      if (art) view.setFrame(String(F.objects.checkpointOn));
      else view.setTexture('checkpoint_on');
      this.respawnPoint.set(s.x, s.y + 64 - 46);
      this.color.add(COLOR_POINTS.checkpoint);
      this.burst(s.x, s.y - 40, 24);
      if (this.tuning.checkpointHeals) this.player.hp = Math.max(this.player.hp, this.player.maxHp);
      this.pushHud();
    } else if (kind === 'exit' && !this.finished) {
      this.finish();
    }
  }

  enemyShoot(e: Enemy, dir: number) {
    const s = this.shots.create(e.hit.x + dir * 30, e.hit.y - 6, 'ring') as Sprite;
    s.setVelocityX(dir * 260).setDepth(9);
    this.tweens.add({ targets: s, scale: 1.4, duration: 400, yoyo: true, repeat: -1 });
    this.time.delayedCall(3500, () => s.active && s.destroy());
  }

  playerY() {
    return this.player.hit.y;
  }

  playerX() {
    return this.player.hit.x;
  }

  // ---------- fluxo ----------

  private feedbackHurt() {
    this.combo = 0;
    this.sfx('hurt', 0);
    this.shakeCamera(140, 0.008);
    this.flashScreen(120, 255, 80, 100);
    this.pushHud();
    if (this.player.hp <= 0) this.die();
  }

  private die() {
    this.sfx('death', 0);
    this.player.dead = true;
    this.cameras.main.fadeOut(500, 20, 10, 30);
    this.time.delayedCall(600, () => {
      this.player.hp = this.player.maxHp;
      this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
      this.cameras.main.fadeIn(400);
      this.pushHud();
    });
  }

  /** Salva progresso importante e informa uma única vez se o armazenamento falhar. */
  private persistProgress() {
    if (!writeSave(this.save) && !this.saveWarningShown) {
      this.saveWarningShown = true;
      this.events.emit('toast', 'Não foi possível salvar o progresso neste navegador.');
    }
  }

  private finish() {
    if (this.isSub) return this.finishSub();
    this.finished = true;
    this.player.frozen = true;
    this.player.victory = true;
    playMusic(this, 'victory', false);
    this.color.complete();
    this.burst(this.player.hit.x, this.player.hit.y - 40, 60);
    // salva: fragmentos (somando aos de vezes anteriores) e a próxima fase
    const prev = this.save.shards[this.level.id] ?? [false, false, false];
    const heartsBefore = prismHearts(this.save);
    this.save.shards[this.level.id] = prev.map((v, i) => v || this.shards[i]);
    if (prismHearts(this.save) > heartsBefore) {
      this.time.delayedCall(900, () => this.events.emit('toast', `Coração de Prisma! +1 coração máximo\n(${totalShards(this.save)} fragmentos)`));
    }
    if (!this.save.completed.includes(this.level.id)) this.save.completed.push(this.level.id);
    const next = this.levelIndex + 1;
    this.save.level = next < LEVELS.length ? next : this.levelIndex;
    this.persistProgress();

    this.events.emit('level-complete', {
      coins: this.coins,
      shards: this.shards.filter(Boolean).length,
      restored: this.enemies.filter((e) => e.restored).length,
      enemies: this.enemies.length,
      boss: !!this.boss,
      worldDone: this.boss ? this.level.world : 0,
      worldName: worldInfo(this.level.world).name,
      nextWorld: STORY[this.level.world]?.nextWorld ?? '',
    });
    this.time.delayedCall(1200, () => {
      this.input.keyboard!.once('keydown', () => this.toMap());
    });
  }

  /** Volta para o mapa-múndi com o cursor na próxima fase. */
  toMap() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => {
      this.scene.stop('Hud');
      this.scene.stop('Dialogue');
      if (this.boss) {
        this.scene.start('Cutscene', {
          slides: worldEpilogueWithFallback(this.level.world, (tex) => has(this, tex)),
          next: 'Map',
          nextData: { focus: this.save.level },
          music: 'map',
        });
      }
      else this.scene.start('WorldMap', { world: this.level.world, focus: this.save.level });
    });
  }

  private goTo(level: number) {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.restart({ level }));
  }

  private restartLevel() {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.restart(this.initData));
  }

  private pushHud() {
    const state: HudState = {
      hp: this.player.hp,
      maxHp: Math.max(this.player.maxHp, this.player.hp),
      coinBank: this.coinBank,
      coins: this.coins,
      shards: [...this.shards],
      levelName: this.level.name,
      levelId: this.level.id,
      showShards: !this.level.arena && !this.isSub,
    };
    this.events.emit('hud', state);
  }

  // ---------- efeitos ----------

  private burst(x: number, y: number, n: number, colors = RAINBOW) {
    const em = this.add.particles(x, y, 'dot', {
      speed: { min: 120, max: 380 },
      lifespan: { min: 400, max: 800 },
      scale: { start: 0.9, end: 0 },
      tint: colors,
      gravityY: 400,
      emitting: false,
    });
    em.setDepth(13).explode(n);
    this.time.delayedCall(900, () => em.destroy());
  }

  private sparkle(x: number, y: number, color: number) {
    const em = this.add.particles(x, y, 'dot', {
      speed: { min: 60, max: 180 },
      lifespan: 350,
      scale: { start: 0.6, end: 0 },
      tint: [color, 0xffffff],
      emitting: false,
    });
    em.setDepth(13).explode(8);
    this.time.delayedCall(400, () => em.destroy());
  }

  /** Toca um efeito do atlas "vfx" uma vez e o remove. */
  private fx(anim: string, x: number, y: number, scale: number, originY = 0.5) {
    if (!has(this, 'vfx')) return false;
    const s = this.add.sprite(x, y, 'vfx').setOrigin(0.5, originY).setScale(scale).setDepth(12);
    s.play(anim).once('animationcomplete', () => s.destroy());
    return true;
  }

  private dust(x: number, y: number) {
    if (this.fx('fx-dust', x, y + 2, 0.32, 1)) return;
    const em = this.add.particles(x, y - 4, 'dot', {
      speedX: { min: -90, max: 90 },
      speedY: { min: -60, max: -10 },
      lifespan: 300,
      scale: { start: 0.7, end: 0 },
      tint: 0xf3e6d8,
      alpha: { start: 0.8, end: 0 },
      emitting: false,
    });
    em.setDepth(9).explode(6);
    this.time.delayedCall(350, () => em.destroy());
  }

  private hitStop(ms: number) {
    this.physics.world.pause();
    this.time.delayedCall(ms, () => this.physics.world.resume());
  }

  // ---------- loop ----------

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    this.controls.update();
    if (this.controls.restartPressed) this.restartLevel();
    if (this.controls.mutePressed) toggleMute(this);
    if (this.controls.pausePressed && !this.finished && !this.scene.isActive('Dialogue')) {
      this.scene.launch('Pause');
      this.scene.pause();
      return;
    }

    this.syncMoverViews();
    this.updateWind();
    this.updateVents(dt);
    this.updateSearchlights(dt);
    this.player.inWater = this.player.hit.y > this.waterY;
    this.player.update(dt, this.controls);
    this.updateGlideSound();
    this.updateHints(dt);
    this.updateInteractive(dt);
    this.updateWeights(dt);
    this.updateFissures(dt);
    this.checkSwing();
    for (const e of this.enemies) e.update(dt);
    this.boss?.update(dt * this.tuning.bossSpeed);
    // vira o chefão para o lado de Íris, conforme a direção em que cada arte foi desenhada
    if (this.boss) {
      const art = BOSS_ART_FACING[this.level.world] ?? 'front';
      const playerLeft = this.player.hit.x < this.boss.hit.x;
      if (art !== 'front') this.boss.view.setFlipX(art === 'right' ? playerLeft : !playerLeft);
    }
    this.updateBossMarker();
    this.color.update(dt);

    // caiu no buraco
    const worldH = this.level.rows * TILE;
    if (!this.player.dead && this.player.hit.y > worldH + 80) {
      this.player.hp--;
      this.feedbackHurt();
      if (this.player.hp > 0) this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
    }

    // câmera olha um pouco à frente
    const cam = this.cameras.main;
    this.camOffsetX += (-this.player.facing * 110 - this.camOffsetX) * Math.min(1, dt * 2);
    cam.setFollowOffset(this.camOffsetX, 60);

    // parallax
    if (this.bgFar) this.bgFar.tilePositionX = cam.scrollX * 0.08;
    if (this.bgMid) this.bgMid.tilePositionX = cam.scrollX * 0.25;
    if (this.bgNear) this.bgNear.tilePositionX = cam.scrollX * 0.5;
    this.ambient.update(dt, cam.scrollX, this.color.value);
    for (const w of this.waves) {
      w.ts.x = cam.scrollX - 32;
      w.ts.tilePositionX = (cam.scrollX - 32 + (this.time.now / 1000) * w.speed) / w.sc;
    }

    // Faísca segue Íris flutuando
    const tx = this.player.hit.x - this.player.facing * 48;
    const ty = this.player.hit.y - 78 + Math.sin(this.time.now / 300) * 6;
    this.spark.x += (tx - this.spark.x) * Math.min(1, dt * 5);
    this.spark.y += (ty - this.spark.y) * Math.min(1, dt * 5);
    this.spark.setFlipX(this.player.facing < 0);
  }
}
