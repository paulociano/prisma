import Phaser from 'phaser';
import * as THREE from 'three';
import { RAINBOW, TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import type { GameScene } from '../scenes/GameScene';
import { render3dEnabled } from '.';
import { CAMERA, cameraPose, toUnits, type EntityView, type LabelView, type SpriteView, type WorldSnapshot } from './snapshot';
import { ModelLibrary } from './ModelLibrary';
import { SpriteBoards } from './SpriteBoards';
import { Particles3D } from './Particles3D';
import { modelKey } from './models';

// Visual 3D (2.5D): desenha a GameScene em Three.js num canvas por baixo do canvas do Phaser.
// O Phaser continua dono da física, da entrada, do HUD e dos menus; aqui só se lê o
// retrato do mundo (GameScene.snapshot) e se desenha. Formas simples por enquanto:
// os modelos definitivos entram por cima destas mesmas funções de criação.

const DEPTH = 3; // profundidade dos blocos (eixo Z)

export class Renderer3D {
  private readonly canvas = document.createElement('canvas');
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(CAMERA.fov, 16 / 9, 0.1, 400);
  private readonly sun = new THREE.DirectionalLight(0xfff1dd, 2.2);
  private readonly levelRoot = new THREE.Group();
  private readonly entityRoot = new THREE.Group();
  private readonly entities = new Map<object, THREE.Object3D>();
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly labelRoot = new THREE.Group();
  private readonly labels = new Map<object, { sprite: THREE.Sprite; key: string }>();
  /** Camada de cor sobre o 3D (e sob o HUD) para o fade e o flash da câmera. */
  private readonly tintEl = document.createElement('div');
  private builtFor?: LevelData;
  private readonly models: ModelLibrary;
  private readonly boards: SpriteBoards;
  private readonly shadows = new Map<object, THREE.Mesh>();
  private entityMats: EntityMaterials = {};
  /** Faixa de chão atrás do caminho (altura e profundidades), montada com o fundo da fase. */
  private backStrip?: { floorY: number; z0: number; z1: number };
  private readonly particles: Particles3D;
  private readonly clock = new THREE.Clock();

  constructor(private readonly game: Phaser.Game) {
    this.models = new ModelLibrary(game);
    this.boards = new SpriteBoards(game);
    this.particles = new Particles3D(game);
    this.canvas.style.cssText = 'position:absolute;pointer-events:none;z-index:0;display:none';
    this.tintEl.style.cssText = 'position:absolute;pointer-events:none;z-index:0;display:none';
    document.body.prepend(this.canvas, this.tintEl);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(game.scale.width, game.scale.height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.camera.aspect = game.scale.width / game.scale.height;
    this.camera.updateProjectionMatrix();

    this.scene.background = new THREE.Color(0x1d1530);
    this.scene.fog = new THREE.Fog(0x2a2140, 30, 90);
    this.scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x4a3560, 1.1));
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 60 });
    this.scene.add(this.sun, this.sun.target, this.levelRoot, this.entityRoot, this.labelRoot, this.particles.root);

    // o canvas do Phaser (HUD, diálogos, menus) fica por cima
    Object.assign(game.canvas.style, { position: 'relative', zIndex: '1' });
    // desenha depois do Phaser, com a câmera 2D já atualizada no quadro
    game.events.on(Phaser.Core.Events.POST_RENDER, () => this.frame());
  }

  private frame() {
    const scene = this.game.scene.getScene('Game') as GameScene | null;
    const active = render3dEnabled() && !!scene?.sys.isActive();
    this.canvas.style.display = this.tintEl.style.display = active ? 'block' : 'none';
    if (!active || !scene) return;

    const snap = scene.snapshot();
    if (this.builtFor !== snap.level) this.buildLevel(snap);
    this.syncEntities(snap.entities, scene.time.now / 1000, Math.min(this.clock.getDelta(), 0.1));
    this.syncLabels(snap.labels);
    this.particles.sync(snap.particles);
    const tint = snap.tint;
    this.tintEl.style.background = tint ? `rgba(${tint.r},${tint.g},${tint.b},${tint.alpha})` : 'transparent';

    const pose = cameraPose(snap.camX, snap.camY);
    this.camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    this.camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
    this.sun.position.set(pose.target.x - 6, pose.target.y + 12, 10);
    this.sun.target.position.set(pose.target.x, pose.target.y, 0);

    this.alignToPhaserCanvas();
    this.renderer.render(this.scene, this.camera);
  }

  private alignToPhaserCanvas() {
    const r = this.game.canvas.getBoundingClientRect();
    const rect = { left: `${r.left + window.scrollX}px`, top: `${r.top + window.scrollY}px`, width: `${r.width}px`, height: `${r.height}px` };
    Object.assign(this.canvas.style, rect);
    Object.assign(this.tintEl.style, rect);
  }

  /** Textura do Phaser reaproveitada no Three (mesma imagem, sem baixar de novo). */
  private texture(key: string, repeat = false) {
    const id = `${key}:${repeat}`;
    const cached = this.textures.get(id);
    if (cached) return cached;
    if (!this.game.textures.exists(key)) return undefined;
    const t = new THREE.Texture(this.game.textures.get(key).getSourceImage() as HTMLImageElement);
    t.colorSpace = THREE.SRGBColorSpace;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    // chão visto de lado (ângulo rasante): sem filtro anisotrópico a textura vira um borrão
    t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    t.needsUpdate = true;
    this.textures.set(id, t);
    return t;
  }

  // ---------- fase (montada uma vez a partir da grade do LevelBuilder) ----------

  private buildLevel(snap: WorldSnapshot) {
    const level = snap.level;
    disposeChildren(this.levelRoot);
    this.clearEntities();
    disposeChildren(this.labelRoot);
    this.labels.clear();
    this.particles.clear();
    this.builtFor = level;
    this.buildEntityMaterials(level);
    // nas arenas o 2D usa o piso desenhado na arte; no 3D a perspectiva separa os dois, então o chão é modelado
    this.buildTiles(level);
    if (level.arena) this.buildArenaBackdrop(level.arena, snap);
    else {
      this.buildBackdrop(level);
      this.buildSceneryProps(level);
    }
    if (level.water !== undefined) this.buildWater(level);
  }

  /** Materiais das peças de cenário que são objetos (plataformas móveis, blocos quebráveis, caixas). */
  private buildEntityMaterials(level: LevelData) {
    const tex = (key: string, repeat = false) => this.texture(key, repeat);
    const std = (map?: THREE.Texture) => (map ? new THREE.MeshStandardMaterial({ map, roughness: 0.85 }) : undefined);
    this.entityMats = {
      platform: std(tex(`w${level.world}_platform`, true)),
      breakable: std(tex(`w${level.world}_breakable`)),
      crate: std(tex('crate_texture')),
    };
  }

  /**
   * Recortes do cenário (docs/PROMPTS-2.5D.md): elementos grandes em pé atrás do caminho, a
   * distâncias diferentes, e moitas na frente da câmera, sempre abaixo da linha do chão para
   * não cobrir a jogabilidade. As posições são sorteadas de forma fixa por fase.
   */
  private buildSceneryProps(level: LevelData) {
    const rand = seeded(level.id);
    const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
    const frames = (key: string) => (this.game.textures.exists(key) ? this.game.textures.get(key).getFrameNames() : []);
    const place = (key: string, frame: string, x: number, baseY: number, height: number, z: number, depth: number) => {
      const f = this.game.textures.getFrame(key, frame);
      const hPx = height * TILE, wPx = (hPx * f.realWidth) / f.realHeight;
      const board = this.boards.create();
      const s: SpriteView = { key, frame, x: x * TILE, y: -(baseY + height / 2) * TILE, w: wPx, h: hPx, flipX: rand() < 0.5, flipY: false, angle: 0, alpha: 1, depth };
      this.boards.place(board, s, z);
      this.levelRoot.add(board);
      return board;
    };

    const widthOf = (key: string, frame: string, height: number) => {
      const f = this.game.textures.getFrame(key, frame);
      return (height * f.realWidth) / f.realHeight;
    };

    // em pé na faixa de chão atrás do caminho: duas fileiras desencontradas e sobrepostas,
    // uma alta ao fundo e uma média na frente, para o cenário parecer contínuo
    const back = `w${level.world}_depth_props`;
    const backFrames = frames(back);
    const { floorY, z0, z1 } = this.backStrip!;
    const rows = [
      { z: z1 + 0.35, min: 3.6, var: 1.4 },
      { z: z0 - 0.45, min: 2.5, var: 1.0 },
    ];
    for (const row of rows) {
      for (let x = -8 - rand() * 3; backFrames.length && x < level.cols + 8; ) {
        const frame = pick(backFrames);
        const height = row.min + rand() * row.var;
        const width = widthOf(back, frame, height);
        const z = row.z + (rand() - 0.5) * 0.2;
        place(back, frame, x + width / 2, floorY - 0.05, height, z, z); // mais longe, desenhado antes
        x += width * (0.55 + rand() * 0.25); // sobrepõe a próxima peça
      }
    }

    // primeiro plano: faixa contínua na frente dos blocos, desenhada por cima de tudo. Só onde há
    // chão (com um bloco de folga de cada lado dos buracos) e com o topo abaixo do chão mais baixo.
    const front = `w${level.world}_front_props`;
    const frontFrames = frames(front);
    const surface = (c: number) => {
      if (c < 0 || c >= level.cols) return undefined;
      const r = level.tiles.findIndex((row) => row[c] === T.Solid);
      return r < 0 ? undefined : -r;
    };
    const lowestTop = (x0: number, x1: number) => {
      const tops: (number | undefined)[] = [];
      for (let c = Math.floor(x0) - 1; c <= Math.floor(x1) + 1; c++) tops.push(surface(c));
      return tops.some((t) => t === undefined) ? undefined : Math.min(...(tops as number[]));
    };
    for (let x = -1; frontFrames.length && x < level.cols + 1; ) {
      const frame = pick(frontFrames);
      // perto de buraco tenta uma peça menor antes de deixar o vão
      const fit = [1.9 + rand() * 0.7, 1.2].map((height) => ({ height, width: widthOf(front, frame, height) }))
        .find(({ width }) => lowestTop(x, x + width) !== undefined);
      if (!fit) {
        x += 1;
        continue;
      }
      const top = lowestTop(x, x + fit.width)! - 0.25;
      const board = place(front, frame, x + fit.width / 2, top - fit.height, fit.height, FRONT_Z + rand() * 0.4, 40);
      (board.material as THREE.MeshBasicMaterial).depthTest = false;
      x += fit.width * (0.6 + rand() * 0.2);
    }
  }

  /** Arte da arena num plano que cobre todo o quadro (a câmera da arena não se move). */
  private buildArenaBackdrop(key: string, snap: WorldSnapshot) {
    const tex = this.texture(key);
    if (!tex) return;
    const img = tex.image as HTMLImageElement;
    const z = -14;
    const { position: p, target: t } = cameraPose(snap.camX, snap.camY);
    const dist = p.z - z;
    const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));
    const visW = visH * this.camera.aspect;
    const aspect = img.width / img.height;
    const h = Math.max(visH, visW / aspect) * 1.08; // cobre o quadro com folga, sem distorcer
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(h * aspect, h), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
    // centro do quadro nessa profundidade, ao longo da linha de visão da câmera
    const k = (p.z - z) / (p.z - t.z);
    plane.position.set(p.x + (t.x - p.x) * k, p.y + (t.y - p.y) * k, z);
    this.levelRoot.add(plane);
  }

  /** Recife Turquesa: volume translúcido da linha d'água para baixo. */
  private buildWater(level: LevelData) {
    const top = -(level.water ?? 0);
    const bottom = -(level.rows + 4);
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(level.cols + 40, top - bottom, DEPTH + 1),
      new THREE.MeshStandardMaterial({ color: 0x2bb6d6, transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.2 }),
    );
    water.position.set(level.cols / 2, (top + bottom) / 2, 0);
    water.renderOrder = 100; // depois das placas: como no 2D, a água tinge quem está submerso
    this.levelRoot.add(water);
    if ((level.water ?? 0) > 0) {
      const surface = new THREE.Mesh(
        new THREE.PlaneGeometry(level.cols + 40, DEPTH + 1),
        new THREE.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }),
      );
      surface.rotation.x = -Math.PI / 2;
      surface.position.set(level.cols / 2, top, 0);
      surface.renderOrder = 101;
      this.levelRoot.add(surface);
    }
  }

  private buildTiles(level: LevelData) {
    const above = (c: number, r: number) => (r > 0 ? level.tiles[r - 1][c] : T.Empty);
    const solid: [number, number][] = [];
    const tops: [number, number][] = [];
    const oneways: [number, number][] = [];
    const spikes: [number, number][] = [];
    level.tiles.forEach((row, r) =>
      row.forEach((t, c) => {
        if (t === T.Solid) (above(c, r) === T.Solid ? solid : tops).push([c, r]);
        else if (t === T.OneWay) oneways.push([c, r]);
        else if (t === T.Spike) spikes.push([c, r]);
      }),
    );

    // a câmera em perspectiva enxerga um pouco abaixo da fase: o chão continua para baixo
    const bottom = level.rows - 1;
    level.tiles[bottom].forEach((t, c) => {
      if (t === T.Solid) for (let r = level.rows; r < level.rows + 4; r++) solid.push([c, r]);
    });

    // texturas opcionais (docs/PROMPTS-2.5D.md); sem elas, ficam as cores provisórias
    const w = level.world;
    const textured = (key: string, fallback: number) => {
      const map = this.texture(key, true);
      return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : fallback, map, roughness: 0.9 });
    };
    const arenaFloor = level.arena ? this.texture(`w${w}_arena_floor`, true) : undefined;
    const dirt = arenaFloor ? new THREE.MeshStandardMaterial({ map: arenaFloor, roughness: 0.9 }) : textured(`w${w}_ground`, 0x7a5a48);
    const top = arenaFloor ? dirt : textured(`w${w}_ground_top`, 0x6fd36a);
    this.instanced(tiledBox(1, 1, DEPTH), dirt, [...solid, ...tops], 0.5);
    // tampa com o material da superfície do mundo nos blocos do topo
    this.instanced(tiledBox(1.02, 0.18, DEPTH + 0.06), top, tops, 0.05);
    this.instanced(tiledBox(1, 0.22, DEPTH * 0.7), textured(`w${w}_platform`, 0xc89a6a), oneways, 0.11);

    const spike = new THREE.ConeGeometry(0.22, 0.6, 6);
    spike.translate(0, -0.2, 0);
    const steel = new THREE.MeshStandardMaterial({ color: 0xb8b8c8, metalness: 0.4, roughness: 0.4 });
    // seis pontas por bloco: duas por fileira, três fileiras na profundidade
    const points = spikes.flatMap(([c, r]) => [-0.9, 0, 0.9].flatMap((z) => [[c - 0.25, r, z], [c + 0.25, r, z]] as [number, number, number][]));
    this.instanced(spike, steel, points, 0.5);
  }

  /** Um InstancedMesh por tipo de bloco: uma chamada de desenho para a fase inteira. */
  private instanced(geo: THREE.BufferGeometry, mat: THREE.Material, cells: ([number, number] | [number, number, number])[], dy: number) {
    if (!cells.length) return;
    const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
    const o = new THREE.Object3D();
    cells.forEach(([c, r, z = 0], i) => {
      o.position.set(c + 0.5, -(r + dy), z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.castShadow = mesh.receiveShadow = true;
    this.levelRoot.add(mesh);
  }

  /** Artes de fundo do 2D como planos em profundidade: o parallax vem da perspectiva. */
  /**
   * Fundo encostado no fim dos blocos, sem campo vazio no meio: uma faixa curta de chão atrás
   * do caminho, a camada média logo atrás dela e a distante bem longe. Sob a faixa fica a parede
   * do chão, que é o que aparece pelos buracos. O primeiro plano (bg_near) vai na frente de tudo.
   */
  private buildBackdrop(level: LevelData) {
    const w = level.world;
    const span = level.cols + 60, cx = level.cols / 2;
    const floorY = groundLine(level);
    const back = -DEPTH / 2;
    this.backStrip = { floorY, z0: back, z1: back - STRIP };

    const surface = this.texture(`w${w}_ground_top`, true) ?? this.texture(`w${w}_ground`, true);
    const strip = new THREE.Mesh(tiledPlane(span, STRIP), new THREE.MeshStandardMaterial({ map: surface, color: surface ? 0xd8d8d8 : 0x6a5040, roughness: 1 }));
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(cx, floorY, back - STRIP / 2);
    strip.receiveShadow = true;
    this.levelRoot.add(strip);

    const side = this.texture(`w${w}_ground`, true);
    const wallH = floorY + level.rows + 6;
    const wall = new THREE.Mesh(tiledPlane(span, wallH), new THREE.MeshStandardMaterial({ map: side, color: side ? 0x8c8c8c : 0x4a3830, roughness: 1 }));
    wall.position.set(cx, floorY - wallH / 2, back - 0.02);
    this.levelRoot.add(wall);

    // [textura, z, altura, y da base]: a média começa logo abaixo da linha do chão, atrás da faixa
    const layers: [string, number, number, number][] = [
      [`w${w}_bg_far`, -40, 40, -19],
      [`w${w}_bg_mid`, back - STRIP - 0.1, 14, floorY - 0.4],
    ];
    for (const [key, z, h, bottom] of layers) {
      const plane = this.backdropPlane(key, span, h);
      if (!plane) continue;
      plane.position.set(cx, bottom + h / 2, z);
      this.levelRoot.add(plane);
    }

    // primeiro plano na frente dos blocos, só abaixo da linha do chão: emoldura sem cobrir o caminho
    // faixa baixa: a folhagem do bg_near fica na parte de baixo da imagem e precisa cair dentro da tela
    const nearH = 2;
    const near = this.backdropPlane(`w${w}_bg_near`, span, nearH);
    if (near) {
      const m = near.material as THREE.MeshBasicMaterial;
      m.depthTest = false;
      m.depthWrite = false;
      near.renderOrder = 60;
      near.position.set(cx, floorY - 0.3 - nearH / 2, FRONT_Z);
      this.levelRoot.add(near);
    }
  }

  /** Plano com uma arte de fundo repetida na horizontal (cópia própria da textura, liberada com a fase). */
  private backdropPlane(key: string, width: number, height: number) {
    const tex = this.texture(key, true)?.clone();
    if (!tex) return undefined;
    tex.userData.owned = true;
    const img = tex.image as HTMLImageElement;
    tex.repeat.set(width / (height * (img.width / img.height)), 1);
    tex.needsUpdate = true;
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false }));
  }

  // ---------- objetos (lidos do retrato a cada quadro) ----------

  private syncEntities(list: EntityView[], t: number, dt: number) {
    const seen = new Set<object>();
    for (const e of list) {
      let obj = this.entities.get(e.id);
      // forma provisória cujo modelo terminou de baixar: troca, mantendo para onde estava virada
      const pending = obj?.userData.pendingModel as string | undefined;
      if (obj && pending && this.models.isLoaded(pending)) {
        const turned = obj.rotation.y;
        this.entityRoot.remove(obj);
        disposeChildren(obj);
        obj = this.addEntity(e);
        obj.rotation.y = turned;
      }
      obj ??= this.addEntity(e);
      seen.add(e.id);
      obj.visible = e.visible ?? true;
      const shadow = this.shadows.get(e.id);
      if (shadow) this.boards.updateShadow(shadow, e, this.builtFor!);
      if (obj.userData.board && e.sprite) {
        this.boards.update(obj as THREE.Mesh, e.kind, e.sprite);
        continue;
      }
      this.models.animate(obj, e.anim, dt);
      obj.position.set(toUnits(e.x), -toUnits(e.y), 0);
      if (e.facing !== undefined) obj.rotation.y += ((e.facing > 0 ? 0 : Math.PI) - obj.rotation.y) * 0.25;
      if (obj.userData.spin) {
        obj.rotation.y = t * 2;
        obj.position.y += Math.sin(t * 3 + obj.position.x) * 0.06;
      }
      if (e.kind === 'spark') obj.position.z = 0.8; // Faísca voa um pouco à frente de Íris
    }
    // objetos coletados ou destruídos somem; os que voltam (respawn) reaparecem
    for (const [id, obj] of this.entities) {
      if (seen.has(id)) continue;
      obj.visible = false;
      const shadow = this.shadows.get(id);
      if (shadow) shadow.visible = false;
    }
  }

  /**
   * Como desenhar cada objeto, em ordem de preferência: modelo .glb (se o jogo tiver um),
   * a própria arte 2D numa placa (personagens, coletáveis, objetos de fase, decoração)
   * ou uma forma 3D (blocos e caixas, que fazem parte do cenário).
   */
  private addEntity(e: EntityView) {
    const key = modelKey(e);
    let obj = this.models.has(key) ? this.models.instantiate(key, toUnits(e.h)) : undefined;
    if (!obj && e.sprite) obj = this.boards.create();
    if (!obj) {
      obj = createEntity(e, this.entityMats);
      obj.traverse((o) => (o.castShadow = true));
      if (e.kind === 'pickup') obj.userData.spin = true;
    }
    if (this.models.has(key) && !obj.userData.model) obj.userData.pendingModel = key;
    this.entityRoot.add(obj);
    this.entities.set(e.id, obj);
    if (this.boards.hasShadow(e.kind) && !this.shadows.has(e.id)) {
      const shadow = this.boards.createShadow();
      this.entityRoot.add(shadow);
      this.shadows.set(e.id, shadow);
    }
    return obj;
  }

  /** Esvazia os objetos da fase: modelos compartilham geometria com o cache, o resto não. */
  private clearEntities() {
    for (const obj of this.entities.values()) {
      this.models.release(obj);
      this.entityRoot.remove(obj);
      if (!obj.userData.shared) disposeChildren(obj);
    }
    for (const shadow of this.shadows.values()) {
      this.entityRoot.remove(shadow);
      (shadow.material as THREE.Material).dispose(); // a geometria da sombra é compartilhada
    }
    this.entities.clear();
    this.shadows.clear();
  }

  /** Dicas e avisos como placas viradas para a câmera, na frente dos blocos e sempre legíveis. */
  private syncLabels(list: LabelView[]) {
    const seen = new Set<object>();
    for (const l of list) {
      const key = `${l.style}|${l.text}|${l.color ?? ''}`;
      let entry = this.labels.get(l.id);
      if (entry && entry.key !== key) {
        entry.sprite.material.map?.dispose();
        entry.sprite.material.dispose();
        this.labelRoot.remove(entry.sprite);
        entry = undefined;
      }
      if (!entry) {
        entry = { sprite: createLabel(l), key };
        this.labelRoot.add(entry.sprite);
        this.labels.set(l.id, entry);
      }
      seen.add(l.id);
      const s = entry.sprite;
      s.visible = true;
      s.position.set(toUnits(l.x), -toUnits(l.y), DEPTH / 2 + 0.2);
      s.material.opacity = l.alpha;
      const base = s.userData.size as { w: number; h: number };
      s.scale.set(base.w * l.scale, base.h * l.scale, 1);
    }
    for (const [id, e] of this.labels) if (!seen.has(id)) e.sprite.visible = false;
  }
}

