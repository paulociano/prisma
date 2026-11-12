// Verificador de alcance das fases. Rode com:  npm run check-levels   (ou com --base: fases sem o trecho extra)
// Simula os pulos de Íris com a mesma física do jogo (src/config.ts) sobre a grade de cada
// fase e procura um caminho do início até a saída.
// Simplificações conservadoras: inimigos ignorados; caixas e o cristal do guardião contam como
// quebráveis; plataformas móveis valem como piso em todo o percurso delas; fases submersas
// (nado livre) são puladas.
import { PHYS } from '../src/config';
import { BASE, LEVELS } from '../src/levels';
import type { LevelData } from '../src/levels/LevelBuilder';
import { buildSub, SUB_COUNT } from '../src/levels/subs';

const TILE = 64, W = 40, H = 92, DT = 1 / 60;

interface Opts {
  dj: boolean;
  dash: boolean;
  wj: boolean;
}

export function checkLevel(level: LevelData, opts: Opts) {
  const gs = level.gravity ?? 1;
  const { rows, cols, tiles } = level;
  // grade: 0 vazio, 1 sólido, 2 atravessável (inclui percurso das plataformas móveis), 3 espinho
  const grid = new Uint8Array(rows * cols);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) grid[r * cols + c] = tiles[r][c];
  for (const e of level.entities) {
    if (e.type === 'crumble') for (let c = e.col; c < e.col + (e.data?.w ?? 2) && c < cols; c++) if (grid[e.row * cols + c] === 0) grid[e.row * cols + c] = 2;
  }
  for (const e of level.entities) {
    if (e.type !== 'mover' || !e.data) continue;
    const d = e.data;
    for (let r = Math.min(e.row, e.row + d.dy); r <= Math.max(e.row, e.row + d.dy); r++)
      for (let c = e.col; c <= Math.min(cols - 1, e.col + d.dx + d.width - 1); c++) if (grid[r * cols + c] === 0) grid[r * cols + c] = 2;
  }
  const at = (c: number, r: number) => (c < 0 || c >= cols ? 1 : r < 0 || r >= rows ? 0 : grid[r * cols + c]);
  const launchers = new Map<number, number>();
  for (const e of level.entities) {
    if (e.type === 'spring') launchers.set(e.col, PHYS.springVel);
    if (e.type === 'vent') launchers.set(e.col, PHYS.ventVel);
  }
  const spikeHit = (x: number, yb: number) => {
    const c0 = Math.floor((x - W / 2 + 4) / TILE), c1 = Math.floor((x + W / 2 - 4) / TILE);
    const r0 = Math.floor((yb - H) / TILE), r1 = Math.floor((yb - 1) / TILE);
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (at(c, r) === 3 && yb > r * TILE + 26) return true;
    return false;
  };
  const boxHits = (x: number, yb: number) => {
    const c0 = Math.floor((x - W / 2) / TILE), c1 = Math.floor((x + W / 2 - 0.01) / TILE);
    const r0 = Math.floor((yb - H) / TILE), r1 = Math.floor((yb - 0.01) / TILE);
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (at(c, r) === 1) return true;
    return false;
  };
  const floorAt = (x: number, r: number) => {
    for (let c = Math.floor((x - W / 2 + 1) / TILE); c <= Math.floor((x + W / 2 - 1) / TILE); c++) {
      const t = at(c, r);
      if (t === 1 || t === 2) return true;
    }
    return false;
  };
  const supported = (x: number, yb: number) => {
    const r = Math.round(yb / TILE);
    return Math.abs(yb - r * TILE) < 0.5 && floorAt(x, r);
  };

  const out: number[] = []; // pares x, yb de pousos

  /** Voo a partir de (x, yb). Ramifica no pulo duplo, no dash e no pulo na parede. */
  const fly = (x: number, yb: number, vx: number, vy: number, holdT: number, dj: boolean, dash: boolean, wj: number) => {
    let t = 0, held = true, wallBranched = false;
    for (let step = 0; step < 200; step++) {
      t += DT;
      if (held && t > holdT && vy < 0) {
        vy *= PHYS.jumpCut;
        held = false;
      }
      vy = Math.min(PHYS.maxFall, vy + (PHYS.gravity * gs + (vy > 0 ? PHYS.fallExtraGravity * gs : 0)) * DT);
      // o jogador continua segurando a direção: encostado na parede, tenta de novo a cada quadro
      const nx = x + vx * DT;
      if (vx !== 0 && boxHits(nx, yb)) {
        if (wj > 0) {
          if (vy > PHYS.wallSlideSpeed) vy = PHYS.wallSlideSpeed; // desliza devagar na parede
          if (vy > -60 && !wallBranched) {
            wallBranched = true; // pula para longe da parede (o pulo duplo volta a valer)
            fly(x, yb, -Math.sign(vx) * PHYS.runSpeed, -PHYS.jumpVel * 0.95, 1, opts.dj, opts.dash, wj - 1);
          }
        }
      } else {
        x = nx;
        wallBranched = false;
      }
      const ny = yb + vy * DT;
      if (vy < 0) {
        if (boxHits(x, ny)) vy = 0;
        else yb = ny;
      } else {
        const r = Math.floor(ny / TILE);
        if (r * TILE >= yb - 0.01 && r * TILE <= ny && floorAt(x, r)) {
          out.push(x, r * TILE);
          return;
        }
        if (boxHits(x, ny)) return;
        yb = ny;
      }
      if (spikeHit(x, yb) || yb > rows * TILE + 60) return;
      // controle no ar: quem subiu reto pode passar a ir para um lado (ex.: elevador de vapor)
      if (vx === 0 && (step === 14 || step === 22 || step === 30)) {
        for (const d of [-1, 1]) fly(x, yb, d * PHYS.runSpeed, vy, held ? holdT - t : 0, dj, dash, wj);
      }
      if (dj && (step === 12 || step === 24)) fly(x, yb, vx, -PHYS.jumpVel * 0.9, 1, false, dash, wj);
      if (dash && vx !== 0 && (step === 16 || step === 30)) {
        // dash reto: ~0,17 s a toda velocidade, sem gravidade
        let dx = x, ok = true;
        for (let k = 0; k < Math.round(PHYS.dashTime / DT); k++) {
          const nx2 = dx + Math.sign(vx) * PHYS.dashSpeed * DT;
          if (boxHits(nx2, yb)) { ok = false; break; }
          dx = nx2;
        }
        if (ok) fly(dx, yb, vx, 0, 0, dj, false, wj);
      }
    }
  };

  const start = level.entities.find((e) => e.type === 'player')!;
  const exit = level.entities.find((e) => e.type === 'exit')!;
  const ex = exit.col * TILE + 32, ey = (exit.row + 1) * TILE;
  const seen = new Set<number>();
  const queue: number[] = [start.col * TILE + 32, (start.row + 1) * TILE];
  let furthest = 0, qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++], yb = queue[qi++];
    if (!supported(x, yb)) continue;
    const k = Math.floor(x / 24) * 10000 + Math.round(yb);
    if (seen.has(k)) continue;
    seen.add(k);
    furthest = Math.max(furthest, x);
    if (Math.abs(x - ex) < 80 && Math.abs(yb - ey) < 70) return { ok: true, furthest: Math.floor(x / TILE) };
    out.length = 0;
    for (const d of [-24, 24]) {
      const nx = x + d;
      if (boxHits(nx, yb) || spikeHit(nx, yb)) continue;
      if (supported(nx, yb)) out.push(nx, yb);
      else fly(nx, yb, Math.sign(d) * PHYS.runSpeed, 0, 0, opts.dj, opts.dash, opts.wj ? 2 : 0);
    }
    const v0 = launchers.get(Math.floor(x / TILE)) ?? PHYS.jumpVel;
    for (const dir of [-1, 0, 1]) for (const hold of [0.1, 1]) fly(x, yb, dir * PHYS.runSpeed, -v0, hold, opts.dj, opts.dash, opts.wj ? 2 : 0);
    queue.push(...out);
  }
  return { ok: false, furthest: Math.floor(furthest / TILE) };
}

