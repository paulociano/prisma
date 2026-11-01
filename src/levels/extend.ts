import { LevelBuilder, T, type EntityType, type LevelData } from './LevelBuilder';

// Trecho extra de cada fase normal: ~50 blocos encaixados no meio da fase, montados com
// "blocos de construção" (montanhas, torres, ilhas flutuantes, paredes de caixas...) e com
// os inimigos e mecanismos de cada mundo. Tudo dentro de limites de pulo testados:
// subir no máximo 2 blocos por pulo e vãos de até 3 blocos sem pulo duplo (até 5 com ele).

type Seg = { b: LevelBuilder; x: number; h: number; rows: number };

// O que existe em cada mundo (inimigos e habilidades já liberadas antes da fase 3).
const WORLD: Record<number, { ground: EntityType[]; air: EntityType[]; dj: boolean; beats: string[] }> = {
  1: { ground: ['blot', 'beetle', 'padlock'], air: ['moth'], dj: false, beats: ['mountain', 'islands', 'crates', 'tower', 'twoRoutes', 'pit'] },
  2: { ground: ['scorpion', 'blot', 'megaphone'], air: ['moth'], dj: true, beats: ['mountain', 'vent', 'islands', 'mover', 'twoRoutes', 'crates'] },
  3: { ground: ['padlock', 'megaphone', 'blot'], air: ['drone'], dj: true, beats: ['tower', 'searchlight', 'islands', 'mountain', 'mover', 'twoRoutes'] },
  4: { ground: ['snapper', 'blot', 'padlock'], air: ['moth'], dj: true, beats: ['chimney', 'mountain', 'islands', 'crates', 'twoRoutes', 'mover'] },
  5: { ground: ['blot', 'padlock'], air: ['puffer'], dj: true, beats: ['mountain', 'islands', 'twoRoutes', 'tower', 'pit', 'crates'] },
  6: { ground: ['blot', 'padlock', 'megaphone'], air: ['comet'], dj: true, beats: ['islands', 'mountain', 'mover', 'tower', 'twoRoutes', 'chimney'] },
  7: { ground: ['sentinel', 'scorpion', 'snapper'], air: ['drone'], dj: true, beats: ['tower', 'mountain', 'chimney', 'islands', 'searchlight', 'twoRoutes'] },
};

const top = (s: Seg) => s.rows - s.h; // linha do topo do chão
const pick = <K>(arr: K[], i: number) => arr[i % arr.length];

// ---------- blocos de construção (cada um avança s.x) ----------

function flat(s: Seg, n: number) {
  s.b.ground(s.x, s.x + n - 1, s.h);
  s.x += n;
}

/** Montanha em degraus de 1 bloco: sobe 3, platô com inimigo, desce. */
function mountain(s: Seg, w: number, i: number) {
  const steps = [1, 2, 3, 3, 3, 2, 1];
  steps.forEach((dh, k) => s.b.ground(s.x + k * 2, s.x + k * 2 + 1, s.h + dh));
  const peak = top(s) - 3;
  s.b.coinArc(s.x + 2, peak - 2, 5);
  s.b.add(pick(WORLD[w].ground, i), s.x + 7, peak - 1);
  s.x += steps.length * 2;
  flat(s, 2);
}

/** Ilhas flutuantes de pedra sobre um abismo, em alturas alternadas. */
function islands(s: Seg, w: number, i: number) {
  const t = top(s);
  const gap = WORLD[w].dj ? 3 : 2;
  const rows = [t - 1, t - 3, t - 2, t - 1];
  let x = s.x + gap;
  rows.forEach((r, k) => {
    s.b.block(x, r, x + 1, r);
    s.b.coins(x, x + 1, r - 1);
    if (k === 1) s.b.add(pick(WORLD[w].air, i), x + 1, r - 3);
    x += 2 + gap;
  });
  s.x = x;
  flat(s, 3);
}

/** Torre de blocos: degraus atravessáveis à esquerda, topo com faíscas, descida do outro lado. */
function tower(s: Seg, w: number, i: number) {
  const t = top(s);
  s.b.ground(s.x, s.x + 11, s.h);
  s.b.oneway(s.x + 1, s.x + 2, t - 2);
  s.b.oneway(s.x + 3, s.x + 4, t - 4);
  s.b.block(s.x + 5, t - 5, s.x + 7, t - 1); // a torre
  s.b.coins(s.x + 5, s.x + 7, t - 6);
  s.b.add(pick(WORLD[w].ground, i + 1), s.x + 10, t - 1);
  s.x += 12;
}

