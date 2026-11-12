import Phaser from 'phaser';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { F, has } from './art';
import { gfx } from '../systems/Settings';

// Desenho do terreno (só a parte visual; a colisão continua em GameScene.buildTiles).
//
// Com a arte do mundo carregada, o terreno deixa de ser uma textura pequena ladrilhada:
//  - o interior usa uma textura grande montada no navegador a partir da textura do mundo
//    (faixas deslocadas, remendos e manchas de tom), então o desenho só se repete a cada ~1000 px;
//  - o topo usa uma faixa longa com peças espelhadas e tufos fora de ritmo;
//  - blocos soltos de 1 bloco de altura viram ilhas (peças floatSmall/floatMid do kit);
//  - blocos suspensos mais grossos ganham raízes na parte de baixo;
//  - sombras de volume: sob a grama, nas paredes expostas, na parte de baixo e conforme a profundidade;
//  - blocos suspensos projetam sombra no chão logo abaixo.

/** Peças do kit de terreno parte 2 (`wN_tiles2`): paredes, parte de baixo e variações de topo. */
const K2 = { wallL: 0, wallR: 1, cornerL: 2, cornerR: 3, under: 4, underL: 5, underR: 6, under2: 7, top2: 8, top3: 9, slopeUp: 10, slopeDown: 11 } as const;

/** A arte do chão é 3D: os pés pisam DENTRO da face de cima do bloco, não na borda. */
export const SINK = 14;

const VAR_W = 2048; // largura das texturas montadas (em px de textura; a arte vem em 2x)
const GROUND_VAR_H = 1024;

export interface TerrainLayers {
  fills: Phaser.GameObjects.Container;
  decor: Phaser.GameObjects.Container;
  tops: Phaser.GameObjects.Container;
}

/** Gerador com semente: a mesma fase (ou mundo) sempre fica igual. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function scratch(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d')! };
}

/** Desenha `img` em (x, y) e nas cópias que atravessam as bordas, para a textura continuar sem emenda. */
function wrapDraw(g: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, w: number, h: number, W: number, H: number) {
  for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) {
    if (x + dx + w <= 0 || x + dx >= W || y + dy + h <= 0 || y + dy >= H) continue;
    g.drawImage(img, x + dx, y + dy, w, h);
  }
}

/**
 * Textura grande do interior do chão. A textura do mundo (256 px) tem camadas horizontais;
 * aqui cada camada entra com deslocamento e espelhamento próprios, remendos de outras partes
 * quebram as linhas retas e manchas largas variam o tom.
 */
