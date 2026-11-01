import Phaser from 'phaser';
import { GAME_H, GAME_W, RAINBOW, TILE } from '../config';

// Fator de resolução de cada textura (os sprites do pipeline vêm em 2x).
export function texRes(scene: Phaser.Scene, key: string): number {
  const res = scene.registry.get('res') as Record<string, number> | undefined;
  return res?.[key] ?? 1;
}

function gfx(scene: Phaser.Scene) {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = gfx(scene);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// Gera texturas provisórias para tudo que ainda não tem arte final.
// Quando a arte chega pelo pipeline, a textura carregada tem prioridade (bake ignora chaves existentes).
export function makePlaceholders(scene: Phaser.Scene) {
  bake(scene, 'pixel', 4, 4, (g) => g.fillStyle(0xffffff).fillRect(0, 0, 4, 4));
  bake(scene, 'dot', 16, 16, (g) => g.fillStyle(0xffffff).fillCircle(8, 8, 8));

  bake(scene, 'iris', 60, 110, (g) => {
    g.fillStyle(0x2b2433).fillRoundedRect(18, 62, 24, 44, 8);
    g.fillStyle(0xf2c230).fillRoundedRect(10, 36, 40, 32, 10);
    g.fillStyle(0xb06cf0).fillCircle(30, 22, 20);
    g.fillStyle(0xffffff).fillRect(8, 36, 44, 8);
  });

  if (!scene.textures.exists('faded')) {
    const shades = [0x9a9da6, 0xa6a9b2, 0x8f939c, 0x80848d, 0xff7eb8, 0x7cc6ff, 0xffd84a, 0x7ee3b0];
    const g = gfx(scene);
    shades.forEach((c, i) => g.fillStyle(c).fillRoundedRect(i * 80 + 8, 18, 64, 56, 20));
    g.generateTexture('faded', 640, 80);
    g.destroy();
    const t = scene.textures.get('faded');
    for (let i = 0; i < 8; i++) t.add(i, 0, i * 80, 0, 80, 80);
  }

  bake(scene, 'spark', 40, 40, (g) => {
    g.fillStyle(0xffc6ff).fillTriangle(20, 2, 36, 20, 4, 20).fillTriangle(4, 20, 36, 20, 20, 38);
  });

  // --- Mundo 1: terreno ---
  bake(scene, 'tile_top', TILE, TILE, (g) => {
    g.fillStyle(0x6b3a2a).fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x7d4532).fillRect(0, 26, TILE, 38);
    g.fillStyle(0xd8344a).fillRoundedRect(0, 0, TILE, 22, 6);
    g.fillStyle(0xff6b7d).fillRect(0, 2, TILE, 5);
    g.fillStyle(0x5a2f22).fillCircle(16, 44, 4).fillCircle(46, 54, 3);
  });
  bake(scene, 'tile_fill', TILE, TILE, (g) => {
    g.fillStyle(0x7d4532).fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x5a2f22).fillCircle(14, 18, 4).fillCircle(44, 40, 3).fillCircle(30, 56, 2);
  });
  bake(scene, 'oneway', TILE, 24, (g) => {
    g.fillStyle(0xb5763f).fillRoundedRect(0, 0, TILE, 18, 5);
    g.fillStyle(0x8a5328).fillRect(0, 14, TILE, 4).fillRect(30, 0, 3, 18);
  });
  bake(scene, 'spike', TILE, TILE, (g) => {
    g.fillStyle(0x8c8f99);
    for (let i = 0; i < 4; i++) g.fillTriangle(i * 16, TILE, i * 16 + 8, 26, i * 16 + 16, TILE);
    g.fillStyle(0x6d7079).fillRect(0, TILE - 8, TILE, 8);
  });
  bake(scene, 'crate', TILE, TILE, (g) => {
    g.fillStyle(0x8e9099).fillRoundedRect(2, 2, 60, 60, 6);
    g.lineStyle(6, 0x6c6e76).strokeRect(8, 8, 48, 48).lineBetween(10, 10, 54, 54).lineBetween(54, 10, 10, 54);
  });
  bake(scene, 'spring', TILE, 40, (g) => {
    g.fillStyle(0xf4e3c8).fillRect(26, 18, 12, 22);
    g.fillStyle(0xe8394f).fillEllipse(32, 16, 60, 26);
    g.fillStyle(0xffffff).fillCircle(18, 12, 4).fillCircle(42, 10, 3);
  });
  bake(scene, 'checkpoint_off', 48, 128, (g) => {
    g.fillStyle(0x6d7079).fillRect(6, 0, 6, 128);
    g.fillStyle(0x9a9da6).fillTriangle(12, 8, 46, 22, 12, 40);
  });
  bake(scene, 'checkpoint_on', 48, 128, (g) => {
    g.fillStyle(0xf5e6c8).fillRect(6, 0, 6, 128);
    RAINBOW.forEach((c, i) => g.fillStyle(c).fillRect(12, 6 + i * 6, 34 - i * 2, 6));
  });
  bake(scene, 'exit', 128, 176, (g) => {
    RAINBOW.forEach((c, i) => g.lineStyle(6, c).beginPath().arc(64, 72, 58 - i * 6, Math.PI, 0).strokePath());
    g.fillStyle(0xffffff, 0.35).fillEllipse(64, 110, 70, 120);
    g.fillStyle(0xd8d0e8).fillRect(2, 72, 12, 104).fillRect(114, 72, 12, 104);
  });

  // --- Coletáveis ---
  bake(scene, 'coin', 32, 32, (g) => {
    g.fillStyle(0xffffff).fillTriangle(16, 2, 30, 16, 2, 16).fillTriangle(2, 16, 30, 16, 16, 30);
    g.fillStyle(0xffffff, 0.6).fillTriangle(16, 6, 22, 16, 10, 16);
  });
  bake(scene, 'shard', 44, 56, (g) => {
    g.fillStyle(0xe9f3ff).fillTriangle(22, 0, 44, 40, 0, 40);
    g.fillStyle(0xb9a8ff).fillTriangle(0, 40, 44, 40, 22, 56);
    g.fillStyle(0xffffff).fillTriangle(22, 6, 30, 32, 16, 32);
  });
  bake(scene, 'heart', 40, 36, (g) => {
    g.fillStyle(0xff3d5a).fillCircle(11, 12, 11).fillCircle(29, 12, 11).fillTriangle(1, 16, 39, 16, 20, 36);
    g.fillStyle(0xffffff, 0.7).fillCircle(9, 9, 4);
  });
  bake(scene, 'heart_empty', 40, 36, (g) => {
    g.fillStyle(0x3a2f4a).fillCircle(11, 12, 11).fillCircle(29, 12, 11).fillTriangle(1, 16, 39, 16, 20, 36);
  });
  bake(scene, 'ring', 40, 40, (g) => {
    g.lineStyle(6, 0xb8bbc4).strokeCircle(20, 20, 14);
  });
  bake(scene, 'slash', 140, 110, (g) => {
    RAINBOW.forEach((c, i) => {
      g.lineStyle(7, c, 0.9).beginPath().arc(20, 55, 100 - i * 6, -1.0, 1.0).strokePath();
    });
  });

  // --- Fundos do Mundo 1 ---
  if (!scene.textures.exists('sky')) {
    const tex = scene.textures.createCanvas('sky', 8, GAME_H)!;
    const ctx = tex.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_H);
    grad.addColorStop(0, '#6aa8ff');
    grad.addColorStop(0.55, '#ffc8a8');
    grad.addColorStop(1, '#ff8a7a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, GAME_H);
    tex.refresh();
  }
  bake(scene, 'hills_far', GAME_W, 360, (g) => {
    for (const dx of [-GAME_W, 0, GAME_W]) {
      g.fillStyle(0xc4667a).fillEllipse(dx + 200, 300, 700, 320).fillEllipse(dx + 760, 320, 800, 280);
      g.fillStyle(0xd88a8f).fillEllipse(dx + 1150, 330, 600, 240);
    }
  });
  bake(scene, 'hills_mid', GAME_W, 360, (g) => {
    for (const dx of [-GAME_W, 0, GAME_W]) {
      g.fillStyle(0x9e2f45).fillEllipse(dx + 320, 340, 820, 260).fillEllipse(dx + 1000, 350, 700, 220);
      for (let i = 0; i < 6; i++) {
        const x = dx + 120 + i * 210;
        g.fillStyle(0x5a2a2a).fillRect(x - 5, 200, 10, 80);
        g.fillStyle(i % 2 ? 0xd8344a : 0xff6040).fillCircle(x, 190, 46);
      }
    }
  });
}
