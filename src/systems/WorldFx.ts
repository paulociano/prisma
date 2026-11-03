import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import type { Ambient, Box } from './Ambient';

// Receitas de efeitos ambientes de cada cenário: o que se move em cada mundo, e onde.
// Os pontos vêm da própria arte (medidos nas ilustrações), então água, cachoeiras e fumaça nascem
// exatamente onde a imagem os desenha. Nada aqui cria arquivos: tudo usa `Ambient`.

type Pair = [number, number];
type Layer = Phaser.GameObjects.TileSprite;

// ---------- mapas (ilustração 1536x1024 ocupando a largura da tela) ----------
// Os pontos abaixo estão em "unidades de miniatura" (1024x683), mais fáceis de ler na imagem.

const K = GAME_W / 1024;
const Y0 = GAME_H / 2 - (683 * K) / 2;
const X = (x: number) => x * K;
const Yv = (y: number) => y * K + Y0;
const pt = (x: number, y: number): Pair => [X(x), Yv(y)];
const pts = (list: Pair[]): Pair[] => list.map(([x, y]) => pt(x, y));
const box = (x: number, y: number, w: number, h: number): Box => ({ x: X(x), y: Yv(y), w: w * K, h: h * K });
const fall = (a: Ambient, x: number, y0: number, y1: number, w: number, alpha = 0.55) =>
  a.waterfall({ x: X(x), y: Yv(y0), w: w * K, h: (y1 - y0) * K, alpha });

/** Estrelas espalhadas, sempre as mesmas (sorteio fixo) para o céu não "pular" ao reabrir a tela. */
function scatter(area: Box, n: number, seed = 7): Pair[] {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => [area.x + r() * area.w, area.y + r() * area.h] as Pair);
}

/** Mapa-múndi (os sete mundos juntos). */
export function overviewFx(a: Ambient) {
  if (!a.on) return;
  // nuvens que sobem e descem na frente das ilhas
  a.puffs({ area: box(0, 500, 1024, 183), count: 9, size: [220, 360], alpha: 0.4, drift: 90, tint: 0xfff0ff });
  a.puffs({ area: box(0, 0, 1024, 90), count: 5, size: [200, 320], alpha: 0.22, drift: 70, tint: 0xfff0e8 });
  a.fogBand({ y: Yv(560), h: 220, speed: 7, alpha: 0.32, tint: 0xfff4ff });
  // cachoeiras
  fall(a, 245, 520, 625, 34);
  fall(a, 305, 415, 482, 20);
  fall(a, 548, 170, 205, 18);
  fall(a, 533, 245, 292, 16);
  fall(a, 597, 418, 472, 28);
  fall(a, 620, 442, 500, 24);
  fall(a, 708, 130, 182, 14, 0.6);
  // fonte termal do cânion e sol
  a.steam({ x: X(214), y: Yv(248), w: 40, size: 60, alpha: 0.4 });
  a.pulse({ x: X(135), y: Yv(95), size: 220, tint: 0xffe6a8, min: 0.3, max: 0.65, period: 4 });
  a.sunRays({ x: X(135), y: Yv(95), count: 5, len: 340, spread: 80, facing: -55, alpha: 0.2 });
  // lagoa turquesa
  a.glitter({ area: box(690, 300, 190, 110), rate: 110 });
  a.ripples({ points: pts([[740, 345], [800, 372], [852, 330]]), size: 70, alpha: 0.45 });
  a.waveLine({ x: X(690), y: Yv(335), w: 190 * K, alpha: 0.4 });
  // brilhos nos cristais do castelo e das ilhas
  a.twinkles({ points: pts([[925, 140], [1000, 255], [915, 335], [785, 125], [715, 120]]) });
  a.pulse({ x: X(745), y: Yv(100), size: 90, tint: 0xc8a8ff, min: 0.15, max: 0.4, period: 3.4 });
  a.birds({ y: [Yv(80), Yv(260)], count: 3, dir: 1, alpha: 0.5 });
  a.motes({ area: box(0, 200, 400, 300), size: [0.08, 0.16], tint: 0xffd49a, rate: 240 });
}