const base = process.argv.includes('--base');
const only = process.argv.find((a) => /^\d-\d$/.test(a));
let fails = 0;
for (const build of base ? BASE : LEVELS) {
  const l = build();
  if (l.arena || (only && l.id !== only)) continue;
  if (l.water !== undefined) {
    if (l.tide) {
      // maré: na seca a fase vira chão firme; confere se dá para atravessar a pé (na cheia, é nado livre)
      const r = checkLevel({ ...l, water: undefined }, { dj: true, dash: true, wj: true });
      if (!r.ok) fails++;
      console.log(`${l.id}  água com maré: a pé na seca ${r.ok ? 'ok' : `NÃO CHEGA: parou na coluna ${r.furthest}`}  (${l.cols} colunas)`);
    } else console.log(`${l.id}  água (nado livre)`);
    continue;
  }
  const w = l.world, n = Number(l.id.split('-')[1]);
  // o poder de cada mundo chega na fase 3 (no guardião, antes do trecho que exige o poder)
  const got = (inWorld: number) => w > inWorld || (w === inWorld && n >= 3);
  const t0 = Date.now();
  const r = checkLevel(l, { dj: got(1), dash: got(2), wj: got(3) });
  if (!r.ok) fails++;
  console.log(`${l.id}  ${r.ok ? 'ok' : `NÃO CHEGA: parou na coluna ${r.furthest}`}  (${l.cols} colunas, ${Date.now() - t0} ms)`);
}
// sub-níveis secretos: têm que ser vencíveis só com o pulo simples
if (!base && !only) {
  for (let k = 0; k < SUB_COUNT; k++) {
    const l = buildSub(1, k);
    const r = checkLevel(l, { dj: false, dash: false, wj: false });
    if (!r.ok) fails++;
    console.log(`${l.id}  ${r.ok ? 'ok' : `NÃO CHEGA: parou na coluna ${r.furthest}`}  (sub-nível)`);
  }
}
process.exit(fails ? 1 : 0);
