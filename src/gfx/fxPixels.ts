// Geradores de pixels das texturas de efeitos ambientes (névoa, raios de luz, cachoeira…).
// São funções puras (sem Phaser), para poderem ser testadas em Node. Todas devolvem RGBA com o
// formato em BRANCO e a forma no canal alfa: assim o `tint` do Phaser pinta cada efeito.

export interface PixelTex {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Degrau suave: 0 em `a`, 1 em `b` (funciona também com a > b, invertendo). */
export function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Aleatório determinístico (mulberry32): as texturas saem iguais em toda execução. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(w: number, h: number, alpha: (x: number, y: number) => number, shade?: (x: number, y: number) => number): PixelTex {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const c = shade ? shade(x, y) : 255;
      data[i] = data[i + 1] = data[i + 2] = c;
      data[i + 3] = Math.round(clamp01(alpha(x, y)) * 255);
    }
  }
  return { w, h, data };
}

/** Bolinha de luz com miolo forte e halo suave (brilhos, vaga-lumes, faíscas). */
export function glow(size = 64): PixelTex {
  const r = size / 2;
  return build(size, size, (x, y) => {
    const d = Math.hypot(x + 0.5 - r, y + 0.5 - r) / r;
    if (d >= 1) return 0;
    return Math.pow(1 - d, 2.2) + 0.5 * Math.pow(1 - d, 7);
  });
}

/** Nuvem/fumaça macia: vários blobs sobrepostos, sempre sumindo nas bordas. */
export function puff(size = 128): PixelTex {
  const rand = rng(11);
  const blobs = Array.from({ length: 8 }, () => {
    const a = rand() * TAU, d = rand() * 0.3;
    return { x: 0.5 + Math.cos(a) * d, y: 0.5 + Math.sin(a) * d * 0.8, r: 0.2 + rand() * 0.2 };
  });
  return build(size, size, (px, py) => {
    const x = (px + 0.5) / size, y = (py + 0.5) / size;
    let keep = 1;
    for (const b of blobs) keep *= 1 - 0.55 * Math.pow(smooth(1, 0, Math.hypot(x - b.x, y - b.y) / b.r), 1.3);
    const edge = smooth(0.5, 0.3, Math.hypot(x - 0.5, y - 0.5));
    return (1 - keep) * edge;
  });
}

/** Faixa de névoa que emenda nas pontas esquerda/direita (para rolar sem costura). */
export function fog(w = 1024, h = 256): PixelTex {
  const rand = rng(23);
  const blobs = Array.from({ length: 30 }, () => ({
    x: rand() * w,
    y: h * (0.5 + (rand() - 0.5) * 0.45),
    rx: 80 + rand() * 120,
    ry: 26 + rand() * 40,
    a: 0.35 + rand() * 0.3,
  }));
  return build(w, h, (x, y) => {
    let keep = 1;
    for (const b of blobs) {
      const dx = Math.min(Math.abs(x - b.x), w - Math.abs(x - b.x)) / b.rx;
      const dy = (y - b.y) / b.ry;
      const d = Math.hypot(dx, dy);
      if (d < 1) keep *= 1 - b.a * Math.pow(smooth(1, 0, d), 1.4);
    }
    return (1 - keep) * smooth(0, 0.34, y / h) * smooth(0, 0.34, 1 - y / h);
  });
}

/** Feixe de luz: estreito em cima, largo embaixo, sumindo com a distância. */
export function ray(w = 128, h = 512): PixelTex {
  return build(w, h, (x, y) => {
    const t = (y + 0.5) / h;
    const half = (0.16 + 0.34 * t) * w;
    const d = Math.abs(x + 0.5 - w / 2) / half;
    if (d >= 1) return 0;
    return smooth(1, 0.05, d) * Math.pow(1 - t, 1.1) * smooth(0, 0.05, t);
  });
}

/** Água caindo: fios claros e compridos descendo (emenda na vertical), laterais esmaecidas. */
export function fall(w = 64, h = 256): PixelTex {
  const rand = rng(5);
  // faixas verticais de 2 a 5 px, cada uma com seu ritmo de fios claros
  const strand: { k1: number; p1: number; k2: number; p2: number; gain: number }[] = [];
  for (let x = 0; x < w; ) {
    const width = 2 + Math.floor(rand() * 4);
    const s = { k1: 1 + Math.floor(rand() * 3), p1: rand(), k2: 3 + Math.floor(rand() * 3), p2: rand(), gain: 0.55 + rand() * 0.45 };
    for (let i = 0; i < width && x < w; i++, x++) strand[x] = s;
  }
  return build(w, h, (x, y) => {
    const c = strand[x];
    const a = Math.pow(0.5 + 0.5 * Math.sin(TAU * (c.k1 * (y / h) + c.p1)), 3);
    const b = Math.pow(0.5 + 0.5 * Math.sin(TAU * (c.k2 * (y / h) + c.p2)), 5);
    const v = Math.max(a, 0.6 * b) * c.gain;
    const edge = smooth(0, 0.2, (x + 0.5) / w) * smooth(0, 0.2, 1 - (x + 0.5) / w);
    return (0.16 + 0.84 * v) * edge;
  });
}