/** Desenha o texto num canvas, no mesmo tamanho em px que o 2D (64 px = 1 unidade). */
function createLabel(l: LabelView): THREE.Sprite {
  const hint = l.style === 'hint';
  const font = hint ? '21px "Trebuchet MS", "Segoe UI", sans-serif' : 'bold 24px "Trebuchet MS", sans-serif';
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = font;
  const lines = hint ? wrapText(ctx, l.text, 420) : [l.text];
  const lineH = hint ? 26 : 30;
  const textW = Math.max(...lines.map((s) => ctx.measureText(s).width));
  const w = Math.ceil(textW + (hint ? 60 : 16)), h = Math.ceil(lines.length * lineH + (hint ? 18 : 10));
  const ss = 2; // supersampling para o texto não borrar
  ctx.canvas.width = w * ss;
  ctx.canvas.height = h * ss;
  ctx.scale(ss, ss);
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const cx = hint ? w / 2 + 6 : w / 2;
  if (hint) {
    // balão igual ao do 2D: fundo translúcido arredondado, contorno leve e estrelinha
    const r = h / 2;
    ctx.beginPath();
    ctx.roundRect(1, 1, w - 2, h - 2, r);
    ctx.fillStyle = 'rgba(42,22,64,0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffd9f4';
    ctx.font = '14px sans-serif';
    ctx.fillText('✦', 16, h / 2);
    ctx.font = font;
  }
  lines.forEach((line, i) => {
    const y = h / 2 + (i - (lines.length - 1) / 2) * lineH;
    if (!hint) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#24133a';
      ctx.strokeText(line, cx, y);
    }
    ctx.fillStyle = hint ? '#fff6ec' : (l.color ?? '#ffffff');
    ctx.fillText(line, cx, y);
  });
  const tex = new THREE.CanvasTexture(ctx.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.owned = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false }));
  sprite.renderOrder = 200;
  sprite.userData.size = { w: toUnits(w), h: toUnits(h) };
  return sprite;
}