function ensureGroundVar(scene: Phaser.Scene, src: string, world: number): string {
  const key = `${src}_var`;
  if (scene.textures.exists(key)) return key;
  const img = scene.textures.get(src).getSourceImage() as HTMLImageElement;
  const S = img.width, SH = img.height;
  const W = VAR_W, H = GROUND_VAR_H;
  const tex = scene.textures.createCanvas(key, W, H);
  if (!tex) return src;
  const g = tex.getContext();
  const r = seeded(world * 7919 + 13);

  // 1) camadas: um ciclo da textura por vez, em escalas diferentes (pedras miúdas e graúdas),
  //    cada camada com deslocamento/espelho próprios
  const cycle = SH / 2, feather = 14;
  const { c: tall, g: tg } = scratch(S, SH * 2); // a textura empilhada duas vezes: leitura sem quebra
  tg.drawImage(img, 0, 0);
  tg.drawImage(img, 0, SH);
  const scales = [1, 1.5, 1, 2, 1, 1.5];
  const { c: bc, g: bg } = scratch(W, cycle * 2 + feather);
  let y0 = 0;
  for (let b = 0; y0 < H; b++) {
    const k = scales[b % scales.length];
    const bh = cycle * k, bw = S * k;
    const sy = SH - feather / k + (r() < 0.5 ? 0 : cycle);
    const ox = Math.floor(r() * bw), flip = r() < 0.5;
    bg.globalCompositeOperation = 'source-over';
    bg.clearRect(0, 0, W, cycle * 2 + feather);
    bg.save();
    if (flip) { bg.translate(W, 0); bg.scale(-1, 1); }
    // a camada começa `feather` px antes (emenda suave com a de cima)
    for (let x = -ox; x < W; x += bw) bg.drawImage(tall, 0, sy, S, cycle + feather / k, x, 0, bw, bh + feather);
    bg.restore();
    // máscara única (destination-in apaga tudo fora da forma desenhada)
    const m = bg.createLinearGradient(0, 0, 0, bh + feather);
    m.addColorStop(0, 'rgba(0,0,0,0)');
    m.addColorStop(feather / (bh + feather), 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,1)');
    bg.globalCompositeOperation = 'destination-in';
    bg.fillStyle = m;
    bg.fillRect(0, 0, W, bh + feather);
    g.save();
    g.beginPath();
    for (const dy of [0, H]) g.rect(0, y0 - feather + dy, W, bh + feather);
    g.clip();
    for (const dy of [0, H]) g.drawImage(bc, 0, y0 - feather + dy);
    g.restore();
    y0 += bh;
  }

  // 2) remendos: pedaços de outras partes da textura, com borda esfumada
  for (let i = 0; i < 34; i++) {
    const s = 96 + Math.floor(r() * 110);
    const { c: pc, g: pg } = scratch(s, s);
    const sx = Math.floor(r() * S), sy = Math.floor(r() * SH);
    for (const dx of [0, S]) for (const dy of [0, SH]) pg.drawImage(img, dx - sx, dy - sy);
    const m = pg.createRadialGradient(s / 2, s / 2, s * 0.18, s / 2, s / 2, s / 2);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    pg.globalCompositeOperation = 'destination-in';
    pg.fillStyle = m;
    pg.fillRect(0, 0, s, s);
    g.globalAlpha = 0.9;
    wrapDraw(g, pc, Math.floor(r() * W), Math.floor(r() * H), s * (0.9 + r() * 0.5), s * (0.7 + r() * 0.4), W, H);
  }
  g.globalAlpha = 1;

  // 3) manchas largas de tom (claras e escuras)
  for (let i = 0; i < 18; i++) {
    const rad = 170 + r() * 300;
    const { c: pc, g: pg } = scratch(64, 64);
    const dark = r() < 0.62;
    const m = pg.createRadialGradient(32, 32, 0, 32, 32, 32);
    m.addColorStop(0, dark ? `rgba(20,8,24,${0.16 + r() * 0.12})` : `rgba(255,240,220,${0.07 + r() * 0.07})`);
    m.addColorStop(1, dark ? 'rgba(20,8,24,0)' : 'rgba(255,240,220,0)');
    pg.fillStyle = m;
    pg.fillRect(0, 0, 64, 64);
    wrapDraw(g, pc, r() * W, r() * H, rad * 2, rad * (1 + r() * 0.6), W, H);
  }
  tex.refresh();
  return key;
}

/**
 * Interior do chão a partir da textura larga pintada (`wN_ground_wide`, 2048x1024). As bordas
 * recebem uma faixa de transição com a borda oposta, para a emenda sumir mesmo quando a
 * imagem não fecha perfeitamente ao repetir.
 */
function ensureGroundWide(scene: Phaser.Scene, src: string): string {
  const key = `${src}_tile`;
  if (scene.textures.exists(key)) return key;
  const img = scene.textures.get(src).getSourceImage() as HTMLImageElement;
  const W = img.width, H = img.height, band = 56;
  const tex = scene.textures.createCanvas(key, W, H);
  if (!tex) return src;
  const g = tex.getContext();
  g.drawImage(img, 0, 0);
  const fade = (horizontal: boolean) => {
    const { c, g: f } = scratch(horizontal ? band : W, horizontal ? H : band);
    if (horizontal) f.drawImage(tex.getSourceImage() as CanvasImageSource, 0, 0, band, H, 0, 0, band, H);
    else f.drawImage(tex.getSourceImage() as CanvasImageSource, 0, 0, W, band, 0, 0, W, band);
    const m = horizontal ? f.createLinearGradient(0, 0, band, 0) : f.createLinearGradient(0, 0, 0, band);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    f.globalCompositeOperation = 'destination-in';
    f.fillStyle = m;
    f.fillRect(0, 0, c.width, c.height);
    // o começo da imagem, espelhado sobre o fim dela: na emenda os dois lados ficam idênticos
    g.save();
    if (horizontal) { g.translate(W, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); }
    else { g.translate(0, H); g.scale(1, -1); g.drawImage(c, 0, 0); }
    g.restore();
  };
  fade(true);
  fade(false);
  tex.refresh();
  return key;
}