const MAP: Record<number, (a: Ambient) => void> = {
  // Vale do Coração: folhas vermelhas, névoa pálida nas ruínas cinzentas, riacho ao centro
  1: (a) => {
    a.fogBand({ y: Yv(470), h: 220, speed: 8, alpha: 0.4, tint: 0xffe8f0 });
    a.fogBand({ y: Yv(330), h: 160, speed: -6, alpha: 0.22, tint: 0xe8e0f0 });
    a.puffs({ area: box(0, 560, 1024, 123), count: 8, size: [200, 340], alpha: 0.4, drift: 80, tint: 0xffe6f0 });
    a.puffs({ area: box(700, 330, 324, 300), count: 5, size: [140, 220], alpha: 0.3, drift: 40, tint: 0xd8d4e0 });
    fall(a, 395, 85, 125, 16);
    fall(a, 470, 335, 392, 40);
    fall(a, 258, 478, 532, 16);
    fall(a, 803, 268, 310, 16);
    a.glitter({ area: box(340, 450, 220, 120), rate: 110 });
    a.ripples({ points: pts([[430, 500], [500, 520], [470, 555]]), size: 70, alpha: 0.5 });
    a.steam({ x: X(118), y: Yv(195), w: 8, size: 40, alpha: 0.4, rate: 520 });
    a.pulse({ x: X(872), y: Yv(55), size: 200, tint: 0xffd9a0, min: 0.3, max: 0.6, period: 4 });
    a.pulse({ x: X(45), y: Yv(425), size: 70, tint: 0xff7aa0, min: 0.15, max: 0.45, period: 2.2 });
    a.pulse({ x: X(100), y: Yv(335), size: 50, tint: 0xffb050, min: 0.2, max: 0.5, period: 2, flicker: true });
    a.leaves({ area: box(0, 0, 1024, 600), colors: [0xff4d5e, 0xd9303f, 0xff9a3c], rate: 520, wind: 40 });
    a.motes({ area: box(0, 150, 700, 450), tint: 0xffd89a, rate: 200 });
  },
  // Cânion do Entardecer: vapor das fontes, poeira, brisa quente
  2: (a) => {
    a.fogBand({ y: Yv(400), h: 220, speed: 10, alpha: 0.42, tint: 0xe6dcd8 });
    a.fogBand({ y: Yv(540), h: 160, speed: -8, alpha: 0.3, tint: 0xffc8a8 });
    a.puffs({ area: box(0, 0, 1024, 160), count: 5, size: [200, 320], alpha: 0.22, drift: 70, tint: 0xffd0b0 });
    a.puffs({ area: box(0, 280, 200, 300), count: 4, size: [160, 240], alpha: 0.3, drift: 40, tint: 0xd8d0d8 });
    a.puffs({ area: box(824, 300, 200, 300), count: 4, size: [160, 240], alpha: 0.3, drift: 40, tint: 0xd8d0d8 });
    fall(a, 330, 415, 492, 34);
    fall(a, 592, 297, 325, 16);
    a.steam({ x: X(430), y: Yv(405), w: 60, size: 70, alpha: 0.45, rate: 260 });
    a.steam({ x: X(595), y: Yv(325), w: 50, size: 60, alpha: 0.45, rate: 300 });
    a.steam({ x: X(480), y: Yv(452), w: 50, size: 60, alpha: 0.4, rate: 320 });
    a.ripples({ points: pts([[590, 335], [430, 415], [478, 457]]), size: 70, alpha: 0.5 });
    a.glitter({ area: box(535, 318, 110, 36), rate: 160 });
    a.glitter({ area: box(375, 400, 105, 38), rate: 160 });
    a.twinkles({ points: pts([[440, 258], [522, 358], [320, 352], [775, 222], [968, 262]]), tint: 0xffd8ff });
    a.streaks({ area: box(0, 150, 1024, 400), dir: 1, rate: 200, alpha: 0.5 });
    a.motes({ area: box(0, 150, 1024, 400), tint: 0xffd49a, size: [0.07, 0.14], rate: 220 });
    a.birds({ y: [Yv(60), Yv(170)], count: 3, dir: -1, tint: 0x5a2a3a });
  },
  // Cidade Solar: cascatas, nuvens douradas, pólen de girassol, luzes do palco
  3: (a) => {
    a.puffs({ area: box(0, 520, 1024, 163), count: 9, size: [220, 360], alpha: 0.45, drift: 90, tint: 0xfff0c0 });
    a.puffs({ area: box(0, 0, 1024, 130), count: 4, size: [200, 300], alpha: 0.28, drift: 60, tint: 0xffe8d0 });
    a.puffs({ area: box(0, 380, 160, 180), count: 3, size: [160, 220], alpha: 0.35, drift: 30, tint: 0xd0d0d8 });
    fall(a, 635, 262, 308, 18);
    fall(a, 697, 250, 292, 24);
    fall(a, 685, 302, 420, 36, 0.6);
    fall(a, 715, 420, 528, 42, 0.6);
    a.pulse({ x: X(580), y: Yv(100), size: 200, tint: 0xffe070, min: 0.3, max: 0.7, period: 3.6 });
    a.sunRays({ x: X(580), y: Yv(100), count: 6, len: 300, spread: 110, facing: 0, alpha: 0.18 });
    a.pulse({ x: X(810), y: Yv(178), size: 80, tint: 0xfff0a8, min: 0.2, max: 0.55, period: 2.8 });
    a.pulse({ x: X(980), y: Yv(185), size: 80, tint: 0xfff0a8, min: 0.2, max: 0.55, period: 3.1 });
    a.twinkles({ points: pts([[200, 405], [330, 330], [470, 335], [600, 385], [740, 330], [860, 270]]), tint: 0xfff2b0 });
    a.motes({ area: box(60, 180, 880, 360), tint: 0xffe070, size: [0.08, 0.18], rate: 130 });
    a.birds({ y: [Yv(50), Yv(200)], count: 3, dir: 1, tint: 0x7a4a8a });
  },
  // Selva Esmeralda: cachoeiras, vaga-lumes, raios entre as copas, espinhos escuros ao fundo
  4: (a) => {
    a.fogBand({ y: Yv(500), h: 190, speed: 8, alpha: 0.38, tint: 0xd8ffe8 });
    a.puffs({ area: box(0, 330, 780, 330), count: 6, size: [150, 240], alpha: 0.22, drift: 50, tint: 0xe0fff0 });
    a.puffs({ area: box(790, 220, 234, 280), count: 5, size: [140, 220], alpha: 0.3, drift: 30, tint: 0xb8c4b0 });
    a.shafts({ xs: [X(150), X(230), X(330)], y: 0, w: 110, h: 520, angle: -14, alpha: 0.2, tint: 0xf6ffc0 });
    fall(a, 285, 205, 302, 62);
    fall(a, 290, 345, 402, 40);
    fall(a, 337, 420, 468, 50);
    a.glitter({ area: box(330, 462, 270, 70), rate: 120 });
    a.ripples({ points: pts([[430, 500], [540, 510], [395, 497]]), size: 70, alpha: 0.5 });
    a.twinkles({ points: pts([[62, 330], [245, 475], [497, 218], [790, 270], [805, 395]]), tint: 0xe8ffd0 });
    a.pulse({ x: X(35), y: Yv(470), size: 60, tint: 0x70fff0, min: 0.2, max: 0.55, period: 2.4 });
    a.pulse({ x: X(912), y: Yv(205), size: 160, tint: 0xa8ff40, min: 0.25, max: 0.6, period: 3 });
    a.motes({ area: box(0, 180, 800, 420), tint: 0xd9ff8a, size: [0.09, 0.2], rate: 110 });
    a.leaves({ area: box(0, 0, 700, 500), colors: [0x5fd068, 0x9be04a, 0xd9ff8a], rate: 800, wind: 25, size: [0.5, 0.9] });
  },
  // Recife Turquesa: tudo debaixo d'água
  5: (a) => {
    a.caustics({ area: box(0, 0, 1024, 683), fade: 100, alpha: 0.26 });
    a.shafts({ xs: [X(330), X(430), X(520), X(610)], y: 0, w: 150, h: 560, angle: 6, alpha: 0.22, tint: 0xcff6ff, sway: 3 });
    a.waveLine({ x: 0, y: Yv(6), w: GAME_W, alpha: 0.35 });
    a.glitter({ area: box(0, 0, 1024, 40), rate: 90 });
    a.bubbles({ area: box(0, 300, 1024, 380), rate: 300 });
    a.motes({ area: box(0, 40, 1024, 600), tint: 0xbff4ff, size: [0.06, 0.13], rate: 150, vy: [-10, 8] });
    a.fish({ y: [Yv(90), Yv(300)], count: 7, dir: 1, tint: 0x0b6a8a, alpha: 0.4 });
    a.fish({ y: [Yv(250), Yv(480)], count: 5, dir: -1, tint: 0x0b6a8a, alpha: 0.4, speed: [30, 55] });
    a.puffs({ area: box(0, 480, 1024, 200), count: 6, size: [200, 320], alpha: 0.18, drift: 60, tint: 0x9ae8f4 });
    a.pulse({ x: X(410), y: Yv(428), size: 90, tint: 0xfff0ff, min: 0.25, max: 0.7, period: 2.4 });
    a.twinkles({ points: pts([[395, 305], [480, 325], [610, 375], [660, 380], [880, 285], [865, 190]]), tint: 0xffffff });
  },
  // Ilhas do Céu Anil: noite estrelada, cachoeiras luminosas, eclipse
  6: (a) => {
    a.twinkles({ points: scatter(box(0, 0, 1024, 300), 34), size: [0.25, 0.55], every: [300, 2500] });
    a.shootingStars({ area: box(60, 0, 700, 200), every: [4, 9] });
    a.pulse({ x: X(865), y: Yv(125), size: 280, tint: 0xd8b8ff, min: 0.25, max: 0.55, period: 4.2 });
    a.puffs({ area: box(0, 430, 1024, 250), count: 9, size: [220, 360], alpha: 0.32, drift: 90, tint: 0x8a5ae8 });
    a.puffs({ area: box(0, 120, 1024, 200), count: 4, size: [200, 300], alpha: 0.2, drift: 70, tint: 0x6a40c0 });
    a.fogBand({ y: Yv(540), h: 200, speed: 10, alpha: 0.35, tint: 0x8a6af0 });
    fall(a, 97, 205, 248, 10, 0.6);
    fall(a, 435, 330, 440, 34, 0.7);
    fall(a, 672, 422, 552, 22, 0.7);
    fall(a, 857, 345, 452, 38, 0.7);
    a.twinkles({ points: pts([[272, 316], [262, 362], [222, 398], [468, 322], [510, 368], [695, 378], [742, 328], [790, 292]]), tint: 0xfff0a0, size: [0.4, 0.8] });
    a.pulse({ x: X(435), y: Yv(158), size: 80, tint: 0xffd890, min: 0.2, max: 0.5, period: 2.8 });
    a.motes({ area: box(0, 150, 1024, 450), tint: 0xc8a8ff, size: [0.07, 0.16], rate: 120 });
    a.lightning({ every: [14, 28], strength: 0.05, tint: 0xb8a0ff });
  },
  // Cidadela Cinza: névoa pesada, cinzas, relâmpagos distantes
  7: (a) => {
    a.fogBand({ y: Yv(250), h: 200, speed: 9, alpha: 0.28, tint: 0xe8dcff });
    a.fogBand({ y: Yv(420), h: 220, speed: -7, alpha: 0.38, tint: 0xd8c8f4 });
    a.fogBand({ y: Yv(560), h: 160, speed: 12, alpha: 0.42, tint: 0xd0c0f0 });
    a.puffs({ area: box(0, 480, 1024, 203), count: 9, size: [220, 360], alpha: 0.4, drift: 80, tint: 0xd8c8f4 });
    a.puffs({ area: box(0, 40, 1024, 160), count: 4, size: [200, 300], alpha: 0.22, drift: 60, tint: 0xe0d0ff });
    fall(a, 140, 312, 382, 22);
    fall(a, 312, 345, 402, 14);
    fall(a, 318, 420, 540, 24);
    fall(a, 685, 255, 322, 16);
    a.pulse({ x: X(905), y: Yv(115), size: 150, tint: 0xffe8a0, min: 0.25, max: 0.6, period: 3 });
    a.pulse({ x: X(805), y: Yv(458), size: 70, tint: 0xffd8ff, min: 0.2, max: 0.55, period: 2.6 });
    a.pulse({ x: X(895), y: Yv(458), size: 70, tint: 0xd8f0ff, min: 0.2, max: 0.55, period: 3 });
    a.twinkles({ points: pts([[325, 235], [520, 342], [700, 185], [783, 195], [805, 322], [995, 258], [920, 335]]), tint: 0xffe0ff });
    a.motes({ area: box(0, 120, 1024, 500), tint: 0xe0d0ff, size: [0.07, 0.15], vy: [-6, 12], rate: 150 });
    a.birds({ y: [Yv(60), Yv(200)], count: 2, dir: -1, tint: 0x2a1a3a, alpha: 0.6 });
    a.lightning({ every: [9, 18], strength: 0.08 });
  },
};