/** Quebra o texto em linhas de até `max` px (equivalente ao wordWrap do 2D). */
function wrapText(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > max) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

const mat = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const glow = (color: THREE.ColorRepresentation, intensity = 0.5) => mat(color, { emissive: color, emissiveIntensity: intensity });

/** Forma de cada tipo de objeto. Provisórias: os modelos .glb substituem estas formas. */
/** Profundidade da faixa de chão atrás do caminho, antes da camada média do fundo. */
const STRIP = 2.2;
/** Onde fica o primeiro plano: logo na frente da face dos blocos (z = +1,5). */
const FRONT_Z = 2.1;

/** Altura mais comum do topo do chão na fase (em unidades 3D): onde o fundo encosta. */
function groundLine(level: LevelData) {
  const count = new Map<number, number>();
  for (let c = 0; c < level.cols; c++) {
    const r = level.tiles.findIndex((row) => row[c] === T.Solid);
    if (r >= 0) count.set(r, (count.get(r) ?? 0) + 1);
  }
  const best = [...count].sort((a, b) => b[1] - a[1])[0];
  return -(best ? best[0] : level.rows - 2);
}

/** Plano com UVs em unidades do mundo (a textura repete uma vez por unidade). */
function tiledPlane(w: number, h: number) {
  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  return geo;
}

