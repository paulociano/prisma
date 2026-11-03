import Phaser from 'phaser';

// Índices dos frames em cada atlas gerado pelo pipeline (ordem da grade do prompt).
export const F = {
  irisJump: { crouch: 0, takeoff: 1, rise: 2, peak: 3, fall: 4, land: 5 },
  irisHurtWin: { hurt: 0, dazed: 1, getUp: 2, victory: 3, shard: 4, wave: 5 },
  enemy: { hit: 4, restored: 5 },
  collectibles: { coin: [0, 1, 2, 1], shard: 3, heart: 4, oneUp: 5, key: 6, chest: 7, chestOpen: 8 },
  objects: { checkpointOff: 0, checkpointOn: 1, springDown: 2, springUp: 3, exit: 4, sign: 5, crate: 6, block: 7 },
  vfx: { burst: [0, 1, 2, 3], dust: [4, 5, 6, 7], hit: 8, fog: 9, ring: 10, confetti: 11 },
  hud: { heart: 0, heartEmpty: 1, heartHalf: 2, iris: 3, coin: 4, shard: 5, shardEmpty: 6, pause: 7, gear: 8 },
  w1Tiles: { topLeft: 0, top: 1, topRight: 2, fill: 3, floatSmall: 4, floatMid: 5, plank: 6, slope: 7, thorns: 8, cart: 9, cracked: 10, ledge: 11 },
  w1Props: { house: 0, heartFlower: 1, lantern: 2, berries: 3, thorns: 4, mushrooms: 5, fence: 6, log: 7, arch: 8 },
} as const;

export const has = (scene: Phaser.Scene, key: string) => scene.textures.exists(key);

function anim(scene: Phaser.Scene, key: string, tex: string, frames: readonly number[], frameRate: number, repeat = -1, yoyo = false) {
  if (!has(scene, tex) || scene.anims.exists(key)) return;
  scene.anims.create({ key, frames: frames.map((f) => ({ key: tex, frame: String(f) })), frameRate, repeat, yoyo });
}

export function createAnims(scene: Phaser.Scene) {
  anim(scene, 'iris-idle', 'iris_idle', [0, 1, 2, 3], 4, -1, true);
  anim(scene, 'iris-run', 'iris_run', [0, 1, 2, 3, 4, 5], 14);
  anim(scene, 'iris-attack', 'iris_attack', [1, 2, 3, 4, 5], 26, 0);
  anim(scene, 'iris-dash', 'iris_dash', [1, 2, 3, 4], 24, 0);
  anim(scene, 'iris-glide', 'iris_glide', [0, 1, 2, 3, 4, 5], 8);
  anim(scene, 'iris-wallslide', 'iris_wall', [0, 1, 2], 6, -1, true);
  anim(scene, 'iris-wallkick', 'iris_wall', [3, 4, 5], 14, 0);
  anim(scene, 'iris-swim', 'iris_swim', [0, 1, 2, 3, 4, 5], 9);
  anim(scene, 'iris-shoot', 'iris_shoot', [1, 2, 3], 16, 0); // o cristal é um objeto à parte
  anim(scene, 'iris-doublejump', 'iris_doublejump', [0, 1, 2, 3, 4, 5], 20, 0);
  anim(scene, 'iris-win', 'iris_hurt_win', [F.irisHurtWin.victory, F.irisHurtWin.shard], 3, 0);
  anim(scene, 'spark-fly', 'spark_anim', [0, 1, 2, 3], 8);

  for (const kind of ['blot', 'moth', 'megaphone', 'padlock', 'label', 'joke', 'rumor', 'stare', 'silence']) anim(scene, `${kind}-move`, kind, [0, 1, 2, 3], 8);
  anim(scene, 'beetle-move', 'w1_enemy', [0, 1, 3], 7);
  anim(scene, 'scorpion-move', 'w2_enemy', [0, 3], 5);
  anim(scene, 'drone-move', 'w3_enemy', [0, 1], 6);
  anim(scene, 'puffer-move', 'w5_enemy', [0, 0], 2);
  anim(scene, 'comet-move', 'w6_enemy', [0, 1, 2, 3], 10);
  anim(scene, 'sentinel-move', 'w7_enemy', [0, 1, 3, 1], 5);
  anim(scene, 'snapper-move', 'w4_enemy', [0, 1], 2, -1, true);

  anim(scene, 'coin-spin', 'collectibles', F.collectibles.coin, 8);
  anim(scene, 'fx-dust', 'vfx', F.vfx.dust, 18, 0);
  anim(scene, 'fx-burst', 'vfx', F.vfx.burst, 16, 0);
}
