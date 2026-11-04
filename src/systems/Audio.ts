import Phaser from 'phaser';
import { getSettings } from './Settings';

// Música e efeitos. O gerenciador de som do Phaser é global (vale para todas as cenas),
// então a música continua tocando ao trocar de cena e só muda quando pedimos outra faixa.
// Arquivos ausentes são ignorados em silêncio: dá para ir adicionando sons aos poucos.

const MUSIC_BASE = 0.45;
const SFX_BASE = 0.7;
// o volume final também depende do controle de Opções (0–100%)
const musicVol = () => MUSIC_BASE * (getSettings().musicVol / 100);
const sfxVol = () => SFX_BASE * (getSettings().sfxVol / 100);
const MUTE_KEY = 'prisma-mute';

let current: Phaser.Sound.BaseSound | undefined;
let currentKey = '';
let muted = readMuted();

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

/** O navegador só libera áudio depois do primeiro clique/tecla; até lá, adia. */
function whenUnlocked(scene: Phaser.Scene, fn: () => void) {
  if (scene.sound.locked) scene.sound.once(Phaser.Sound.Events.UNLOCKED, fn);
  else fn();
}

type Snd = Phaser.Sound.BaseSound;
const fades = new Map<Snd, ReturnType<typeof setInterval>>();

/** Volume só se o som ainda existe (um som destruído não tem mais nó de ganho e o Phaser dá erro). */
function safeVolume(snd: Snd, v: number) {
  const node = snd as unknown as { volumeNode?: unknown };
  if ('volumeNode' in node && !node.volumeNode) return; // WebAudio já destruído
  try {
    (snd as Phaser.Sound.WebAudioSound).setVolume(Math.max(0, Math.min(1, v)));
  } catch {
    // som já destruído: nada a fazer
  }
}

function cancelFade(snd: Snd) {
  const id = fades.get(snd);
  if (id !== undefined) clearInterval(id);
  fades.delete(snd);
}

/**
 * Fade de volume feito com relógio próprio (não depende de nenhuma cena): a cena que pediu o fade
 * pode ser reiniciada ou parada (entrar numa fase secreta, por exemplo) sem deixar o som pendurado
 * nem mexer num som já destruído.
 */
function fade(snd: Snd, to: number, ms: number, done?: () => void) {
  cancelFade(snd);
  const from = (snd as Phaser.Sound.WebAudioSound).volume ?? 0;
  const t0 = performance.now();
  const id = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
    safeVolume(snd, from + (to - from) * k);
    if (k >= 1) {
      cancelFade(snd);
      done?.();
    }
  }, 40);
  fades.set(snd, id);
}

/** Troca a música com fade. `loop: false` para jingles (vitória). */
export function playMusic(scene: Phaser.Scene, name: string, loop = true) {
  const key = `music_${name}`;
  if (key === currentKey && current?.isPlaying) return;
  stopMusic(scene);
  if (!scene.cache.audio.exists(key)) return;
  currentKey = key;
  whenUnlocked(scene, () => {
    if (currentKey !== key) return; // outra faixa foi pedida enquanto esperava
    const snd = scene.sound.add(key, { loop, volume: 0 });
    snd.play();
    current = snd;
    fade(snd, muted ? 0 : musicVol(), 800);
  });
}

export function stopMusic(_scene: Phaser.Scene, fadeMs = 400) {
  const old = current;
  current = undefined;
  currentKey = '';
  if (!old) return;
  fade(old, 0, fadeMs, () => {
    try {
      old.stop();
      old.destroy();
    } catch {
      // já destruído
    }
  });
}

/** Toca um efeito (sfx/<nome>.wav ou .mp3), com leve variação de tom para não cansar. */
export function playSfx(scene: Phaser.Scene, name: string, detune = 80) {
  const key = `sfx_${name}`;
  if (muted || !scene.cache.audio.exists(key)) return;
  scene.sound.play(key, { volume: sfxVol(), detune: Phaser.Math.Between(-detune, detune) });
}

export const isMuted = () => muted;

/** Reaplica o volume de música (ao mexer no controle de Opções). */
export function applyMusicVolume() {
  if (current) {
    cancelFade(current);
    safeVolume(current, muted ? 0 : musicVol());
  }
}

export function toggleMute(scene: Phaser.Scene) {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
  if (current) {
    cancelFade(current);
    safeVolume(current, muted ? 0 : musicVol());
  }
  scene.events.emit('toast', muted ? 'Som desligado (M)' : 'Som ligado (M)');
  return muted;
}

/** Música de cada mundo; arena de chefão usa a faixa de chefão. */
export function musicForLevel(world: number, boss: boolean) {
  if (boss) return world === 7 ? 'boss_final' : 'boss';
  return `w${world}`;
}