/** Efeitos do mapa de um mundo (as 4 clareiras). */
export function mapFx(a: Ambient, world: number) {
  if (!a.on) return;
  MAP[world]?.(a);
}

// ---------- fundos das fases (paralaxe) ----------

export interface LevelBg {
  far?: Layer;
  mid?: Layer;
  /** Contêineres logo acima de cada camada: o efeito preso a uma camada fica atrás das camadas da frente
   *  (cachoeira do fundo não passa por cima da árvore do meio) e perde a cor junto com a arte. */
  farInto: Phaser.GameObjects.Container;
  midInto: Phaser.GameObjects.Container;
}

const FAR_Y = 0;
const MID_Y = 40;
const BEHIND = -5; // entre o fundo (−10) e o cenário (0)
const FRONT = 15; // por cima do cenário, bem leve

/** Cachoeira(s) presa(s) a uma camada: [u, v0, v1, largura em px]. */
function falls(a: Ambient, layer: Layer | undefined, offY: number, into: Phaser.GameObjects.Container, list: [number, number, number, number][], alpha = 0.5) {
  if (!layer) return;
  for (const [u, v0, v1, w] of list) a.pinFall(layer, offY, u, v0, v1, w, { into, alpha });
}
function glows(a: Ambient, layer: Layer | undefined, offY: number, into: Phaser.GameObjects.Container, list: [number, number, number][], tint: number, o: { flicker?: boolean; min?: number; max?: number } = {}) {
  if (!layer) return;
  for (const [u, v, size] of list) a.pinPulse(layer, offY, u, v, size, { into, tint, ...o });
}
function glints(a: Ambient, layer: Layer | undefined, offY: number, into: Phaser.GameObjects.Container, list: Pair[], tint = 0xffffff) {
  if (!layer) return;
  for (const [u, v] of list) a.pinTwinkle(layer, offY, u, v, { into, tint });
}

