import { LevelBuilder, T, type EntityType, type LevelData } from './LevelBuilder';
import { SUB_COUNT } from './subs';

// Trecho extra de cada fase normal: ~50 blocos encaixados no meio da fase, montados com
// "blocos de construção" (montanhas, torres, ilhas flutuantes, paredes de caixas...) e com
// os inimigos e mecanismos de cada mundo. Tudo dentro de limites de pulo testados:
// subir no máximo 2 blocos por pulo e vãos de até 3 blocos sem pulo duplo (até 5 com ele).

type Seg = { b: LevelBuilder; x: number; h: number; rows: number; r: () => number };

/** Gerador pseudoaleatório com semente: cada fase (mundo + número) tem o seu trecho, sempre o mesmo. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rint = (s: Seg, a: number, b: number) => a + Math.floor(s.r() * (b - a + 1));
const oneOf = <K>(s: Seg, arr: K[]) => arr[Math.floor(s.r() * arr.length)];

// O que existe em cada mundo (inimigos e habilidades já liberadas antes da fase 3).
const WORLD: Record<number, { ground: EntityType[]; air: EntityType[]; dj: boolean; beats: string[] }> = {
  1: { ground: ['blot', 'beetle', 'padlock', 'label'], air: ['moth', 'rumor'], dj: false, beats: ['mountain', 'islands', 'crates', 'tower', 'twoRoutes', 'pit'] },
  2: { ground: ['scorpion', 'blot', 'megaphone', 'joke'], air: ['moth', 'rumor'], dj: true, beats: ['mountain', 'vent', 'islands', 'mover', 'twoRoutes', 'crates'] },
  3: { ground: ['padlock', 'megaphone', 'blot', 'label', 'joke'], air: ['drone', 'rumor'], dj: true, beats: ['tower', 'searchlight', 'islands', 'mountain', 'mover', 'twoRoutes'] },
  4: { ground: ['snapper', 'blot', 'padlock', 'joke', 'silence'], air: ['moth', 'stare'], dj: true, beats: ['chimney', 'mountain', 'islands', 'crates', 'twoRoutes', 'mover'] },
  5: { ground: ['blot', 'padlock'], air: ['puffer'], dj: true, beats: ['mountain', 'islands', 'twoRoutes', 'tower', 'pit', 'crates'] },
  6: { ground: ['blot', 'padlock', 'megaphone', 'silence', 'label'], air: ['comet', 'stare'], dj: true, beats: ['islands', 'mountain', 'mover', 'tower', 'twoRoutes', 'chimney'] },
  7: { ground: ['sentinel', 'scorpion', 'snapper', 'silence', 'joke', 'label'], air: ['drone', 'stare', 'rumor'], dj: true, beats: ['tower', 'mountain', 'chimney', 'islands', 'searchlight', 'twoRoutes'] },
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
  const steps = oneOf(s, [[1, 2, 3, 3, 3, 2, 1], [1, 2, 3, 4, 3, 2, 1], [1, 1, 2, 3, 3, 2, 1], [1, 2, 2, 3, 4, 4, 2]]);
  steps.forEach((dh, k) => s.b.ground(s.x + k * 2, s.x + k * 2 + 1, s.h + dh));
  const peak = top(s) - Math.max(...steps);
  s.b.coinArc(s.x + 2, peak - 2, 5);
  s.b.add(pick(WORLD[w].ground, i), s.x + 7, peak - 1);
  if (s.r() < 0.6) s.b.add(pick(WORLD[w].ground, i + 1), s.x + 2, top(s) - steps[1] - 1);
  s.x += steps.length * 2;
  flat(s, 2);
}

/** Ilhas flutuantes de pedra sobre um abismo, em alturas alternadas. */
function islands(s: Seg, w: number, i: number) {
  const t = top(s);
  const gap = WORLD[w].dj ? rint(s, 3, 4) : rint(s, 2, 3);
  const rows = oneOf(s, [[t - 1, t - 3, t - 2, t - 1], [t - 2, t - 3, t - 1, t - 3, t - 1], [t - 1, t - 2, t - 4, t - 3, t - 1], [t - 2, t - 1, t - 3, t - 2, t - 4, t - 2]]);
  let x = s.x + gap;
  rows.forEach((r, k) => {
    s.b.block(x, r, x + 1, r);
    s.b.coins(x, x + 1, r - 1);
    if (k === 1 || (k === 3 && s.r() < 0.5)) s.b.add(pick(WORLD[w].air, i + k), x + 1, r - 3);
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
  const a = rint(s, 3, 5), c = rint(s, 9, 11);
  s.b.spikes(s.x + a, s.x + a + 1, t - 1);
  s.b.spikes(s.x + c, s.x + c + 1, t - 1);
  s.b.add(pick(WORLD[w].ground, i), s.x + 8, t - 1);
  if (s.r() < 0.5) s.b.add(pick(WORLD[w].ground, i + 1), s.x + 13, t - 1);
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

/** Fileira de blocos de bater com a cabeça: surpresa, faíscas e um inimigo para quebrar o ritmo. */
function bumps(s: Seg, w: number, i: number) {
  const t = top(s);
  s.b.ground(s.x, s.x + 11, s.h);
  s.b.bump(s.x + 2, t - 3, 1).bump(s.x + 5, t - 3, 0).bump(s.x + 8, t - 3, 1);
  s.b.add(pick(WORLD[w].ground, i), s.x + 10, t - 1);
  s.x += 12;
}

/** Cofre: empurre a caixa até a placa; o portão da ilha alta abre e o coração fica livre. */
function vault(s: Seg, w: number, i: number) {
  const t = top(s);
  s.b.ground(s.x, s.x + 16, s.h);
  s.b.pushbox(s.x + 1, t - 1);
  s.b.plate(s.x + 4, t - 1, 1).plate(s.x + 5, t - 1, 1);
  s.b.block(s.x + 6, t - 1, s.x + 7, t - 1); // degrau: também trava a caixa sobre a placa
  s.b.block(s.x + 8, t - 3, s.x + 13, t - 3); // ilha: dá para passar por baixo
  const gh = Math.min(4, t - 4);
  s.b.gate(s.x + 9, t - 4 - gh + 1, gh, 1);
  s.b.chest(s.x + 11, t - 4).coins(s.x + 10, s.x + 13, t - 5);
  s.b.add(pick(WORLD[w].ground, i), s.x + 15, t - 1);
  s.x += 17;
}

/**
 * Anexo: uma sala fechada no alto de uma torre de pedra. A porta no chão leva até ela;
 * lá dentro há espinhos, um inimigo e um baú. Precisa das linhas extras no topo (padTop).
 */
function annex(s: Seg, w: number, i: number) {
  const t = top(s);
  const x = s.x;
  s.b.ground(x, x + 15, s.h);
  // casca da sala (linhas 1..8) e pilar que a sustenta
  s.b.block(x, 1, x + 13, 1).block(x, 8, x + 13, 8).block(x, 1, x, 8).block(x + 13, 1, x + 13, 8);
  s.b.block(x + 5, 9, x + 8, Math.max(9, t - 4)); // pende da sala; o chão embaixo continua livre
  s.b.chamber(x + 1, 7, 12, 6);
  s.b.door(x + 11, t - 1, 1);
  s.b.door(x + 2, 7, 1);
  s.b.spikes(x + 6, x + 7, 7);
  s.b.coins(x + 5, x + 8, 4);
  s.b.oneway(x + 5, x + 8, 5);
  s.b.add(pick(WORLD[w].ground, i), x + 10, 7);
  s.b.chest(x + 12, 7);
  s.x += 16;
}

/**
 * Entrada secreta, sempre escondida. O portal só aparece depois de:
 *  - bater a cabeça num bloco invisível (as faíscas no alto denunciam o lugar);
 *  - quebrar uma das caixas que o emparedam (echarpe, tiro ou mergulho);
 *  - quebrar o piso rachado que cobre uma câmara (mergulho estelar, só no mundo 7).
 */
function secret(s: Seg, w: number, i: number) {
  const t = top(s);
  const sub = (w + i) % SUB_COUNT;
  const modes = w === 7 ? [1, 2, 3] : [1, 2];
  const mode = w === 7 ? modes[i % 3] : modes[(w + i) % 2];
  s.b.ground(s.x, s.x + 15, s.h);
  const x = s.x;
  if (mode === 1) {
    s.b.bump(x + 7, t - 3, 3);
    s.b.coins(x + 6, x + 8, t - 5);
    s.b.portal(x + 11, t - 1, sub, 1);
  } else if (mode === 2) {
    for (const c of [x + 8, x + 10]) { s.b.add('crate', c, t - 1); s.b.add('crate', c, t - 2); }
    s.b.add('crate', x + 9, t - 2);
    s.b.coins(x + 8, x + 10, t - 4);
    s.b.portal(x + 9, t - 1, sub, 2);
  } else {
    const c = x + 4;
    s.b.block(c - 2, t - 1, c - 2, t - 1).block(c - 1, t - 2, c - 1, t - 1).block(c, t - 3, c, t - 1);
    s.b.block(c + 3, t - 3, c + 3, t - 1).block(c + 4, t - 2, c + 4, t - 1).block(c + 5, t - 1, c + 5, t - 1);
    s.b.cracked(c + 1, c + 2, t - 3);
    s.b.oneway(c + 2, c + 2, t - 2); // degrau lá dentro, para conseguir sair
    s.b.portal(c + 1, t - 1, sub, 3);
    s.b.coins(c + 1, c + 2, t - 5);
  }
  s.x += 16;
}

/** Linhas extras no alto da fase para a torre (o mapa deixa de ser só horizontal). */
export const TOWER_PAD = 10;
const ROOM_PAD = 10;

/**
 * Torre: um poço de ~16 linhas. Íris sobe em zigue-zague por plataformas finas (2 blocos por salto),
 * atravessa o topo e salta para o outro lado do muro. Muro no lado direito do chão ao topo.
 */
function tower2(s: Seg, w: number, i: number) {
  const t = top(s);
  const x = s.x;
  s.b.ground(x, x + 17, s.h);
  // muro da direita (obriga a subir) e muro da esquerda só no alto, para a entrada ficar aberta
  s.b.block(x + 13, t - 17, x + 13, t - 1);
  s.b.block(x + 2, t - 17, x + 2, t - 6);
  // zigue-zague: esquerda (x+3..x+5) e direita (x+9..x+11), subindo 2 linhas por plataforma
  for (let k = 0; k < 8; k++) {
    const r = t - 2 - k * 2;
    const left = k % 2 === 0;
    const c0 = left ? x + 3 : x + 8;
    s.b.oneway(c0, c0 + 2, r);
    s.b.coins(c0, c0 + 2, r - 1);
  }
  // passarela do topo, que passa por cima do muro e termina num beiral
  s.b.oneway(x + 3, x + 16, t - 18);
  s.b.add('heart', x + 8, t - 19);
  s.b.coins(x + 5, x + 15, t - 19);
  s.b.add(pick(WORLD[w].ground, i), x + 16, t - 1);
  s.b.camera(x + 2, x + 15, 0.88); // a torre inteira cabe melhor com a câmera afastada
  s.x += 18;
}


/** Corredor de espinhos em pares, com inimigos entre eles. */
function gauntlet(s: Seg, w: number, i: number) {
  const t = top(s);
  s.b.ground(s.x, s.x + 19, s.h);
  const at = [rint(s, 3, 4), rint(s, 8, 9), rint(s, 13, 14)];
  at.forEach((c) => { s.b.spikes(s.x + c, s.x + c + 1, t - 1); s.b.coins(s.x + c, s.x + c + 1, t - 3); });
  s.b.add(pick(WORLD[w].ground, i), s.x + 6, t - 1);
  s.b.add(pick(WORLD[w].ground, i + 1), s.x + 11, t - 1);
  s.b.add(pick(WORLD[w].air, i), s.x + rint(s, 7, 12), t - 5);
  s.b.add(pick(WORLD[w].ground, i + 2), s.x + 17, t - 1);
  s.x += 20;
}

/** Fosso de espinhos longo, com blocos pequenos em alturas variadas. */
function zigzag(s: Seg, w: number, i: number) {
  const t = top(s);
  const n = rint(s, 5, 6);
  const gap = WORLD[w].dj ? rint(s, 2, 3) : 2;
  s.b.ground(s.x, s.x + n * (2 + gap) + 1, 1).spikes(s.x, s.x + n * (2 + gap) + 1, s.rows - 2);
  let x = s.x + 1, last = t - 1;
  for (let k = 0; k < n; k++) {
    const r = Math.max(t - 4, Math.min(t - 1, last + oneOf(s, [-2, -1, 0, 1, 2])));
    s.b.block(x, r, x + 1, r);
    if (k % 2 === 1) s.b.coins(x, x + 1, r - 1);
    if (k === 2) s.b.add(pick(WORLD[w].air, i), x + 1, r - 3);
    last = r;
    x += 2 + gap;
  }
  s.x = x + 1;
  flat(s, 2);
}

/** Bandeirola educativa sobre dois degraus finos: um desvio opcional e sem perigo. */
function pennantNook(s: Seg, n: number) {
  const t = top(s);
  const x = s.x;
  s.b.ground(x, x + 9, s.h);
  s.b.oneway(x + 1, x + 2, t - 2);
  s.b.oneway(x + 4, x + 6, t - 4);
  s.b.coins(x + 1, x + 2, t - 3);
  s.b.pennant(x + 5, t - 5, n);
  s.x += 10;
}

/** Ponte que desmorona: plataformas finas sobre espinhos; é preciso seguir sem parar. */
function crumbleBridge(s: Seg, w: number, i: number) {
  const t = top(s);
  const n = rint(s, 4, 6);
  const step = WORLD[w].dj ? 4 : 3; // distância entre as peças (vão de 1-2 blocos)
  s.b.ground(s.x, s.x + n * step + 2, 1).spikes(s.x, s.x + n * step + 2, s.rows - 2);
  let x = s.x + 1;
  for (let k = 0; k < n; k++) {
    s.b.crumble(x, t - (k % 2 ? 2 : 1), 2);
    if (k % 2 === 0) s.b.coins(x, x + 1, t - (k % 2 ? 4 : 3));
    if (k === 2) s.b.add(pick(WORLD[w].air, i), x + 1, t - 5);
    x += step;
  }
  s.x = x + 2;
  flat(s, 2);
}

/** Emboscada: caixas servem de abrigo e três inimigos fecham o corredor. */
function ambush(s: Seg, w: number, i: number) {
  const t = top(s);
  s.b.ground(s.x, s.x + 15, s.h);
  s.b.add('crate', s.x + 3, t - 1).add('crate', s.x + 3, t - 2);
  s.b.add('crate', s.x + 9, t - 1);
  s.b.add(pick(WORLD[w].ground, i), s.x + 5, t - 1);
  s.b.add(pick(WORLD[w].ground, i + 1), s.x + 7, t - 1);
  s.b.add(pick(WORLD[w].ground, i + 2), s.x + 12, t - 1);
  s.b.add(pick(WORLD[w].air, i), s.x + 8, t - 4);
  s.b.coins(s.x + 4, s.x + 8, t - 3);
  s.x += 16;
}

// ---------- desafios de assinatura: dois por mundo, construídos em volta da mecânica dele ----------
// Sempre entram no trecho da fase (os demais desafios continuam sorteados da biblioteca comum).

/** Encontros desenhados: quem anda no chão e quem voa juntos em cada mundo, por ordem de aparição. */
const DUOS: Record<number, [EntityType, EntityType][]> = {
  1: [['blot', 'moth'], ['beetle', 'rumor'], ['padlock', 'moth']],
  2: [['scorpion', 'moth'], ['megaphone', 'rumor'], ['joke', 'moth']],
  3: [['padlock', 'drone'], ['megaphone', 'drone'], ['label', 'rumor']],
  4: [['snapper', 'moth'], ['silence', 'stare'], ['joke', 'moth']],
  5: [['padlock', 'puffer'], ['blot', 'puffer']],
  6: [['silence', 'comet'], ['megaphone', 'stare'], ['label', 'comet']],
  7: [['sentinel', 'drone'], ['snapper', 'stare'], ['scorpion', 'rumor']],
};
const duo = (w: number, i: number) => DUOS[w][i % DUOS[w].length];

/** Mundo 1 — Jardim de flores-ponte: restaurar os Desbotados abre a escada de flores até o coração. */
function bloomGarden(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  const [g, a] = duo(w, i);
  s.b.ground(x, x + 14, s.h);
  s.b.add(g, x + 4, t - 1).add(duo(w, i + 1)[0], x + 11, t - 1);
  s.b.bloom(x + 5, t - 2, 2).bloom(x + 8, t - 4, 2);
  s.b.coins(x + 5, x + 6, t - 3).coins(x + 8, x + 9, t - 5).add('heart', x + 9, t - 6);
  s.b.add(a, x + 12, t - 5);
  s.x += 15;
}

/** Mundo 1 — Pomar das molas: a mola leva a uma ilha alta; do alto se vê (e se evita) o que vem a seguir. */
function springOrchard(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  const [g, a] = duo(w, i);
  s.b.ground(x, x + 15, s.h);
  s.b.add('spring', x + 3, t - 1);
  s.b.block(x + 5, t - 5, x + 9, t - 5).coins(x + 5, x + 9, t - 6);
  s.b.fadeplat(x + 11, t - 6, 2, 0.4).add('heart', x + 12, t - 7);
  s.b.add(g, x + 8, t - 1).add(g, x + 13, t - 1).add(a, x + 12, t - 3);
  s.x += 16;
}

/** Mundo 2 — Corrente de gêiseres: pilares sobre um fosso de espinhos; cada gêiser lança até o próximo. */
function geyserChain(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  s.b.ground(x, x + 19, 1).spikes(x, x + 19, s.rows - 2);
  for (const c of [x, x + 6, x + 12, x + 18]) s.b.block(c, t, c + 1, s.rows - 1);
  s.b.vent(x + 1, t - 1, 2.4, 0).vent(x + 7, t - 1, 2.4, 0.33).vent(x + 13, t - 1, 2.4, 0.66);
  s.b.coinArc(x + 2, t - 5, 4).coinArc(x + 8, t - 5, 4).coinArc(x + 14, t - 5, 4);
  s.b.add(duo(w, i)[1], x + 10, t - 7);
  s.x += 20;
  flat(s, 2);
}

/** Mundo 2 — Mesas do cânion: degraus altos de rocha com vigias; um gêiser no pé leva direto ao topo. */
function mesaSteps(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  const [g, a] = duo(w, i);
  s.b.ground(x, x + 19, s.h);
  s.b.block(x + 4, t - 2, x + 7, t - 1).block(x + 8, t - 4, x + 12, t - 1).block(x + 13, t - 2, x + 15, t - 1);
  s.b.vent(x + 2, t - 1);
  s.b.add(g, x + 6, t - 3).add(duo(w, i + 1)[0], x + 10, t - 5).add(a, x + 14, t - 6);
  s.b.coins(x + 9, x + 11, t - 6).add('heart', x + 10, t - 8);
  s.x += 20;
}

/** Mundo 3 — Telhados: prédios de alturas diferentes com becos entre eles; drones vigiam por cima. */
function rooftops(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  const [g, a] = duo(w, i);
  s.b.ground(x, x + 21, s.h);
  const roofs: [number, number, number][] = [[x + 2, x + 4, 2], [x + 7, x + 10, 4], [x + 13, x + 15, 3], [x + 18, x + 19, 1]];
  for (const [c0, c1, hgt] of roofs) {
    s.b.block(c0, t - hgt, c1, t - 1);
    s.b.coins(c0, c1, t - hgt - 1);
  }
  s.b.add(g, x + 5, t - 1).add(duo(w, i + 1)[0], x + 11, t - 1).add(g, x + 16, t - 1);
  s.b.add(a, x + 9, t - 8).add(a, x + 16, t - 6);
  s.x += 22;
}

/** Mundo 3 — Beco dos holofotes: dois fachos fora de fase; atravessar é questão de ritmo. */
function lightAlley(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  s.b.ground(x, x + 21, s.h);
  s.b.searchlight(x + 6, 1, t, 3, 3.2, 0).searchlight(x + 15, 1, t, 3, 3.2, 0.5);
  s.b.oneway(x + 10, x + 11, t - 3).coins(x + 10, x + 11, t - 4);
  s.b.add(duo(w, i)[0], x + 11, t - 1).add(duo(w, i + 1)[0], x + 20, t - 1);
  s.x += 22;
}

/** Mundo 4 — Copas: três andares de galhos; no chão as plantas-armadilha, no alto as faíscas e o coração. */
function canopyLayers(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  const [g, a] = duo(w, i);
  s.b.ground(x, x + 17, s.h);
  s.b.oneway(x + 2, x + 5, t - 2).oneway(x + 6, x + 10, t - 4).oneway(x + 11, x + 14, t - 6);
  s.b.coins(x + 3, x + 5, t - 3).coins(x + 7, x + 9, t - 5).coins(x + 11, x + 13, t - 7);
  s.b.bloom(x + 15, t - 7, 2).add('heart', x + 16, t - 8);
  s.b.add(g, x + 7, t - 1).add(g, x + 12, t - 1).add(duo(w, i + 1)[0], x + 16, t - 1);
  s.b.add(a, x + 9, t - 7);
  s.x += 18;
}

/** Mundo 4 — Raízes gigantes: dois arcos de raiz; por cima é mais longo, por baixo há quem morda. */
function giantRoots(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  const [g, a] = duo(w, i);
  s.b.ground(x, x + 21, s.h);
  for (const c of [x + 3, x + 12]) {
    s.b.block(c, t - 2, c, t - 1).block(c + 1, t - 4, c + 5, t - 4).block(c + 6, t - 2, c + 6, t - 1);
    s.b.coins(c + 1, c + 5, t - 5);
    s.b.add(g, c + 3, t - 1);
  }
  s.b.add(a, x + 10, t - 6);
  s.x += 22;
}

/** Mundo 5 — Portões de coral: paredes com passagem ora embaixo, ora em cima; os baiacus guardam as frestas. */
function coralGates(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  s.b.ground(x, x + 19, s.h);
  s.b.block(x + 4, 3, x + 4, t - 4).block(x + 10, 6, x + 10, t - 1).block(x + 16, 3, x + 16, t - 4);
  s.b.add('puffer', x + 7, t - 3).add('puffer', x + 13, 4);
  s.b.coins(x + 3, x + 5, t - 2).coins(x + 9, x + 11, 4).coins(x + 15, x + 17, t - 2);
  s.b.add(duo(w, i)[0], x + 18, t - 1);
  s.x += 20;
}

/** Mundo 5 — Corrente marinha: um trecho em que a água empurra para a frente por entre recifes baixos. */
function seaCurrent(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  s.b.ground(x, x + 21, s.h);
  s.b.wind(x + 2, 4, 18, t - 5, 1, 170);
  s.b.block(x + 6, t - 2, x + 7, t - 1).block(x + 13, t - 3, x + 14, t - 1);
  s.b.coinArc(x + 4, 6, 6).coinArc(x + 11, 5, 6);
  s.b.add('puffer', x + 10, 4).add('puffer', x + 17, 7).add(duo(w, i)[0], x + 19, t - 1);
  s.x += 22;
}

/** Mundo 6 — Escada de estrelas: duas plataformas que sobem e descem ligam a ilha do meio, sobre o vazio. */
function starLadder(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  s.b.mover(x + 1, t, 0, -3, 2, 4, 0);
  s.b.block(x + 5, t - 3, x + 7, t - 3).coins(x + 5, x + 7, t - 4);
  s.b.mover(x + 10, t - 3, 0, 3, 2, 4, 0);
  s.b.add(duo(w, i)[1], x + 6, t - 7);
  s.x += 13;
  flat(s, 3);
}

/** Mundo 6 — Chuva de cometas: terraços leves de nuvem e três vigias do céu; quem sobe encontra o coração. */
function cometTerraces(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  const [g, a] = duo(w, i);
  s.b.ground(x, x + 19, s.h);
  s.b.oneway(x + 2, x + 4, t - 2).oneway(x + 7, x + 9, t - 4).oneway(x + 12, x + 14, t - 4).oneway(x + 16, x + 18, t - 2);
  s.b.crumble(x + 10, t - 6, 2).add('heart', x + 10, t - 7);
  s.b.coins(x + 7, x + 9, t - 5).coins(x + 12, x + 14, t - 5);
  s.b.add(g, x + 6, t - 1).add(g, x + 14, t - 1).add(a, x + 5, t - 6).add(a, x + 15, t - 7);
  s.x += 20;
}

/** Mundo 7 — Passarela desbotada: embaixo, espinhos e sentinelas; em cima, um caminho que só existe com cor. */
function fadedWalk(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  const [g, a] = duo(w, i);
  s.b.ground(x, x + 21, s.h);
  s.b.spikes(x + 6, x + 7, t - 1).spikes(x + 13, x + 14, t - 1);
  s.b.add(g, x + 4, t - 1).add(duo(w, i + 1)[0], x + 10, t - 1).add(g, x + 17, t - 1);
  s.b.oneway(x + 1, x + 2, t - 2);
  for (const c of [x + 4, x + 8, x + 12, x + 16]) s.b.fadeplat(c, t - 4, 2, 0.35).coins(c, c + 1, t - 5);
  s.b.add('heart', x + 13, t - 6).add(a, x + 10, t - 7);
  s.x += 22;
}

/** Mundo 7 — Cofre de cor: um cofre suspenso que só abre depois de quatro restaurações na fase. */
function colorVault(s: Seg, w: number, i: number) {
  const t = top(s), x = s.x;
  s.b.ground(x, x + 13, s.h);
  s.b.block(x + 2, t - 4, x + 6, t - 4).block(x + 2, t - 7, x + 5, t - 7).block(x + 2, t - 6, x + 2, t - 5);
  s.b.colorgate(x + 5, t - 6, 2, 4).chest(x + 3, t - 5).coins(x + 4, x + 4, t - 5);
  s.b.oneway(x + 8, x + 9, t - 2);
  s.b.add(duo(w, i)[0], x + 4, t - 1).add(duo(w, i + 1)[0], x + 11, t - 1);
  s.x += 14;
}

/** Os dois desafios de assinatura de cada mundo. */
export const SIGNATURE: Record<number, [string, string]> = {
  1: ['bloomGarden', 'springOrchard'],
  2: ['geyserChain', 'mesaSteps'],
  3: ['rooftops', 'lightAlley'],
  4: ['canopyLayers', 'giantRoots'],
  5: ['coralGates', 'seaCurrent'],
  6: ['starLadder', 'cometTerraces'],
  7: ['fadedWalk', 'colorVault'],
};

const BEATS: Record<string, (s: Seg, w: number, i: number) => void> = { mountain, islands, tower, crates, twoRoutes, pit, mover, vent, searchlight, chimney, bumps, vault, tower2, gauntlet, zigzag, ambush, crumbleBridge, bloomGarden, springOrchard, geyserChain, mesaSteps, rooftops, lightAlley, canopyLayers, giantRoots, coralGates, seaCurrent, starLadder, cometTerraces, fadedWalk, colorVault };

// Dificuldade de cada desafio (1 = calmo, 3 = exigente). Os mundos iniciais só sorteiam os mais leves.
const RATING: Record<string, number> = {
  mountain: 1, tower: 1, crates: 1, vent: 1, islands: 2, twoRoutes: 2, pit: 2, mover: 2, searchlight: 2, ambush: 2,
  chimney: 3, gauntlet: 3, zigzag: 3, crumbleBridge: 3,
  bloomGarden: 1, springOrchard: 1, mesaSteps: 1, geyserChain: 2, rooftops: 2, lightAlley: 2, canopyLayers: 1, giantRoots: 2,
  coralGates: 2, seaCurrent: 1, cometTerraces: 2, starLadder: 3, fadedWalk: 2, colorVault: 1,
};
/** Quanto de dificuldade a fase aguenta: sobe com o mundo (1 a 7) e com o número da fase (0 a 2). */
export const allowedRating = (w: number, v: number) => 1.75 + (w - 1) * 0.25 + v * 0.2;

/** Monta o trecho do mundo `w` (variação `v` = número da fase - 1). */
/**
 * Monta o conteúdo gerado de uma fase.
 * Sem `part`, sai tudo num bloco só (como era). Com `part`, sai uma das duas metades, que
 * entram em pontos diferentes da fase: 0 = dois desafios e um cofre/blocos-surpresa (antes do
 * meio); 1 = os desafios restantes, a torre, a bandeirola, a sala anexa e o portal (depois do meio).
 */
export function buildSegment(w: number, v: number, h: number, rows: number, tall = false, room = false, part?: 0 | 1) {
  const b = new LevelBuilder('seg', 'seg', w, 220, rows);
  const s: Seg = { b, x: 0, h, rows, r: rng(w * 1009 + v * 7919 + 17) };
  flat(s, 3);
  b.add('checkpoint', 1, top(s) - 1); // inserção condicionada à distância dos checkpoints originais
  // Os dois desafios de assinatura do mundo sempre entram; o resto vem embaralhado (com a semente
  // da fase) da biblioteca comum, limitado pela dificuldade que a fase aguenta.
  const sig = SIGNATURE[w];
  const all = [...WORLD[w].beats, 'gauntlet', 'zigzag', 'ambush', 'crumbleBridge'];
  const lim = allowedRating(w, v);
  let pool = all.filter((n) => RATING[n] <= lim);
  // mundo 1 tem 3 desafios (ensina); do 2 em diante, 4. Nas fases com torre, ela ocupa a última vaga.
  const count = w === 1 ? 3 : 4;
  const tower = tall && top(s) - 19 >= 0;
  const extra = Math.max(0, count - sig.length - (tower ? 1 : 0));
  if (pool.length < extra) pool = all.sort((a, b) => RATING[a] - RATING[b]).slice(0, extra);
  for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(s.r() * (k + 1)); [pool[k], pool[j]] = [pool[j], pool[k]]; }
  // ordem crescente de dificuldade dentro da fase
  const chosen = [...sig, ...pool.slice(0, extra)].sort((a, b) => RATING[a] - RATING[b]);
  // a segunda metade tem a própria sequência de sorteios, para não depender do tamanho da primeira
  if (part === 1) s.r = rng(w * 1009 + v * 7919 + 4099);
  const half = Math.ceil(chosen.length / 2);
  const first = part !== 1, second = part !== 0;
  chosen.forEach((name, k) => {
    if (k < half ? !first : !second) return;
    BEATS[name](s, w, v + k);
    flat(s, rint(s, 1, 3));
  });
  if (tower && second) { tower2(s, w, v); flat(s, rint(s, 1, 3)); }
  if (first) { (v % 2 ? vault : bumps)(s, w, v); flat(s, 2); }
  if (second) {
    const order = [1, 2, 3, 4, 6, 7].indexOf(w);
    if (order >= 0 && v !== 1) { pennantNook(s, order * 2 + (v === 2 ? 1 : 0)); flat(s, 2); }
    if (room) { annex(s, w, v); flat(s, 2); }
    secret(s, w, v);
    flat(s, 2);
  }
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
/** Melhor ponto de emenda entre as frações `lo` e `hi` da fase, o mais perto possível de `aim`. */
function findInsertion(l: LevelData, lo = 0.3, hi = 0.8, aim = (lo + hi) / 2) {
  for (const radius of [4, 2]) {
    const c = findInsertionAt(l, radius, lo, hi, aim);
    if (c !== undefined) return c;
  }
  return undefined;
}

function findInsertionAt(l: LevelData, radius: number, lo: number, hi: number, aim: number) {
  // só o que ocupa várias colunas não pode ser cortado ao meio; o resto apenas se desloca.
  // Inimigos e objetos de chão logo em cima do ponto também ficam de fora (o trecho começa no chão).
  const SPAN = new Set(['wind', 'gravzone', 'storm', 'mover', 'searchlight', 'vent', 'spring', 'checkpoint', 'guardian', 'exit']);
  const busy = (c: number) =>
    l.entities.some((e) => {
      if (!SPAN.has(e.type)) return e.type !== 'coin' && Math.abs(e.col - c) <= 1;
      const reach = e.type === 'wind' || e.type === 'gravzone' || e.type === 'storm' ? (e.data?.w ?? 0) : e.type === 'mover' ? (e.data?.dx ?? 0) + (e.data?.width ?? 2) : e.type === 'searchlight' ? (e.data?.swing ?? 3) + 1 : 0;
      const from = e.type === 'searchlight' ? e.col - reach : e.col;
      return c >= from - 2 && c <= e.col + reach + 2;
    }) || l.hints.some((h) => Math.abs(h.col - c) < 4);
  const from = Math.floor(l.cols * lo), to = Math.floor(l.cols * hi);
  const mid = l.cols * aim;
  const candidates: number[] = [];
  for (let c = from; c <= to; c++) {
    const r = surfaceRow(l, c);
    // emenda: as duas colunas dos dois lados no mesmo nível, sem nada acima delas
    if (r < 2 || surfaceRow(l, c - 1) !== r || busy(c) || busy(c - 1)) continue;
    // nada de partir um trecho de paredes/pilares: `radius` colunas de cada lado também são chão liso
    let flat = true;
    for (let k = -radius; k <= radius && flat; k++) flat = surfaceRow(l, c + k) === r;
    if (!flat) continue;
    candidates.push(c);
  }
  candidates.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  return candidates[0];
}

/** Devolve a fase com o trecho extra encaixado (fases de chefão ficam iguais). */
/** Acrescenta `n` linhas vazias no alto da fase (tudo desce `n` linhas). */
function padTop(l: LevelData, n: number): LevelData {
  const empty = Array.from({ length: n }, () => new Array<T>(l.cols).fill(T.Empty));
  return {
    ...l,
    rows: l.rows + n,
    tiles: [...empty, ...l.tiles],
    entities: l.entities.map((e) => ({ ...e, row: e.row + n })),
    hints: l.hints.map((h) => ({ ...h, row: h.row + n })),
  };
}

export function extendLevel(base: LevelData, variant: number): LevelData {
  if (base.arena) return base;
  // terceira fase de cada mundo (sem água): ganha uma torre, então o mapa cresce para cima
  const tall = variant === 2 && base.water === undefined;
  // segunda fase de cada mundo (sem água): ganha uma sala conectada por portas, no alto
  const room = variant === 1 && base.water === undefined;
  const l = tall ? padTop(base, TOWER_PAD) : room ? padTop(base, ROOM_PAD) : base;
  // Duas emendas: metade do conteúdo gerado entra antes do meio da fase e metade depois, com o
  // trecho autoral no meio (melhor ritmo do que um bloco único). Sem dois bons pontos, volta ao bloco único.
  const early = findInsertion(l, 0.2, 0.48, 0.36), late = findInsertion(l, 0.56, 0.86, 0.7);
  if (early !== undefined && late !== undefined && late - early >= 24) {
    // a emenda mais adiante entra primeiro, para não deslocar a de trás
    return insertSegment(insertSegment(l, late, variant, tall, room, 1), early, variant, tall, room, 0);
  }
  const at = findInsertion(l);
  if (at === undefined) return base;
  return insertSegment(l, at, variant, tall, room);
}

/** Encaixa o conteúdo gerado (inteiro ou uma das metades) na coluna `at` da fase. */
function insertSegment(l: LevelData, at: number, variant: number, tall: boolean, room: boolean, part?: 0 | 1): LevelData {
  const h = l.rows - surfaceRow(l, at);
  const { b, width } = buildSegment(l.world, variant, h, l.rows, tall, room, part);
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
  // zonas de câmera: as autorais deslocam junto; as do trecho novo entram na posição dele
  const cameras = [
    ...(l.cameras ?? []).map((z) => (z.c0 >= at ? { ...z, c0: z.c0 + width, c1: z.c1 + width } : z)),
    ...(seg.cameras ?? []).map((z) => ({ ...z, c0: z.c0 + at, c1: z.c1 + at })),
  ];
  return { ...l, cols: l.cols + width, tiles, entities, hints: l.hints.map(shift), cameras };
}

/**
 * Troca degraus de 1 bloco por rampas, onde cabe com folga: chão plano antes do degrau, nada
 * em cima e nenhum objeto ou criatura por perto. Vale para o trecho autoral e para o gerado.
 */
export function autoRamps(l: LevelData): LevelData {
  if (l.arena || l.water !== undefined) return l;
  const { cols, rows } = l;
  const tiles = l.tiles.map((row) => [...row]);
  const at = (c: number, r: number) => (c < 0 || c >= cols || r < 0 || r >= rows ? T.Solid : tiles[r][c]);
  const free = (c: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) if (r >= 0 && at(c, r) !== T.Empty) return false; return true; };
  // chão plano com 4 linhas livres em cima
  const flatTop = (c: number, r: number) => at(c, r) === T.Solid && free(c, r - 4, r - 1);
  const busy = (c0: number, c1: number, r0: number, r1: number) =>
    l.entities.some((e) => {
      const w = e.type === 'wind' || e.type === 'gravzone' ? (e.data?.w ?? 1) : e.type === 'mover' ? (e.data?.dx ?? 0) + (e.data?.width ?? 2) : e.type === 'bloom' || e.type === 'fadeplat' || e.type === 'crumble' ? (e.data?.w ?? 2) : 1;
      const pad = e.type === 'coin' ? 0 : 1; // criaturas e objetos pedem uma coluna de folga; faíscas, não
      return e.col + w - 1 >= c0 - pad && e.col <= c1 + pad && e.row >= r0 && e.row <= r1;
    });
  for (let r = 3; r < rows - 1; r++) {
    for (let c = 4; c < cols - 4; c++) {
      // degrau subindo para a direita: chão baixo em c-3..c-1 (linha r+1) e bloco alto em c (linha r)
      if (flatTop(c, r) && at(c + 1, r) === T.Solid && flatTop(c - 1, r + 1) && flatTop(c - 2, r + 1) && flatTop(c - 3, r + 1) && !busy(c - 3, c, r - 4, r + 1)) {
        tiles[r][c - 2] = T.RampR1;
        tiles[r][c - 1] = T.RampR2;
      }
      // degrau descendo para a direita: bloco alto em c (linha r) e chão baixo em c+1..c+3 (linha r+1)
      if (flatTop(c, r) && at(c - 1, r) === T.Solid && flatTop(c + 1, r + 1) && flatTop(c + 2, r + 1) && flatTop(c + 3, r + 1) && !busy(c, c + 3, r - 4, r + 1)) {
        tiles[r][c + 1] = T.RampL2;
        tiles[r][c + 2] = T.RampL1;
      }
    }
  }
  return { ...l, tiles };
}
