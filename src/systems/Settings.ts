import Phaser from 'phaser';

// Preferências do jogador (separadas do progresso). Protegidas com try/catch, como o save.

export type ColorblindMode = 'off' | 'protan' | 'deutan' | 'tritan';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Settings {
  colorblind: ColorblindMode;
  difficulty: Difficulty;
  reduceFlashes: boolean;
  reduceCameraShake: boolean;
  reduceMotion: boolean;
  extraVisualSignals: boolean;
  largeText: boolean;
  autoDialogue: boolean;
  musicVol: number; // 0 a 100
  sfxVol: number; // 0 a 100
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Tranquilo',
  normal: 'Normal',
  hard: 'Desafiador',
};

export const DIFFICULTY_NOTE: Record<Difficulty, string> = {
  easy: '+2 corações, inimigos e chefões mais lentos.',
  normal: 'Inimigos ficam mais rápidos a cada mundo.',
  hard: '−1 coração, checkpoints não curam,\ninimigos e chefões bem mais rápidos.',
};

/** Ajustes de jogo de cada dificuldade. `world` acelera os inimigos mundo a mundo. */
export function difficultyTuning(world: number) {
  const d = getSettings().difficulty;
  const ramp = 1 + (world - 1) * 0.05;
  return {
    hearts: d === 'easy' ? 2 : d === 'hard' ? -1 : 0,
    enemySpeed: (d === 'easy' ? 0.85 : d === 'hard' ? 1.25 : 1) * ramp,
    bossSpeed: d === 'easy' ? 0.85 : d === 'hard' ? 1.25 : 1,
    checkpointHeals: d !== 'hard',
  };
}

const KEY = 'prisma-settings-v1';
let cache: Settings | undefined;
const DEFAULTS: Settings = { colorblind: 'off', difficulty: 'normal', reduceFlashes: false, reduceCameraShake: false, reduceMotion: false, extraVisualSignals: false, largeText: false, autoDialogue: false, musicVol: 100, sfxVol: 100 };

const vol = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v / 10) * 10)) : 100);

function normalizeSettings(value: unknown): Settings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULTS };
  const data = value as Partial<Settings>;
  return {
    difficulty: data.difficulty === 'easy' || data.difficulty === 'hard' ? data.difficulty : 'normal',
    colorblind: data.colorblind === 'protan' || data.colorblind === 'deutan' || data.colorblind === 'tritan' ? data.colorblind : 'off',
    reduceFlashes: data.reduceFlashes === true,
    reduceCameraShake: data.reduceCameraShake === true,
    reduceMotion: data.reduceMotion === true,
    extraVisualSignals: data.extraVisualSignals === true,
    largeText: data.largeText === true,
    autoDialogue: data.autoDialogue === true,
    musicVol: vol(data.musicVol),
    sfxVol: vol(data.sfxVol),
  };
}

export function getSettings(): Settings {
  if (cache) return cache;
  try {
    cache = normalizeSettings(JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown);
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export function setSettings(patch: Partial<Settings>) {
  cache = normalizeSettings({ ...getSettings(), ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
}

export const COLORBLIND_LABEL: Record<ColorblindMode, string> = {
  off: 'Desligado',
  protan: 'Protanopia (vermelho)',
  deutan: 'Deuteranopia (verde)',
  tritan: 'Tritanopia (azul)',
};

type M3 = number[][];

// Como cada tipo de daltonismo enxerga (simulação em RGB) e para onde mover a
// informação de cor que se perde (método "daltonize": correção = I + E·(I − S)).
const SIM: Record<Exclude<ColorblindMode, 'off'>, M3> = {
  protan: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
  deutan: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
  tritan: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
};
const SHIFT: Record<Exclude<ColorblindMode, 'off'>, M3> = {
  protan: [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]],
  deutan: [[1, 0.7, 0], [0, 0, 0], [0, 0.7, 1]],
  tritan: [[1, 0, 0.7], [0, 1, 0.7], [0, 0, 0]],
};

function correction(mode: Exclude<ColorblindMode, 'off'>): number[] {
  const S = SIM[mode], E = SHIFT[mode];
  const m: number[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let v = r === c ? 1 : 0;
      for (let k = 0; k < 3; k++) v += E[r][k] * ((k === c ? 1 : 0) - S[k][c]);
      m.push(v);
    }
    m.push(0, 0); // alfa e deslocamento
  }
  m.push(0, 0, 0, 1, 0);
  return m;
}

/** Aplica (ou remove) o filtro de correção de cor na câmera principal da cena. */
const applied = new WeakMap<Phaser.Cameras.Scene2D.Camera, Phaser.FX.ColorMatrix>();

export function applyColorblind(scene: Phaser.Scene) {
  const cam = scene.cameras?.main;
  if (!cam?.postFX) return;
  const old = applied.get(cam);
  if (old) cam.postFX.remove(old as unknown as Phaser.FX.Controller);
  applied.delete(cam);
  const mode = getSettings().colorblind;
  if (mode === 'off') return;
  const fx = cam.postFX.addColorMatrix();
  fx.set(correction(mode));
  applied.set(cam, fx);
}

/** Reaplica nas cenas em execução (ex.: ao mudar a opção com o jogo pausado atrás). */
export function refreshColorblind(game: Phaser.Game) {
  for (const s of game.scene.getScenes(false)) if (s.sys.settings.status >= Phaser.Scenes.CREATING) applyColorblind(s);
}

/** Sinais extras (que não dependem de cor) ficam ligados junto com o modo daltônico. */
export const extraSignals = () => getSettings().colorblind !== 'off' || getSettings().extraVisualSignals;
export const canShakeCamera = () => !getSettings().reduceCameraShake;
export const canFlashScreen = () => !getSettings().reduceFlashes;

/** Fator de tamanho para diálogos e legendas (opção "Texto grande"). */
export const textBoost = () => (getSettings().largeText ? 1.2 : 1);