/** Faixa longa do topo: peças espelhadas ao acaso, tom variando de leve e tufos fora de ritmo. */
function ensureStripVar(scene: Phaser.Scene, src: string, world: number, kit2 = ''): string {
  const key = `${src}_var`;
  if (scene.textures.exists(key)) return key;
  const img = scene.textures.get(src).getSourceImage() as HTMLImageElement;
  const S = img.width, h = img.height;
  const W = Math.floor(VAR_W / S) * S;
  const tex = scene.textures.createCanvas(key, W, h);
  if (!tex) return src;
  const g = tex.getContext();
  const r = seeded(world * 104729 + 5);
  // variações pintadas do topo (kit parte 2), alinhadas pela linha da superfície da peça original
  const base = scene.textures.getFrame(`w${world}_tiles`, String(F.w1Tiles.top));
  const baseLine = (base.customPivot ? base.pivotY : 0) * base.height;
  const variants = kit2 ? [K2.top2, K2.top3].map((n) => scene.textures.getFrame(kit2, String(n))) : [];
  for (let x = 0; x < W; x += S) {
    const pickV = variants.length && r() < 0.6 ? variants[Math.floor(r() * variants.length)] : null;
    g.save();
    const flip = r() < 0.5;
    if (flip) { g.translate(x + S, 0); g.scale(-1, 1); } else g.translate(x, 0);
    if (pickV) {
      const k = S / pickV.cutWidth;
      const line = (pickV.customPivot ? pickV.pivotY : 0) * pickV.cutHeight * k;
      g.drawImage(pickV.source.image as CanvasImageSource, pickV.cutX, pickV.cutY, pickV.cutWidth, pickV.cutHeight, 0, baseLine - line, S, pickV.cutHeight * k);
    } else g.drawImage(img, 0, 0);
    g.restore();
  }
  // tufos: recortes da própria faixa em posições e alturas irregulares
  for (let i = 0; i < 56; i++) {
    const pw = 48 + Math.floor(r() * 64);
    const { c: pc, g: pg } = scratch(pw, h);
    const sx = Math.floor(r() * (S - 1));
    pg.drawImage(img, -sx, 0);
    pg.drawImage(img, S - sx, 0);
    const m = pg.createLinearGradient(0, 0, pw, 0);
    m.addColorStop(0, 'rgba(0,0,0,0)');
    m.addColorStop(0.35, 'rgba(0,0,0,1)');
    m.addColorStop(0.65, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    pg.globalCompositeOperation = 'destination-in';
    pg.fillStyle = m;
    pg.fillRect(0, 0, pw, h);
    const x = Math.floor(r() * W), dy = Math.round(-3 + r() * 7);
    for (const dx of [-W, 0, W]) g.drawImage(pc, x + dx, dy);
  }
  // tom: trechos um pouco mais claros ou mais escuros, só sobre o que já está pintado
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 12; i++) {
    const x = r() * W, w = 120 + r() * 260;
    const m = g.createLinearGradient(x, 0, x + w, 0);
    const col = r() < 0.5 ? '20,8,24' : '255,244,220';
    const a = 0.05 + r() * 0.07;
    m.addColorStop(0, `rgba(${col},0)`);
    m.addColorStop(0.5, `rgba(${col},${a})`);
    m.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = m;
    for (const dx of [-W, 0, W]) { g.save(); g.translate(dx, 0); g.fillRect(x, 0, w, h); g.restore(); }
  }
  g.globalCompositeOperation = 'source-over';
  tex.refresh();
  return key;
}