const SCREEN: Box = { x: 0, y: 0, w: GAME_W, h: GAME_H };

const LEVEL: Record<number, (a: Ambient, bg: LevelBg) => void> = {
  1: (a, { far, mid, farInto, midInto }) => {
    falls(a, far, FAR_Y, farInto, [[0.575, 0.3, 0.43, 56], [0.5, 0.4, 0.49, 40], [0.61, 0.61, 0.72, 64], [0.535, 0.85, 0.95, 56], [0.296, 0.52, 0.62, 30]]);
    falls(a, mid, MID_Y, midInto, [[0.42, 0.7, 0.92, 76], [0.442, 0.85, 0.98, 64]], 0.55);
    glows(a, far, FAR_Y, farInto, [[0.736, 0.25, 220]], 0xffd9a0, { min: 0.3, max: 0.6 });
    glows(a, mid, MID_Y, midInto, [[0.14, 0.66, 60], [0.376, 0.665, 60], [0.954, 0.68, 60]], 0xffb050, { flicker: true });
    if (mid) a.pinSteam(mid, MID_Y, 0.17, 0.38, { into: midInto, size: 46, alpha: 0.4 });
    a.fogBand({ y: 380, h: 340, speed: 10, parallax: 0.1, alpha: 0.32, tint: 0xffd0e8, depth: BEHIND });
    a.fogBand({ y: 520, h: 200, speed: -6, parallax: 0.2, alpha: 0.26, tint: 0xffe8f4, depth: BEHIND });
    a.birds({ y: [90, 230], count: 3, depth: BEHIND, tint: 0x6a2a50 });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xffd89a, alpha: 0.7, size: [0.07, 0.15], rate: 220 });
    a.leaves({ area: SCREEN, depth: FRONT, colors: [0xff4d5e, 0xd9303f, 0xff9a3c], rate: 700, wind: 45, size: [0.6, 1.1], alpha: 0.85 });
  },
  2: (a, { far, mid, farInto, midInto }) => {
    glows(a, far, FAR_Y, farInto, [[0.657, 0.46, 300]], 0xffe08a, { min: 0.3, max: 0.6 });
    glints(a, mid, MID_Y, midInto, [[0.235, 0.59], [0.075, 0.7], [0.81, 0.71]], 0xffd8ff);
    falls(a, mid, MID_Y, midInto, [[0.552, 0.805, 0.865, 30]], 0.45);
    if (mid) {
      a.pinSteam(mid, MID_Y, 0.55, 0.78, { into: midInto, size: 70, alpha: 0.4 });
      a.pinSteam(mid, MID_Y, 0.675, 0.8, { into: midInto, size: 70, alpha: 0.4 });
    }
    a.fogBand({ y: 470, h: 250, speed: 14, parallax: 0.12, alpha: 0.38, tint: 0xffb890, depth: BEHIND });
    a.fogBand({ y: 330, h: 200, speed: -9, parallax: 0.06, alpha: 0.2, tint: 0xffd0b0, depth: BEHIND });
    a.birds({ y: [70, 220], count: 3, dir: -1, depth: BEHIND, tint: 0x5a2a3a });
    a.streaks({ area: { x: 0, y: 160, w: GAME_W, h: 460 }, depth: FRONT, dir: 1, rate: 220, alpha: 0.4 });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xffd49a, alpha: 0.7, size: [0.06, 0.13], rate: 220 });
  },
  3: (a, { far, mid, farInto, midInto }) => {
    falls(a, far, FAR_Y, farInto, [[0.15, 0.38, 0.44, 14], [0.846, 0.38, 0.44, 14]], 0.4);
    falls(a, mid, MID_Y, midInto, [[0.354, 0.7, 0.82, 46], [0.25, 0.825, 0.965, 54], [0.743, 0.91, 0.975, 23]]);
    glows(a, far, FAR_Y, farInto, [[0.557, 0.28, 200], [0.664, 0.16, 240]], 0xffe070, { min: 0.3, max: 0.65 });
    if (mid) {
      a.pinSteam(mid, MID_Y, 0.057, 0.47, { into: midInto, size: 44, alpha: 0.35 });
      a.pinSteam(mid, MID_Y, 0.532, 0.445, { into: midInto, size: 44, alpha: 0.35 });
    }
    a.puffs({ area: { x: 0, y: 380, w: GAME_W, h: 320 }, count: 8, size: [200, 340], alpha: 0.32, drift: 90, tint: 0xfff0c0, depth: BEHIND });
    a.shafts({ xs: [220, 540, 880], y: 0, w: 170, h: 600, angle: -14, alpha: 0.16, tint: 0xfff0b0, depth: BEHIND });
    a.birds({ y: [80, 260], count: 3, depth: BEHIND, tint: 0x7a4a8a });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xffe070, alpha: 0.65, size: [0.07, 0.16], rate: 150 });
  },
  4: (a, { far, mid, farInto, midInto }) => {
    falls(a, far, FAR_Y, farInto, [[0.296, 0.31, 0.39, 28], [0.72, 0.29, 0.41, 50], [0.6, 0.425, 0.455, 12], [0.91, 0.395, 0.515, 46], [0.52, 0.545, 0.64, 100]]);
    falls(a, mid, MID_Y, midInto, [[0.18, 0.6, 0.79, 140], [0.275, 0.76, 0.92, 90], [0.6, 0.69, 0.94, 230]], 0.55);
    glows(a, mid, MID_Y, midInto, [[0.15, 0.8, 50]], 0x70fff0);
    glows(a, mid, MID_Y, midInto, [[0.87, 0.48, 60], [0.973, 0.64, 50]], 0xffc860, { flicker: true });
    a.fogBand({ y: 250, h: 260, speed: 8, parallax: 0.08, alpha: 0.3, tint: 0xd8f8f0, depth: BEHIND });
    a.fogBand({ y: 450, h: 270, speed: -7, parallax: 0.2, alpha: 0.38, tint: 0xe0fff0, depth: BEHIND });
    a.shafts({ xs: [260, 640, 1020], y: 0, w: 150, h: 600, angle: -12, alpha: 0.2, tint: 0xf6ffc0, depth: BEHIND });
    a.birds({ y: [100, 250], count: 3, depth: BEHIND, tint: 0x2a6a4a });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xd9ff8a, alpha: 0.75, size: [0.08, 0.18], rate: 110 });
    a.leaves({ area: SCREEN, depth: FRONT, colors: [0x5fd068, 0x9be04a, 0xd9ff8a], rate: 900, wind: 25, size: [0.5, 0.9], alpha: 0.8 });
  },
  5: (a, { far, mid, farInto, midInto }) => {
    falls(a, far, FAR_Y, farInto, [[0.7, 0.32, 0.45, 30]], 0.35);
    glows(a, mid, MID_Y, midInto, [[0.83, 0.8, 120], [0.214, 0.73, 70]], 0xfff0ff, { min: 0.25, max: 0.7 });
    a.caustics({ area: { x: 0, y: 200, w: GAME_W, h: GAME_H - 200 }, fade: 140, alpha: 0.3, both: false, depth: BEHIND });
    a.shafts({ xs: [150, 470, 780, 1100], y: -20, w: 150, h: 620, angle: 8, alpha: 0.2, tint: 0xcff6ff, depth: BEHIND, sway: 3 });
    a.fish({ y: [120, 380], count: 6, dir: 1, depth: BEHIND, tint: 0x0b6a8a, alpha: 0.4 });
    a.fish({ y: [260, 520], count: 5, dir: -1, depth: BEHIND, tint: 0x0b6a8a, alpha: 0.4, speed: [30, 55] });
    a.puffs({ area: { x: 0, y: 460, w: GAME_W, h: 260 }, count: 6, size: [220, 340], alpha: 0.16, drift: 60, tint: 0x9ae8f4, depth: BEHIND });
    a.bubbles({ area: { x: 0, y: 340, w: GAME_W, h: 400 }, depth: FRONT, rate: 320, alpha: 0.7 });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xbff4ff, alpha: 0.6, size: [0.05, 0.12], vy: [-10, 8], rate: 150 });
  },
  6: (a, { far, mid, farInto, midInto }) => {
    falls(a, far, FAR_Y, farInto, [[0.174, 0.41, 0.65, 40], [0.056, 0.52, 0.62, 20], [0.866, 0.47, 0.63, 30]], 0.6);
    falls(a, mid, MID_Y, midInto, [[0.19, 0.68, 0.88, 60], [0.44, 0.57, 0.64, 18], [0.615, 0.63, 0.82, 43]], 0.65);
    glows(a, far, FAR_Y, farInto, [[0.75, 0.2, 320]], 0xd8b8ff, { min: 0.25, max: 0.5 });
    glows(a, far, FAR_Y, farInto, [[0.07, 0.12, 50], [0.03, 0.26, 50], [0.93, 0.13, 50], [0.97, 0.25, 50]], 0xffb060, { flicker: true });
    glows(a, mid, MID_Y, midInto, [[0.075, 0.6, 50], [0.1, 0.52, 50], [0.57, 0.745, 50], [0.92, 0.42, 50], [0.94, 0.46, 50], [0.97, 0.53, 50]], 0xffb060, { flicker: true });
    glints(a, mid, MID_Y, midInto, [[0.036, 0.72], [0.48, 0.78], [0.62, 0.9], [0.775, 0.69], [0.95, 0.84]], 0xe8d0ff);
    a.twinkles({ points: scatter({ x: 0, y: 0, w: GAME_W, h: 300 }, 30), depth: -9, size: [0.25, 0.55], every: [300, 2500] });
    a.shootingStars({ area: { x: 60, y: 0, w: 900, h: 220 }, every: [5, 11], depth: -9 });
    a.puffs({ area: { x: 0, y: 440, w: GAME_W, h: 280 }, count: 8, size: [220, 360], alpha: 0.3, drift: 90, tint: 0x8a5ae8, depth: BEHIND });
    a.fogBand({ y: 470, h: 250, speed: 12, parallax: 0.2, alpha: 0.32, tint: 0x8a6af0, depth: BEHIND });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xc8a8ff, alpha: 0.7, size: [0.07, 0.16], rate: 130 });
    a.lightning({ every: [14, 28], strength: 0.05, tint: 0xb8a0ff });
  },
  7: (a, { far, mid, farInto, midInto }) => {
    falls(a, far, FAR_Y, farInto, [[0.586, 0.5, 0.65, 52], [0.915, 0.52, 0.68, 46], [0.063, 0.5, 0.6, 28], [0.71, 0.43, 0.5, 26]], 0.45);
    glows(a, far, FAR_Y, farInto, [[0.78, 0.18, 320]], 0xe0b8ff, { min: 0.25, max: 0.55 });
    glows(a, mid, MID_Y, midInto, [[0.846, 0.31, 70], [0.8, 0.65, 60], [0.835, 0.65, 60]], 0xffe8c0, { min: 0.2, max: 0.5 });
    a.fogBand({ y: 250, h: 220, speed: 9, parallax: 0.06, alpha: 0.26, tint: 0xe8dcff, depth: BEHIND });
    a.fogBand({ y: 430, h: 240, speed: -7, parallax: 0.14, alpha: 0.36, tint: 0xd8c8f4, depth: BEHIND });
    a.fogBand({ y: 560, h: 170, speed: 12, parallax: 0.22, alpha: 0.4, tint: 0xd0c0f0, depth: FRONT });
    a.puffs({ area: { x: 0, y: 470, w: GAME_W, h: 250 }, count: 8, size: [220, 360], alpha: 0.32, drift: 80, tint: 0xd8c8f4, depth: BEHIND });
    a.birds({ y: [80, 220], count: 2, dir: -1, depth: BEHIND, tint: 0x2a1a3a, alpha: 0.6 });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xe0d0ff, alpha: 0.65, size: [0.06, 0.14], vy: [-6, 12], rate: 150 });
    a.lightning({ every: [9, 18], strength: 0.08 });
  },
};

