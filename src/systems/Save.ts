// Progresso salvo no navegador. Tudo protegido com try/catch: em janela anônima
// ou com armazenamento bloqueado o jogo funciona normalmente, só não lembra o progresso.

const KEY = 'prisma-save-v1';

export interface SaveData {
  /** Última fase jogada (índice em LEVELS): onde o cursor do mapa começa. */
  level: number;
  /** Ids das fases concluídas ("1-1", "1-2"...). */
  completed: string[];
  doubleJump: boolean;
  dash: boolean;
  wallJump: boolean;
  glide: boolean;
  shot: boolean;
  pound: boolean;
  extraHeart: boolean;
  /** Jogo zerado (Monocromo restaurado). */
  finished: boolean;
  /** Fragmentos coletados por fase (id da fase → 3 booleanos). */
  shards: Record<string, boolean[]>;
}

const fresh = (): SaveData => ({ level: 0, completed: [], doubleJump: false, dash: false, wallJump: false, glide: false, shot: false, pound: false, extraHeart: false, finished: false, shards: {} });

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fresh(), ...(JSON.parse(raw) as Partial<SaveData>) } : fresh();
  } catch {
    return fresh();
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // sem armazenamento disponível: segue sem salvar
  }
}

export function hasSave() {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nada a fazer
  }
}
