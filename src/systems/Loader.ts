import Phaser from 'phaser';
import { GAME_H, GAME_W, RAINBOW } from '../config';
import { createAnims } from '../gfx/art';

interface ManifestEntry {
  key: string;
  type: 'atlas' | 'image';
  file: string;
  json?: string;
}
interface Manifest {
  sprites: ManifestEntry[];
  audio?: { key: string; file: string }[];
}

/** Arte e música que pertencem a um mundo específico (carregados só quando o jogador chega nele). */
export const worldOf = (key: string): number => {
  const m = /^(?:cs_)?w([1-7])_/.exec(key) ?? /^music_(?:chamber_)?w([1-7])$/.exec(key);
  return m ? Number(m[1]) : 0;
};

/** Mundos cujos assets já estão na memória. O mundo 1 vai junto com o carregamento inicial. */
const loaded = new Set<number>([1]);

export const isWorldLoaded = (world: number) => loaded.has(world);

/**
 * Garante que os assets do mundo estão carregados e depois chama `done`.
 * Se faltar algo, mostra uma barra arco-íris por cima da cena enquanto baixa.
 */
export function ensureWorld(scene: Phaser.Scene, world: number, done: () => void) {
  if (loaded.has(world)) return done();
  const manifest = scene.cache.json.get('manifest') as Manifest | undefined;
  if (!manifest) return done();
  let queued = 0;
  for (const s of manifest.sprites) {
    if (worldOf(s.key) !== world || scene.textures.exists(s.key)) continue;
    if (s.type === 'atlas') scene.load.atlas(s.key, `assets/${s.file}`, `assets/${s.json}`);
    else scene.load.image(s.key, `assets/${s.file}`);
    queued++;
  }
  for (const a of manifest.audio ?? []) {
    if (worldOf(a.key) !== world || scene.cache.audio.exists(a.key)) continue;
    scene.load.audio(a.key, `assets/${a.file}`);
    queued++;
  }
  if (!queued) {
    loaded.add(world);
    return done();
  }

  const w = 520, x = GAME_W / 2 - w / 2, y = GAME_H / 2;
  const veil = scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x120d1a, 0.88).setOrigin(0).setDepth(1000).setInteractive();
  const label = scene.add.text(GAME_W / 2, y - 40, `Carregando o mundo ${world}…`, { fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setDepth(1001);
  const track = scene.add.rectangle(x, y, w, 14, 0x3b2252).setOrigin(0, 0.5).setDepth(1001);
  const bar = scene.add.rectangle(x, y, 1, 14, RAINBOW[0]).setOrigin(0, 0.5).setDepth(1001);
  const onProgress = (p: number) => {
    bar.width = Math.max(1, w * p);
    bar.fillColor = RAINBOW[Math.min(6, Math.floor(p * 7))];
  };
  const cleanup = () => [veil, label, track, bar].forEach((o) => o.destroy());
  scene.load.on('progress', onProgress);
  scene.load.once('complete', () => {
    scene.load.off('progress', onProgress);
    createAnims(scene);
    loaded.add(world);
    cleanup();
    done();
  });
  // erro de rede: segue em frente; a arte tem plano B desenhado por código
  scene.load.once('loaderror', () => undefined);
  scene.load.start();
}