/** Efeitos do fundo de uma fase comum (paralaxe). */
export function levelFx(a: Ambient, world: number, bg: LevelBg) {
  if (!a.on) return;
  LEVEL[world]?.(a, bg);
}

// ---------- arenas de chefe (uma imagem parada) ----------

/** Retângulo onde a arte da arena foi desenhada na tela. */
export type Rect = { x: number; y: number; w: number; h: number };

const ARENA: Record<number, (a: Ambient, r: Rect, into: Phaser.GameObjects.Container) => void> = {
  1: (a, r, into) => {
    const X = (u: number) => r.x + u * r.w, Y = (v: number) => r.y + v * r.h;
    a.waterfall({ x: X(0.54), y: Y(0.37), w: 26, h: Y(0.5) - Y(0.37), into, alpha: 0.5 });
    a.waterfall({ x: X(0.985), y: Y(0.43), w: 20, h: Y(0.5) - Y(0.43), into, alpha: 0.5 });
    a.pulse({ x: X(0.82), y: Y(0.15), size: 200, tint: 0xffd9a0, into, min: 0.3, max: 0.6, period: 4 });
    a.fogBand({ y: Y(0.55), h: Y(0.78) - Y(0.55), speed: 9, alpha: 0.2, tint: 0xffe0ee, depth: BEHIND });
    a.leaves({ area: SCREEN, depth: FRONT, colors: [0xff4d5e, 0xd9303f, 0xff9a3c], rate: 800, wind: 40, size: [0.6, 1.1], alpha: 0.85 });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xffd89a, alpha: 0.7, rate: 240 });
  },
  2: (a, r, into) => {
    const X = (u: number) => r.x + u * r.w, Y = (v: number) => r.y + v * r.h;
    a.pulse({ x: X(0.52), y: Y(0.19), size: 300, tint: 0xffe08a, into, min: 0.3, max: 0.6, period: 4 });
    a.twinkles({ points: [[X(0.12), Y(0.7)], [X(0.06), Y(0.88)], [X(0.98), Y(0.46)], [X(0.07), Y(0.5)]], tint: 0xffd8ff });
    a.fogBand({ y: Y(0.66), h: Y(0.88) - Y(0.66), speed: 14, alpha: 0.3, tint: 0xffb890, depth: BEHIND });
    a.streaks({ area: { x: 0, y: 200, w: GAME_W, h: 440 }, depth: FRONT, dir: 1, rate: 200, alpha: 0.45 });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xffd49a, alpha: 0.7, size: [0.06, 0.13], rate: 220 });
  },
  3: (a, r, into) => {
    const X = (u: number) => r.x + u * r.w, Y = (v: number) => r.y + v * r.h;
    a.waterfall({ x: X(0.455), y: Y(0.47), w: 30, h: Y(0.62) - Y(0.47), into, alpha: 0.5 });
    a.waterfall({ x: X(0.255), y: Y(0.5), w: 16, h: Y(0.58) - Y(0.5), into, alpha: 0.5 });
    a.waterfall({ x: X(0.82), y: Y(0.5), w: 16, h: Y(0.58) - Y(0.5), into, alpha: 0.5 });
    a.pulse({ x: X(0.55), y: Y(0.35), size: 220, tint: 0xffe070, into, min: 0.3, max: 0.65, period: 3.6 });
    a.shafts({ xs: [X(0.12), X(0.25), X(0.72), X(0.85)], y: Y(0.16), w: 130, h: 520, angle: 12, alpha: 0.18, tint: 0xfff0b0, depth: BEHIND, sway: 3 });
    a.puffs({ area: { x: 0, y: Y(0.55), w: GAME_W, h: 160 }, count: 5, size: [180, 280], alpha: 0.3, drift: 60, tint: 0xffffff, depth: BEHIND });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xffe070, alpha: 0.65, size: [0.07, 0.16], rate: 150 });
  },
  4: (a, r, into) => {
    const X = (u: number) => r.x + u * r.w, Y = (v: number) => r.y + v * r.h;
    a.waterfall({ x: X(0.23), y: Y(0.3), w: 24, h: Y(0.42) - Y(0.3), into, alpha: 0.5 });
    a.waterfall({ x: X(0.285), y: Y(0.4), w: 24, h: Y(0.5) - Y(0.4), into, alpha: 0.5 });
    a.waterfall({ x: X(0.34), y: Y(0.17), w: 22, h: Y(0.3) - Y(0.17), into, alpha: 0.5 });
    a.fogBand({ y: Y(0.55), h: Y(0.76) - Y(0.55), speed: 8, alpha: 0.3, tint: 0xd8ffe8, depth: BEHIND });
    a.shafts({ xs: [X(0.3), X(0.55), X(0.8)], y: 0, w: 140, h: 560, angle: -12, alpha: 0.18, tint: 0xf6ffc0, depth: BEHIND });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xd9ff8a, alpha: 0.75, size: [0.08, 0.18], rate: 110 });
    a.leaves({ area: SCREEN, depth: FRONT, colors: [0x5fd068, 0x9be04a, 0xd9ff8a], rate: 900, wind: 25, size: [0.5, 0.9], alpha: 0.8 });
  },
  5: (a, r, into) => {
    const X = (u: number) => r.x + u * r.w, Y = (v: number) => r.y + v * r.h;
    a.caustics({ area: { x: 0, y: 0, w: GAME_W, h: Y(0.8) }, fade: 100, alpha: 0.22, depth: BEHIND });
    a.shafts({ xs: [X(0.3), X(0.4), X(0.5)], y: 0, w: 150, h: 560, angle: 8, alpha: 0.2, tint: 0xcff6ff, depth: BEHIND, sway: 3 });
    a.pulse({ x: X(0.5), y: Y(0.5), size: 110, tint: 0xfff0ff, into, min: 0.25, max: 0.7, period: 2.4 });
    a.bubbles({ area: { x: 0, y: 300, w: GAME_W, h: 400 }, depth: FRONT, rate: 320, alpha: 0.7 });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xbff4ff, alpha: 0.6, size: [0.05, 0.12], vy: [-10, 8], rate: 150 });
    a.fish({ y: [100, 300], count: 4, dir: 1, depth: BEHIND, tint: 0x082a6a, alpha: 0.4 });
  },
  6: (a, r, into) => {
    const X = (u: number) => r.x + u * r.w, Y = (v: number) => r.y + v * r.h;
    a.waterfall({ x: X(0.33), y: Y(0.34), w: 22, h: Y(0.5) - Y(0.34), into, alpha: 0.6 });
    a.waterfall({ x: X(0.4), y: Y(0.55), w: 16, h: Y(0.64) - Y(0.55), into, alpha: 0.6 });
    a.waterfall({ x: X(0.685), y: Y(0.5), w: 16, h: Y(0.62) - Y(0.5), into, alpha: 0.6 });
    a.pulse({ x: X(0.5), y: Y(0.14), size: 300, tint: 0xd8b8ff, into, min: 0.25, max: 0.55, period: 4.2 });
    a.twinkles({ points: scatter({ x: 0, y: 0, w: GAME_W, h: 260 }, 26), depth: BEHIND, size: [0.25, 0.55], every: [300, 2500] });
    a.shootingStars({ area: { x: 60, y: 0, w: 900, h: 200 }, every: [5, 11], depth: BEHIND });
    a.puffs({ area: { x: 0, y: Y(0.4), w: GAME_W, h: 200 }, count: 6, size: [200, 320], alpha: 0.26, drift: 80, tint: 0x8a5ae8, depth: BEHIND });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xc8a8ff, alpha: 0.7, size: [0.07, 0.16], rate: 130 });
  },
  7: (a, r, into) => {
    const X = (u: number) => r.x + u * r.w, Y = (v: number) => r.y + v * r.h;
    a.shafts({ xs: [X(0.5)], y: Y(0.08), w: 140, h: 520, angle: 0, alpha: 0.24, tint: 0xfff0ff, sway: 2, depth: BEHIND });
    a.pulse({ x: X(0.5), y: Y(0.22), size: 200, tint: 0xf0d0ff, into, min: 0.25, max: 0.6, period: 3 });
    a.fogBand({ y: Y(0.62), h: Y(0.86) - Y(0.62), speed: 10, alpha: 0.32, tint: 0xd8c8f4, depth: BEHIND });
    a.puffs({ area: { x: 0, y: Y(0.5), w: GAME_W, h: 200 }, count: 6, size: [200, 320], alpha: 0.26, drift: 70, tint: 0xd8c8f4, depth: BEHIND });
    a.twinkles({ points: [[X(0.06), Y(0.62)], [X(0.94), Y(0.62)], [X(0.35), Y(0.78)], [X(0.65), Y(0.78)]], tint: 0xffe0ff });
    a.motes({ area: SCREEN, depth: FRONT, tint: 0xe0d0ff, alpha: 0.65, size: [0.06, 0.14], vy: [-6, 12], rate: 150 });
    a.lightning({ every: [9, 18], strength: 0.08 });
  },
};

/** Efeitos de uma arena de chefe; `rect` é onde a imagem da arena ficou na tela. */
export function arenaFx(a: Ambient, world: number, rect: Rect, into: Phaser.GameObjects.Container) {
  if (!a.on) return;
  ARENA[world]?.(a, rect, into);
}