/**
 * Paredes expostas: as peças de parede do kit 2 viram texturas próprias que somem em direção
 * ao interior do bloco, para se fundirem com a textura do chão em vez de formar uma coluna dura.
 */
function ensureWalls(scene: Phaser.Scene, kit2: string) {
  for (const [name, frame, outerLeft] of [['wallL', K2.wallL, true], ['wallR', K2.wallR, false]] as const) {
    const key = `${kit2}_${name}`;
    if (scene.textures.exists(key)) continue;
    const f = scene.textures.getFrame(kit2, String(frame));
    const tex = scene.textures.createCanvas(key, 138, 132);
    if (!tex) continue;
    const g = tex.getContext();
    g.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, 138, 132);
    const m = g.createLinearGradient(outerLeft ? 0 : 138, 0, outerLeft ? 138 : 0, 0);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(0.42, 'rgba(0,0,0,1)');
    m.addColorStop(0.92, 'rgba(0,0,0,0)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = m;
    g.fillRect(0, 0, 138, 132);
    tex.refresh();
  }
}

/** Sombra macia (elipse) usada no chão: blocos suspensos, Íris e criaturas. */
export function ensureSoftShadow(scene: Phaser.Scene) {
  if (scene.textures.exists('soft_shadow')) return;
  const tex = scene.textures.createCanvas('soft_shadow', 128, 32);
  if (!tex) return;
  const g = tex.getContext();
  g.save();
  g.scale(1, 0.25);
  const m = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  m.addColorStop(0, 'rgba(18,8,26,0.9)');
  m.addColorStop(0.55, 'rgba(18,8,26,0.45)');
  m.addColorStop(1, 'rgba(18,8,26,0)');
  g.fillStyle = m;
  g.fillRect(0, 0, 128, 128);
  g.restore();
  tex.refresh();
}

