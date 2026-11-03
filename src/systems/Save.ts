// Persistência de progresso no navegador, com validação de dados e tolerância a storage bloqueado.
// A chave v1 é mantida para preservar saves das versões anteriores.
const KEY = 'prisma-save-v1';
const LEVEL_ID = /^[1-7]-[1-4]$/;
const MAX_LEVEL_INDEX = 27;

export interface SaveData {
  level: number;
  completed: string[];
  doubleJump: boolean;
  dash: boolean;
  wallJump: boolean;
  glide: boolean;
  shot: boolean;
  pound: boolean;
  extraHeart: boolean;
  finished: boolean;
  shards: Record<string, boolean[]>;
  /** Sub-níveis secretos já concluídos, por fase. */
  secrets: Record<string, boolean>;
}

const fresh = (): SaveData => ({
  level: 0, completed: [], doubleJump: false, dash: false, wallJump: false,
  glide: false, shot: false, pound: false, extraHeart: false, finished: false, shards: {}, secrets: {},
});

const abilities = ['doubleJump', 'dash', 'wallJump', 'glide', 'shot', 'pound', 'extraHeart', 'finished'] as const;

export function normalizeSave(value: unknown): SaveData {
  const result = fresh();
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return result;
  const data = value as Record<string, unknown>;

  if (typeof data.level === 'number' && Number.isFinite(data.level)) {
    result.level = Math.max(0, Math.min(MAX_LEVEL_INDEX, Math.trunc(data.level)));
  }

  if (Array.isArray(data.completed)) {
    result.completed = [...new Set(data.completed.filter((id): id is string =>
      typeof id === 'string' && LEVEL_ID.test(id)
    ))];
  }

  for (const ability of abilities) {
    if (typeof data[ability] === 'boolean') result[ability] = data[ability] as boolean;
  }

  if (data.shards && typeof data.shards === 'object' && !Array.isArray(data.shards)) {
    for (const [id, values] of Object.entries(data.shards)) {
      if (!LEVEL_ID.test(id) || !Array.isArray(values)) continue;
      result.shards[id] = Array.from({ length: 3 }, (_, index) => values[index] === true);
    }
  }
  if (data.secrets && typeof data.secrets === 'object' && !Array.isArray(data.secrets)) {
    for (const [id, v] of Object.entries(data.secrets)) if (LEVEL_ID.test(id) && v === true) result.secrets[id] = true;
  }
  return result;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeSave(JSON.parse(raw) as unknown) : fresh();
  } catch {
    return fresh();
  }
}

/** Retorna false quando o navegador não permitir persistência; nunca interrompe o jogo. */
export function writeSave(data: SaveData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeSave(data)));
    return true;
  } catch {
    return false;
  }
}

export function hasSave(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const value: unknown = JSON.parse(raw);
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  } catch {
    return false;
  }
}

export function clearSave(): boolean {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
