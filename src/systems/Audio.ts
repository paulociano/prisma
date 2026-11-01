import Phaser from 'phaser';

// Música e efeitos. O gerenciador de som do Phaser é global (vale para todas as cenas),
// então a música continua tocando ao trocar de cena e só muda quando pedimos outra faixa.
// Arquivos ausentes são ignorados em silêncio: dá para ir adicionando sons aos poucos.

const MUSIC_VOL = 0.45;
const SFX_VOL = 0.7;
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
    scene.tweens.add({ targets: snd, volume: muted ? 0 : MUSIC_VOL, duration: 800 });
  });
}

export function stopMusic(scene: Phaser.Scene, fadeMs = 400) {
  const old = current;
  current = undefined;
  currentKey = '';
  if (!old) return;
  scene.tweens.add({
    targets: old,
    volume: 0,
    duration: fadeMs,
    onComplete: () => {
      old.stop();
      old.destroy();
    },
  });
}

/** Toca um efeito (sfx/<nome>.wav ou .mp3), com leve variação de tom para não cansar. */
export function playSfx(scene: Phaser.Scene, name: string, detune = 80) {
  const key = `sfx_${name}`;
  if (muted || !scene.cache.audio.exists(key)) return;
  scene.sound.play(key, { volume: SFX_VOL, detune: Phaser.Math.Between(-detune, detune) });
}

export const isMuted = () => muted;

export function toggleMute(scene: Phaser.Scene) {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
  if (current) (current as Phaser.Sound.WebAudioSound).setVolume(muted ? 0 : MUSIC_VOL);
  scene.events.emit('toast', muted ? 'Som desligado (M)' : 'Som ligado (M)');
  return muted;
}

/** Música de cada mundo; arena de chefão usa a faixa de chefão. */
export function musicForLevel(world: number, boss: boolean) {
  if (boss) return world === 7 ? 'boss_final' : 'boss';
  return `w${world}`;
}
