import Phaser from 'phaser';

// Texturas dos blocos interativos (bater com a cabeça, caixa, placa, portão, parede falsa).
// Geradas no navegador: nenhum arquivo de arte novo.

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  draw(tex.getContext());
  tex.refresh();
}

const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
};

export function ensureBlockTextures(scene: Phaser.Scene) {
  bake(scene, 'blk_bump', 64, 64, (c) => {
    c.fillStyle = '#ffb32e'; rr(c, 1, 1, 62, 62, 10); c.fill();
    c.fillStyle = '#ffd86b'; rr(c, 5, 5, 54, 24, 8); c.fill();
    c.strokeStyle = '#7a3cc0'; c.lineWidth = 3; rr(c, 2, 2, 60, 60, 10); c.stroke();
    c.fillStyle = '#7a3cc0'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('✦', 32, 34);
  });
  bake(scene, 'blk_bump_used', 64, 64, (c) => {
    c.fillStyle = '#7d7488'; rr(c, 1, 1, 62, 62, 10); c.fill();
    c.strokeStyle = '#4a4256'; c.lineWidth = 3; rr(c, 2, 2, 60, 60, 10); c.stroke();
  });
  bake(scene, 'blk_pushbox', 64, 64, (c) => {
    c.fillStyle = '#b9824d'; c.fillRect(2, 2, 60, 60);
    c.strokeStyle = '#6b4423'; c.lineWidth = 5; c.strokeRect(4, 4, 56, 56);
    c.beginPath(); c.moveTo(6, 6); c.lineTo(58, 58); c.moveTo(58, 6); c.lineTo(6, 58); c.lineWidth = 4; c.stroke();
  });
  bake(scene, 'blk_plate', 64, 16, (c) => {
    c.fillStyle = '#5b4a73'; rr(c, 0, 6, 64, 10, 4); c.fill();
    c.fillStyle = '#c9b6ff'; rr(c, 6, 0, 52, 8, 4); c.fill();
  });
  bake(scene, 'blk_gate', 64, 64, (c) => {
    c.fillStyle = '#4a3a66'; c.fillRect(14, 0, 36, 64);
    c.fillStyle = '#9d7bff'; c.fillRect(20, 0, 6, 64); c.fillRect(38, 0, 6, 64);
    c.fillStyle = '#ffd86b'; c.fillRect(14, 28, 36, 8);
  });
  // rocha manchada (sem tijolinhos): parece parte do penhasco, só que com uma cintilação de pista
  bake(scene, 'blk_wall', 64, 64, (c) => {
    c.fillStyle = '#8b8179'; c.fillRect(0, 0, 64, 64);
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < 220; i++) {
      const l = rnd() > 0.5 ? 255 : 0;
      c.fillStyle = `rgba(${l},${l},${l},${0.05 + rnd() * 0.1})`;
      c.fillRect(Math.floor(rnd() * 64), Math.floor(rnd() * 64), 2 + Math.floor(rnd() * 5), 2 + Math.floor(rnd() * 3));
    }
    c.strokeStyle = 'rgba(60,52,48,0.35)'; c.lineWidth = 2;
    for (const y of [13, 31, 50]) { c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(20, y - 4, 42, y + 5, 64, y); c.stroke(); }
  });
  // peso de pedra pendurado por uma corrente (cai sobre o chefão)
  bake(scene, 'blk_weight', 88, 96, (c) => {
    c.strokeStyle = '#4a4256'; c.lineWidth = 6; c.beginPath(); c.moveTo(44, 0); c.lineTo(44, 18); c.stroke();
    const g = c.createLinearGradient(0, 18, 0, 96);
    g.addColorStop(0, '#a39aae'); g.addColorStop(1, '#5d556a');
    c.fillStyle = g; c.beginPath(); c.moveTo(14, 96); c.lineTo(74, 96); c.lineTo(84, 34); c.lineTo(4, 34); c.closePath(); c.fill();
    c.strokeStyle = '#2f2a3a'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#ffd86b'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✦', 44, 66);
  });
  bake(scene, 'blk_portal', 64, 96, (c) => {
    const g = c.createRadialGradient(32, 52, 4, 32, 52, 46);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.5, 'rgba(190,150,255,0.8)'); g.addColorStop(1, 'rgba(120,80,255,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(32, 52, 30, 44, 0, 0, Math.PI * 2); c.fill();
  });
  bake(scene, 'blk_door', 64, 96, (c) => {
    c.fillStyle = '#4a4256'; rr(c, 4, 6, 56, 90, 26); c.fill();
    c.fillStyle = '#1c1530'; rr(c, 10, 14, 44, 82, 20); c.fill();
    const g = c.createLinearGradient(0, 14, 0, 96);
    g.addColorStop(0, 'rgba(185,168,255,0.9)'); g.addColorStop(1, 'rgba(255,216,107,0.35)');
    c.fillStyle = g; rr(c, 14, 18, 36, 78, 16); c.fill();
    c.fillStyle = '#ffd86b'; c.beginPath(); c.arc(42, 62, 3.5, 0, Math.PI * 2); c.fill();
  });
  if (!scene.textures.exists('vig_risk')) {
    const t = scene.textures.createCanvas('vig_risk', 640, 360)!;
    const c = t.getContext();
    const g = c.createRadialGradient(320, 180, 140, 320, 180, 400);
    g.addColorStop(0, 'rgba(255,40,70,0)'); g.addColorStop(1, 'rgba(255,40,70,0.85)');
    c.fillStyle = g; c.fillRect(0, 0, 640, 360);
    t.refresh();
  }
}