export function buildTerrain(scene: Phaser.Scene, level: LevelData, world: Phaser.GameObjects.Container): TerrainLayers {
  const { rows, cols, tiles } = level;
  const tx = (name: string) => `w${level.world}_${name}`;
  const art = has(scene, tx('tiles'));
  const fills = scene.add.container(0, 0);
  const shade = scene.add.graphics();
  const walls = scene.add.container(0, 0);
  const decals = scene.add.container(0, 0);
  const under = scene.add.container(0, 0);
  const decor = scene.add.container(0, 0);
  const tops = scene.add.container(0, 0);
  const shadows = scene.add.container(0, 0);
  // raízes atrás do interior; sombras de volume por cima dele; decoração atrás da grama do topo
  world.add([under, fills, decals, walls, shade, decor, tops, shadows]);
  if (level.arena && has(scene, level.arena)) {
    // na arena o piso já está desenhado no fundo; só a colisão importa
    for (const l of [under, fills, decals, walls, shade, tops, shadows]) l.setVisible(false);
    return { fills, decor, tops };
  }

  const tileAt = (c: number, r: number): T => {
    if (c < 0 || c >= cols) return T.Solid; // bordas laterais contam como parede
    if (r < 0 || r >= rows) return T.Empty;
    return tiles[r][c];
  };
  const solid = (c: number, r: number) => tileAt(c, r) === T.Solid;

  // ---------- sem arte: blocos provisórios, como antes ----------
  if (!art) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (tiles[r][c] !== T.Solid) continue;
      const top = !solid(c, r - 1);
      (top ? tops : fills).add(scene.add.image(c * TILE, r * TILE, top ? 'tile_top' : 'tile_fill').setOrigin(0));
    }
    return { fills, decor, tops };
  }

  const tilesKey = tx('tiles');
  const hasStrip = has(scene, tx('tiles_strip'));
  const kit2 = has(scene, tx('tiles2')) ? tx('tiles2') : '';
  const stripKey = hasStrip ? ensureStripVar(scene, tx('tiles_strip'), level.world, kit2) : '';
  const groundKey = has(scene, tx('ground_wide')) ? ensureGroundWide(scene, tx('ground_wide'))
    : has(scene, tx('ground')) ? ensureGroundVar(scene, tx('ground'), level.world) : '';
  const decalsKey = gfx().decals && has(scene, tx('decals')) ? tx('decals') : '';
  if (kit2) ensureWalls(scene, kit2);
  ensureSoftShadow(scene);
  const rnd = seeded(hash(level.id));

  const surface = (frame: number) => {
    const f = scene.textures.getFrame(tilesKey, String(frame));
    return { pivotY: f.customPivot ? f.pivotY : 0, h: f.height / 2, w: f.width / 2 };
  };
  const capAt = (c: number, y: number, frame: number) => {
    const s = surface(frame);
    tops.add(scene.add.image(c * TILE + TILE / 2, y - SINK, tilesKey, String(frame)).setOrigin(0.5, s.pivotY).setScale(0.5));
  };

  // ---------- ilhas: trechos soltos de 1 bloco de altura, abertos dos dois lados ----------
  const islet: boolean[][] = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
  /** Peças de ilha lado a lado cobrindo as colunas c0..c1 (superfície na linha física `y`). */
  const islandRun = (c0: number, c1: number, y: number, into: Phaser.GameObjects.Container, drop = 4) => {
    const len = c1 - c0 + 1;
    const total = len * TILE + 16;
    const n = len === 1 ? 1 : Math.max(1, Math.round(len / 2.4));
    const overlap = n > 1 ? 18 : 0;
    const each = (total + overlap * (n - 1)) / n;
    const frame = len === 1 ? F.w1Tiles.floatSmall : F.w1Tiles.floatMid;
    const s = surface(frame);
    for (let i = 0; i < n; i++) {
      const cx = c0 * TILE - 8 + each / 2 + i * (each - overlap);
      const img = scene.add.image(cx, y + drop, tilesKey, String(frame)).setOrigin(0.5, s.pivotY);
      img.setScale(each / (s.w * 2));
      // altura mínima: a peça precisa cobrir o bloco físico de 64 px
      const below = img.displayHeight * (1 - s.pivotY);
      if (below < TILE - drop + 6) img.scaleY *= (TILE - drop + 6) / below;
      if (n > 1 && rnd() < 0.5) img.setFlipX(true);
      into.add(img);
    }
  };
  for (let r = 0; r < rows; r++) {
    let start = -1;
    for (let c = 0; c <= cols; c++) {
      const lone = c < cols && tiles[r][c] === T.Solid && !solid(c, r - 1) && !solid(c, r + 1);
      if (lone && start < 0) start = c;
      if (!lone && start >= 0) {
        const c0 = start, c1 = c - 1;
        start = -1;
        // precisa estar aberto nas duas pontas (senão é uma saliência de parede: desenho comum)
        if (c0 === 0 || c1 === cols - 1 || solid(c0 - 1, r) || solid(c1 + 1, r)) continue;
        for (let i = c0; i <= c1; i++) islet[r][i] = true;
        islandRun(c0, c1, r * TILE, tops);
      }
    }
  }
  const block = (c: number, r: number) => solid(c, r) && !(r >= 0 && r < rows && c >= 0 && c < cols && islet[r][c]);

  /** Trecho contínuo de topo de chão (colunas c0..c1): faixa sem emendas e cantos nas pontas abertas. */
  const drawTopRun = (c0: number, c1: number, y: number) => {
    const row = Math.floor(y / TILE);
    const openL = !solid(c0 - 1, row), openR = !solid(c1 + 1, row);
    if (hasStrip) {
      const s = surface(F.w1Tiles.top);
      const ts = scene.add.tileSprite(c0 * TILE, y - SINK - s.pivotY * s.h, (c1 - c0 + 1) * TILE, s.h, stripKey);
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

  // profundidade de cada bloco abaixo da superfície (0 = bloco do topo)
  const depth: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) depth[r][c] = block(c, r) ? (r > 0 && block(c, r - 1) ? depth[r - 1][c] + 1 : 0) : 0;
  const depthA = (d: number) => Math.min(0.46, d * 0.085);

  for (let r = 0; r < rows; r++) {
    const y = r * TILE;
    let fillStart = -1, fillTop = false, topStart = -1, depStart = -1, depVal = -1, botStart = -1;
    for (let c = 0; c <= cols; c++) {
      const b = c < cols && block(c, r);
      const top = b && !solid(c, r - 1);

      if (top && topStart < 0) topStart = c;
      if (!top && topStart >= 0) { drawTopRun(topStart, c - 1, y); topStart = -1; }

      // interior: textura contínua em faixas. Nas linhas de topo ela começa um pouco abaixo,
      // escondida atrás da peça de topo (sem buraco entre as duas).
      if (fillStart >= 0 && (!b || top !== fillTop)) {
        const fx = fillStart * TILE, w = (c - fillStart) * TILE;
        const fy = fillTop ? y + 24 : y;
        if (groundKey) fills.add(scene.add.tileSprite(fx, fy, w, y + TILE - fy, groundKey).setOrigin(0).setTileScale(0.5).setTilePosition(fx * 2, fy * 2));
        else for (let i = fillStart; i < c; i++) fills.add(scene.add.image(i * TILE, y, 'tile_fill').setOrigin(0));
        if (fillTop) {
          // sombra da grama sobre a terra logo abaixo dela
          shade.fillGradientStyle(0x140818, 0x140818, 0x140818, 0x140818, 0.42, 0.42, 0, 0);
          shade.fillRect(fx, fy, w, 30);
        }
        fillStart = -1;
      }
      if (b && fillStart < 0) { fillStart = c; fillTop = top; }

      // escurece com a profundidade (trechos de mesma profundidade de uma vez)
      const d = b ? depth[r][c] : -1;
      if (depStart >= 0 && d !== depVal) {
        if (depVal > 0) {
          shade.fillGradientStyle(0x140818, 0x140818, 0x140818, 0x140818, depthA(depVal - 0.5), depthA(depVal - 0.5), depthA(depVal + 0.5), depthA(depVal + 0.5));
          shade.fillRect(depStart * TILE, y, (c - depStart) * TILE, TILE);
        }
        depStart = -1;
      }
      if (b && depStart < 0) { depStart = c; depVal = d; }

      // paredes expostas: a lateral escurece em direção à borda (volume)
      if (b && c > 0 && !solid(c - 1, r)) {
        if (kit2 && !top) walls.add(scene.add.image(c * TILE - 5, y - 1, `${kit2}_wallL`).setOrigin(0).setDisplaySize(TILE + 5, TILE + 2));
        shade.fillGradientStyle(0x140818, 0x140818, 0x140818, 0x140818, kit2 ? 0.22 : 0.4, 0, kit2 ? 0.22 : 0.4, 0);
        shade.fillRect(c * TILE, top ? y + 24 : y, 20, top ? TILE - 24 : TILE);
      }
      if (b && c < cols - 1 && !solid(c + 1, r)) {
        if (kit2 && !top) walls.add(scene.add.image(c * TILE, y - 1, `${kit2}_wallR`).setOrigin(0).setDisplaySize(TILE + 5, TILE + 2));
        shade.fillGradientStyle(0x140818, 0x140818, 0x140818, 0x140818, 0, kit2 ? 0.22 : 0.4, 0, kit2 ? 0.22 : 0.4);
        shade.fillRect(c * TILE + TILE - 20, top ? y + 24 : y, 20, top ? TILE - 24 : TILE);
      }

      // parte de baixo exposta: sombra, raízes pendendo e sombra projetada no chão
      const bottom = b && r < rows - 1 && !solid(c, r + 1);
      if (bottom && botStart < 0) botStart = c;
      if (!bottom && botStart >= 0) {
        const c0 = botStart, c1 = c - 1;
        botStart = -1;
        shade.fillGradientStyle(0x140818, 0x140818, 0x140818, 0x140818, 0, 0, 0.5, 0.5);
        shade.fillRect(c0 * TILE, y + TILE - 22, (c1 - c0 + 1) * TILE, 22);
        if (kit2) {
          // parte de baixo pintada: uma peça por bloco, com pontas onde o trecho termina no ar
          for (let i = c0; i <= c1; i++) {
            const endL = i === c0 && !solid(c0 - 1, r), endR = i === c1 && !solid(c1 + 1, r);
            const frame = endL && !endR ? K2.underL : endR && !endL ? K2.underR : rnd() < 0.5 ? K2.under : K2.under2;
            const img = scene.add.image(i * TILE + TILE / 2, y + TILE - 12, kit2, String(frame)).setOrigin(0.5, 0);
            img.setScale((TILE + 8) / img.width);
            under.add(img);
          }
        } else {
          // raízes: peças de ilha atrás do bloco, só a ponta de baixo aparece
          const before = under.length;
          islandRun(c0, c1, y, under, 30);
          for (const o of under.list.slice(before) as Phaser.GameObjects.Image[]) o.setTint(0xb8a8b8);
        }
        castShadow(c0, c1, r);
      }
    }
  }
  // decalques: pedras, raízes e relíquias espalhados pelo interior, longe das bordas, com a semente da fase
  if (decalsKey) {
    const inner = (c: number, r: number) => block(c, r) && depth[r][c] >= 1 && block(c - 1, r) && block(c + 1, r) && (r === rows - 1 || block(c, r + 1));
    const taken = new Set<number>();
    for (let r = 1; r < rows; r++) for (let c = 1; c < cols - 1; c++) {
      if (!inner(c, r) || rnd() > 0.085) continue;
      if ([-2, -1, 0, 1, 2].some((d) => taken.has(r * 1000 + c + d) || taken.has((r - 1) * 1000 + c + d))) continue;
      taken.add(r * 1000 + c);
      const img = scene.add.image(c * TILE + TILE / 2 + (rnd() - 0.5) * 20, r * TILE + TILE / 2 + (rnd() - 0.5) * 12, decalsKey, String(Math.floor(rnd() * 8)));
      img.setScale(0.5 * (0.62 + rnd() * 0.3)).setFlipX(rnd() < 0.5).setAlpha(0.92);
      // não deixa o decalque vazar para fora do chão em blocos estreitos
      if (!block(c, r - 1) || !inner(c - 1, r) || !inner(c + 1, r)) img.setScale(img.scaleX * 0.72);
      decals.add(img);
    }
  }

  // ilhas também projetam sombra
  for (let r = 0; r < rows; r++) {
    let start = -1;
    for (let c = 0; c <= cols; c++) {
      const on = c < cols && islet[r][c];
      if (on && start < 0) start = c;
      if (!on && start >= 0) { castShadow(start, c - 1, r); start = -1; }
    }
  }

  /** Sombra macia no chão logo abaixo do trecho c0..c1 (linha `r`), se houver chão contínuo perto. */
  function castShadow(c0: number, c1: number, r: number) {
    let ground = -1;
    for (let rr = r + 2; rr <= Math.min(rows - 1, r + 7); rr++) if (solid(c0, rr)) { ground = rr; break; }
    if (ground < 0) return;
    for (let c = c0; c <= c1; c++) {
      if (!solid(c, ground) || solid(c, ground - 1)) return; // chão irregular: sem sombra
      for (let rr = r + 1; rr < ground; rr++) if (tileAt(c, rr) !== T.Empty) return;
    }
    const w = (c1 - c0 + 1) * TILE;
    const gap = ground - r - 1;
    const img = scene.add.image(c0 * TILE + w / 2, ground * TILE - SINK + 10, 'soft_shadow');
    img.setDisplaySize(w * (1.05 - gap * 0.04), 26).setAlpha(0.5 - gap * 0.05);
    shadows.add(img);
  }

  return { fills, decor, tops };
}