/** Cáusticas (a rede de luz que a água joga no fundo). Emenda nos quatro lados. */
export function caustic(size = 256): PixelTex {
  const ITER = 5, t0 = 11.5;
  return build(size, size, (px, py) => {
    const px0 = ((px / size) * TAU) % TAU - 250;
    const py0 = ((py / size) * TAU) % TAU - 250;
    let ix = px0, iy = py0, c = 1;
    const inten = 0.005;
    for (let n = 0; n < ITER; n++) {
      const t = t0 * (1 - 3.5 / (n + 1));
      const nx = px0 + (Math.cos(t - ix) + Math.sin(t + iy));
      const ny = py0 + (Math.sin(t - iy) + Math.cos(t + ix));
      ix = nx;
      iy = ny;
      c += 1 / Math.hypot(px0 / (Math.sin(ix + t) / inten), py0 / (Math.cos(iy + t) / inten));
    }
    c /= ITER;
    c = 1.17 - Math.pow(c, 1.4);
    return Math.pow(Math.abs(c), 8) * 1.1;
  });
}

/** Bolha de ar: anel fino, miolo quase transparente e um reflexo. */
export function bubble(size = 32): PixelTex {
  const r = size / 2;
  return build(size, size, (x, y) => {
    const dx = (x + 0.5 - r) / r, dy = (y + 0.5 - r) / r;
    const d = Math.hypot(dx, dy);
    if (d >= 1) return 0;
    const ring = smooth(0.72, 0.86, d) * smooth(1, 0.94, d);
    const fill = 0.07 * smooth(0.9, 0.5, d);
    const hl = Math.pow(smooth(0.32, 0, Math.hypot(dx + 0.38, dy + 0.38)), 1.5) * 0.9;
    return ring * 0.75 + fill + hl;
  });
}

/** Folha/pétala fina e pontuda, com uma nervura central mais escura. */
export function leaf(w = 26, h = 14): PixelTex {
  return build(
    w,
    h,
    (x, y) => {
      const u = (x + 0.5) / w, v = ((y + 0.5) / h - 0.5) * 2;
      const width = Math.sin(Math.PI * Math.pow(u, 0.8)) * 0.95;
      return smooth(width + 0.12, width - 0.12, Math.abs(v)) * (width > 0.02 ? 1 : 0);
    },
    (x, y) => 255 - 45 * Math.exp(-Math.pow(((y + 0.5) / h - 0.5) * 18, 2)),
  );
}

/** Estrela de quatro pontas que cintila (cristais, estrelas, brilhos na água). */
export function star(size = 48): PixelTex {
  const r = size / 2;
  return build(size, size, (x, y) => {
    const dx = Math.abs(x + 0.5 - r) / r, dy = Math.abs(y + 0.5 - r) / r;
    const cross = Math.max(Math.exp(-(dx * 18 + dy * 1.6)), Math.exp(-(dy * 18 + dx * 1.6)));
    const core = Math.exp(-Math.hypot(dx, dy) * 7);
    return Math.min(1, cross + 0.7 * core);
  });
}

/** Linha de crista de onda que emenda na horizontal: brilho passando na superfície da água. */
export function wave(w = 128, h = 16): PixelTex {
  return build(w, h, (x, y) => {
    const y0 = h / 2 + 2.4 * Math.sin((TAU * 2 * x) / w) + 1.2 * Math.sin((TAU * 5 * x) / w + 1);
    const line = Math.exp(-Math.pow((y + 0.5 - y0) / 1.5, 2));
    return line * (0.45 + 0.55 * Math.sin((TAU * 3 * x) / w + 0.5) ** 2);
  });
}

/** Anel de ondulação achatado (marola de água quando algo pinga ou borbulha). */
export function ripple(w = 96, h = 40): PixelTex {
  return build(w, h, (x, y) => {
    const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
    const d = Math.hypot(dx, dy);
    return smooth(0.78, 0.9, d) * smooth(1, 0.93, d) * 0.9;
  });
}