interface EntityMaterials {
  platform?: THREE.Material;
  breakable?: THREE.Material;
  crate?: THREE.Material;
}

/** Caixa com UVs em unidades do mundo: a textura repete uma vez por bloco em cada face, sem esticar. */
function tiledBox(w: number, h: number, d: number) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  // faces na ordem +x, -x, +y, -y, +z, -z; cada uma com 4 vértices (u ao longo da largura, v da altura)
  const size: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  size.forEach(([su, sv], f) => {
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  });
  return geo;
}

/** Sorteio fixo por fase (mulberry32 com semente do id da fase). */
function seeded(id: string) {
  let a = [...id].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 2654435761), 1779033703) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createEntity(e: EntityView, mats: EntityMaterials): THREE.Object3D {
  const w = toUnits(e.w), h = toUnits(e.h);
  const size = Math.max(w, h);
  switch (e.kind) {
    case 'player': {
      // Íris: cápsula + echarpe; a pontinha amarela mostra para onde está virada
      const g = new THREE.Group();
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(w * 0.45, 0.07, 8, 20), glow(RAINBOW[0], 0.3));
      scarf.rotation.x = Math.PI / 2;
      scarf.position.y = h * 0.22;
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), mat(RAINBOW[2]));
      nose.rotation.z = -Math.PI / 2;
      nose.position.set(w * 0.55, h * 0.3, 0);
      g.add(new THREE.Mesh(new THREE.CapsuleGeometry(w / 2, h - w, 6, 16), mat(RAINBOW[6])), scarf, nose);
      return g;
    }
    case 'spark':
      return new THREE.Mesh(new THREE.OctahedronGeometry(0.18), glow(0xffffff, 1.2));
    case 'enemy':
      return new THREE.Mesh(new THREE.IcosahedronGeometry(size * 0.55, 1), mat(0x6b6b7a, { flatShading: true }));
    case 'boss':
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, Math.max(1.5, w)), mat(0x50506a, { flatShading: true }));
    case 'pickup':
      return e.variant === 'coin'
        ? new THREE.Mesh(new THREE.CylinderGeometry(size * 0.45, size * 0.45, 0.08, 20).rotateX(Math.PI / 2), glow(0xffd93d, 0.4))
        : e.variant === 'heart'
          ? new THREE.Mesh(new THREE.SphereGeometry(size * 0.45, 16, 12), glow(RAINBOW[0], 0.4))
          : new THREE.Mesh(new THREE.OctahedronGeometry(size * 0.5), glow(RAINBOW[4], 0.6));
    case 'crate':
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mats.crate ?? mat(0xa0703c));
    case 'cracked':
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, DEPTH), mats.breakable ?? mat(0x8a7a8a, { flatShading: true }));
    case 'shot':
      return new THREE.Mesh(new THREE.SphereGeometry(size * 0.5, 12, 8), glow(0xffffff, 0.8));
    case 'mover':
      return new THREE.Mesh(tiledBox(w, Math.max(h, 0.25), DEPTH * 0.7), mats.platform ?? mat(0xe0b070));
    case 'prop':
      if (e.variant === 'checkpoint') {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h), mat(0xdddddd));
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.04), glow(RAINBOW[3], 0.3));
        flag.position.set(0.27, h / 2 - 0.2, 0);
        g.add(pole, flag);
        return g;
      }
      if (e.variant === 'exit') return new THREE.Mesh(new THREE.TorusGeometry(size * 0.45, 0.12, 10, 32), glow(RAINBOW[5], 0.8));
      if (e.variant === 'spring') return new THREE.Mesh(new THREE.CylinderGeometry(w * 0.4, w * 0.5, h, 16), mat(RAINBOW[1]));
      break;
    case 'cage':
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat(0xcccccc, { wireframe: true }));
  }
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), mat(0xffffff, { wireframe: true, transparent: true, opacity: 0.4 }));
}

/** Libera da GPU tudo que estava no grupo (geometrias, materiais e texturas próprias). */
function disposeChildren(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!(o instanceof THREE.Sprite)) m.geometry?.dispose(); // sprites compartilham uma geometria única
    for (const material of [m.material].flat()) {
      if (!material) continue;
      const map = (material as THREE.MeshBasicMaterial).map;
      if (map && map.userData.owned) map.dispose();
      material.dispose();
    }
  });
  root.clear();
}