/** Parede de caixas (quebre com a echarpe) com um inimigo esperando atrás. */
function crates(s: Seg, w: number, i: number) {
  const t = top(s);
  s.b.ground(s.x, s.x + 9, s.h);
  for (const c of [s.x + 3, s.x + 4]) for (let r = t - 1; r >= t - 3; r--) s.b.add('crate', c, r);
  s.b.add(pick(WORLD[w].ground, i), s.x + 7, t - 1);
  s.b.add('heart', s.x + 6, t - 1);
  s.x += 10;
}

/** Duas rotas: embaixo, chão com espinhos e inimigos; em cima, plataformas com faíscas. */
function twoRoutes(s: Seg, w: number, i: number) {
  const t = top(s);
  s.b.ground(s.x, s.x + 15, s.h);
  s.b.spikes(s.x + 4, s.x + 5, t - 1);
  s.b.spikes(s.x + 10, s.x + 11, t - 1);
  s.b.add(pick(WORLD[w].ground, i), s.x + 8, t - 1);
  s.b.oneway(s.x + 2, s.x + 4, t - 3);
  s.b.oneway(s.x + 6, s.x + 9, t - 4);
  s.b.oneway(s.x + 11, s.x + 13, t - 3);
  s.b.coins(s.x + 6, s.x + 9, t - 5);
  s.b.add(pick(WORLD[w].air, i + 1), s.x + 8, t - 7);
  s.x += 16;
}

/** Fosso de espinhos com blocos em zigue-zague para atravessar. */
function pit(s: Seg) {
  const t = top(s);
  s.b.ground(s.x, s.x + 11, 1).spikes(s.x, s.x + 11, s.rows - 2);
  s.b.block(s.x + 1, t - 1, s.x + 2, t - 1);
  s.b.block(s.x + 5, t - 2, s.x + 6, t - 2);
  s.b.block(s.x + 9, t - 1, s.x + 10, t - 1);
  s.b.coins(s.x + 5, s.x + 6, t - 3);
  s.x += 12;
}

/** Abismo com plataforma móvel (nível do chão), testado no 2-3. */
function mover(s: Seg) {
  const t = top(s);
  s.b.mover(s.x, t, 5, 0, 2, 4);
  s.b.coinArc(s.x + 1, t - 2, 6);
  s.x += 8;
  flat(s, 3);
}

/** Gêiser de vapor que leva até uma plataforma alta com faíscas. */
function vent(s: Seg) {
  const t = top(s);
  s.b.ground(s.x, s.x + 11, s.h);
  s.b.vent(s.x + 4, t - 1);
  s.b.block(s.x + 5, t - 6, s.x + 9, t - 6);
  s.b.coins(s.x + 5, s.x + 9, t - 7);
  s.x += 12;
}

/** Corredor vigiado por um holofote. */
function searchlight(s: Seg, w: number, i: number) {
  const t = top(s);
  s.b.ground(s.x, s.x + 12, s.h);
  s.b.searchlight(s.x + 6, 1, t, 3);
  s.b.oneway(s.x + 3, s.x + 4, t - 3).oneway(s.x + 8, s.x + 9, t - 3);
  s.b.add(pick(WORLD[w].ground, i), s.x + 11, t - 1);
  s.x += 13;
}

/** Chaminé: pilar suspenso + paredão (pulo na parede). */
function chimney(s: Seg) {
  const t = top(s);
  s.b.ground(s.x, s.x + 13, s.h);
  s.b.block(s.x + 3, t - 7, s.x + 3, t - 3);
  s.b.block(s.x + 6, t - 6, s.x + 11, t - 1);
  s.b.coins(s.x + 4, s.x + 5, t - 6);
  s.x += 14;
}

const BEATS: Record<string, (s: Seg, w: number, i: number) => void> = { mountain, islands, tower, crates, twoRoutes, pit, mover, vent, searchlight, chimney };

