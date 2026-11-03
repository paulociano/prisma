import Phaser from 'phaser';
import * as px from './fxPixels';

// Texturas dos efeitos ambientes. São geradas no próprio navegador (sem arquivos de arte novos),
// em branco: o `tint` de cada efeito dá a cor. Tamanho dos arquivos do jogo não muda.

function bakePixels(scene: Phaser.Scene, key: string, tex: px.PixelTex) {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, tex.w, tex.h);
  if (!canvas) return;
  const ctx = canvas.getContext();
  const img = ctx.createImageData(tex.w, tex.h);
  img.data.set(tex.data);
  ctx.putImageData(img, 0, 0);
  canvas.refresh();
}

function bakeDraw(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, w, h);
  if (!canvas) return;
  const ctx = canvas.getContext();
  ctx.fillStyle = ctx.strokeStyle = '#ffffff';
  draw(ctx);
  canvas.refresh();
}

const GENERATED: Record<string, () => px.PixelTex> = {
  fx_glow: () => px.glow(),
  fx_puff: () => px.puff(),
  fx_fog: () => px.fog(),
  fx_ray: () => px.ray(),
  fx_fall: () => px.fall(),
  fx_caustic: () => px.caustic(),
  fx_bubble: () => px.bubble(),
  fx_leaf: () => px.leaf(),
  fx_star: () => px.star(),
  fx_wave: () => px.wave(),
  fx_ripple: () => px.ripple(),
};

/** Cria (uma única vez) todas as texturas `fx_*`. Pode ser chamada à vontade. */
export function ensureFxTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('fx_ready')) return;
  for (const [key, make] of Object.entries(GENERATED)) bakePixels(scene, key, make());

  // pássaro de longe: dois arcos em "V" achatado
  bakeDraw(scene, 'fx_bird', 34, 14, (ctx) => {
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, 9);
    ctx.quadraticCurveTo(9, 1, 17, 8);
    ctx.quadraticCurveTo(25, 1, 32, 9);
    ctx.stroke();
  });
  // peixinho visto de lado
  bakeDraw(scene, 'fx_fish', 28, 12, (ctx) => {
    ctx.beginPath();
    ctx.ellipse(11, 6, 10, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(19, 6);
    ctx.lineTo(27, 1);
    ctx.lineTo(27, 11);
    ctx.closePath();
    ctx.fill();
  });
  // marcador: se existir, todas as texturas acima já foram feitas
  bakeDraw(scene, 'fx_ready', 2, 2, (ctx) => ctx.fillRect(0, 0, 2, 2));
}
