// Regras dos modelos 3D (.glb): qual arquivo cada objeto usa e qual animação tocar.
// Puro (sem Three) para ser testável. O guia para quem cria os modelos está em docs/MODELOS-3D.md.
import type { EntityView } from './snapshot';

/**
 * Nome do modelo de um objeto, sem extensão. Ex.: Íris → "iris", inimigo "beetle" → "enemy-beetle",
 * chefão do mundo 3 → "boss-3", moeda → "pickup-coin", checkpoint → "prop-checkpoint".
 */
export function modelKey(e: Pick<EntityView, 'kind' | 'variant'>): string {
  switch (e.kind) {
    case 'player':
      return 'iris';
    case 'spark':
      return 'faisca';
    case 'enemy':
    case 'boss':
    case 'pickup':
    case 'prop':
      return e.variant ? `${e.kind}-${e.variant}` : e.kind;
    default:
      return e.kind; // crate, cracked, shot, mover, cage
  }
}

/**
 * Animações que podem faltar num modelo e com o que substituí-las, em ordem.
 * Assim um modelo com só "idle", "run" e "jump" já funciona com todas as habilidades.
 */
const FALLBACK: Record<string, string[]> = {
  move: ['run', 'walk', 'idle'],
  walk: ['run', 'idle'],
  run: ['walk', 'idle'],
  jump: ['idle'],
  doublejump: ['jump', 'idle'],
  wallkick: ['jump', 'idle'],
  wallslide: ['fall', 'jump', 'idle'],
  glide: ['fall', 'jump', 'idle'],
  fall: ['jump', 'idle'],
  dash: ['run', 'idle'],
  attack: ['shoot', 'idle'],
  shoot: ['attack', 'idle'],
  pound: ['fall', 'jump', 'idle'],
  swim: ['run', 'idle'],
  hurt: ['idle'],
  win: ['idle'],
};

/** Clipe a tocar para a animação pedida pelo 2D, dentre os que o modelo tem (ou undefined). */
export function clipFor(anim: string | undefined, available: readonly string[]): string | undefined {
  if (!available.length) return undefined;
  const has = new Set(available);
  for (const name of [anim ?? 'idle', ...(FALLBACK[anim ?? ''] ?? []), 'idle']) if (has.has(name)) return name;
  return available[0];
}

/** Nome da animação a partir da chave do 2D: "iris-run" → "run", "beetle-move" → "move". */
export const animName = (key: string | undefined) => (key ? key.slice(key.indexOf('-') + 1) : undefined);