/** Monta o trecho do mundo `w` (variação `v` = número da fase). */
function buildSegment(w: number, v: number, h: number, rows: number) {
  const b = new LevelBuilder('seg', 'seg', w, 120, rows);
  const s: Seg = { b, x: 0, h, rows };
  flat(s, 3);
  // O checkpoint do trecho adicional será incluído só se houver espaço em relação aos originais.
  const beats = WORLD[w].beats;
  // 4 desafios por fase, começando num ponto diferente da lista a cada fase
  for (let k = 0; k < 4; k++) {
    BEATS[pick(beats, v + k)](s, w, v + k);
    flat(s, 2);
  }
  flat(s, 2);
  return { b, width: s.x };
}

// ---------- encaixe na fase ----------

/**
 * Topo do chão "de verdade" da coluna: bloco sólido contínuo desde o fundo da tela, e nada
 * (bloco flutuante, plataforma, espinho) acima dele. Senão, -1.
 */
const surfaceRow = (l: LevelData, c: number) => {
  if (c < 0 || c >= l.cols) return -1;
  let r = l.rows - 1;
  if (l.tiles[r][c] !== T.Solid) return -1;
  while (r > 0 && l.tiles[r - 1][c] === T.Solid) r--;
  for (let k = 0; k < r; k++) if (l.tiles[k][c] !== T.Empty) return -1;
  return r;
};

/** Coluna no meio da fase com chão liso e nada por perto (entidades, vento, plataformas). */
function findInsertion(l: LevelData) {
  // só o que ocupa várias colunas não pode ser cortado ao meio; o resto apenas se desloca.
  // Inimigos e objetos de chão logo em cima do ponto também ficam de fora (o trecho começa no chão).
  const SPAN = new Set(['wind', 'mover', 'searchlight', 'vent', 'spring', 'checkpoint', 'guardian', 'exit']);
  const busy = (c: number) =>
    l.entities.some((e) => {
      if (!SPAN.has(e.type)) return e.type !== 'coin' && Math.abs(e.col - c) <= 1;
      const reach = e.type === 'wind' ? (e.data?.w ?? 0) : e.type === 'mover' ? (e.data?.dx ?? 0) + (e.data?.width ?? 2) : e.type === 'searchlight' ? (e.data?.swing ?? 3) + 1 : 0;
      const from = e.type === 'searchlight' ? e.col - reach : e.col;
      return c >= from - 2 && c <= e.col + reach + 2;
    }) || l.hints.some((h) => Math.abs(h.col - c) < 4);
  const from = Math.floor(l.cols * 0.3), to = Math.floor(l.cols * 0.8);
  const mid = (from + to) / 2;
  const candidates: number[] = [];
  for (let c = from; c <= to; c++) {
    const r = surfaceRow(l, c);
    // emenda: as duas colunas dos dois lados no mesmo nível, sem nada acima delas
    if (r < 2 || surfaceRow(l, c - 1) !== r || busy(c) || busy(c - 1)) continue;
    candidates.push(c);
  }
  candidates.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  return candidates[0];
}

/** Devolve a fase com o trecho extra encaixado (fases de chefão ficam iguais). */
export function extendLevel(l: LevelData, variant: number): LevelData {
  if (l.arena) return l;
  const at = findInsertion(l);
  if (at === undefined) return l;
  const h = l.rows - surfaceRow(l, at);
  const { b, width } = buildSegment(l.world, variant, h, l.rows);
  const seg = b.build();

  const tiles = l.tiles.map((row, r) => [...row.slice(0, at), ...seg.tiles[r].slice(0, width), ...row.slice(at)]);
  const shift = <E extends { col: number }>(e: E) => (e.col >= at ? { ...e, col: e.col + width } : e);
  const existing = l.entities.map(shift);
  const inserted = seg.entities.filter((e) => e.col < width).map((e) => ({ ...e, col: e.col + at }));
  // Um novo checkpoint muito perto de outro cria duas ativações consecutivas sem desafio.
  // Mantém os checkpoints autorais e evita inserir um duplicado no segmento.
  const MIN_CHECKPOINT_GAP = 12;
  const checkpoints = existing.filter((e) => e.type === 'checkpoint');
  const entities = [...existing, ...inserted.filter((e) => e.type !== 'checkpoint' || checkpoints.every((old) => Math.abs(old.col - e.col) >= MIN_CHECKPOINT_GAP))];
  return { ...l, cols: l.cols + width, tiles, entities, hints: l.hints.map(shift) };
}
