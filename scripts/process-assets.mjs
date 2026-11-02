// Pipeline de assets do Prisma.
// Lê as imagens geradas em assets/raw, separa cada figura do sprite sheet
// (detectando as "ilhas" de pixels), limpa o halo semitransparente, alinha,
// redimensiona e grava tiras de frames em public/assets/sprites + manifest.json.
//
// Uso: npm run assets
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'assets/raw';
const OUT_DIR = 'public/assets';
const SPRITES_DIR = path.join(OUT_DIR, 'sprites');

// Os sprites são gravados com o dobro da resolução de exibição (nitidez em telas grandes).
const RES = 2;
const ALPHA_MIN = 64; // alfa abaixo disso vira transparente (remove halo/névoa)
const BLOCK = 4; // resolução da máscara de detecção
const DEFAULT_DILATE = 3; // em blocos (ajustável por sheet com 'dilate'): junta pedacinhos próximos (faíscas, cabelo) à figura
const MIN_AREA = 0.0015; // fração da imagem: ilhas menores que isso são descartadas
const PAD = 4;

// key: nome da textura no jogo · src: arquivo em assets/raw
// expect: quantas figuras o sheet deveria ter · pick: índices a manter (ordem de leitura)
// grid: [colunas, linhas] define a ordem dos frames · cut: corta por célula (figuras encostadas)
// cells: retângulos explícitos em frações da imagem · ref: escala por uma peça de referência
// height: altura em px de jogo da maior figura · align: bottom | center
// Entradas cujo arquivo ainda não existe são ignoradas.
const SHEETS = [
  // Lote 1: referências usadas provisoriamente como sprites
  { key: 'iris', src: '00_estilo/iris_ref_sheet.png', expect: 8, pick: [0], height: 110, dilate: 1 },
  { key: 'faded', src: '00_estilo/faded_ref_sheet.png', expect: 8, height: 72 },
  { key: 'spark', src: '00_estilo/spark_ref_sheet.png', expect: 6, pick: [0], height: 46, align: 'center' },
  // retratos para os diálogos (bustos das fichas de referência)
  { key: 'iris_portraits', src: '00_estilo/iris_ref_sheet.png', expect: 8, pick: [4, 5, 6, 7], height: 120, dilate: 1, align: 'center' },
  { key: 'spark_portraits', src: '00_estilo/spark_ref_sheet.png', expect: 6, height: 90, align: 'center' },
  { key: 'citizens', src: '00_estilo/citizens_ref_sheet.png', expect: 6, height: 112, dilate: 1 },

  // Lote 2: animações
  { key: 'iris_idle', src: 'personagens/iris_idle.png', expect: 4, height: 110, grid: [2, 2] },
  { key: 'iris_run', src: 'personagens/iris_run.png', expect: 6, height: 110, grid: [3, 2], anchor: 'head' },
  { key: 'iris_jump', src: 'personagens/iris_jump.png', expect: 6, height: 120, grid: [3, 2], anchor: 'head' },
  { key: 'iris_attack', src: 'personagens/iris_attack.png', expect: 6, height: 120, grid: [3, 2] },
  { key: 'iris_hurt_win', src: 'personagens/iris_hurt_win.png', expect: 6, height: 120, grid: [3, 2], cut: true, largest: true },
  // pirueta no ar: alinhada pelo centro da célula (a figura gira, pés e cabeça trocam de lugar)
  { key: 'iris_doublejump', src: 'personagens/iris_doublejump.png', expect: 6, height: 115, grid: [3, 2], cut: true, largest: true, align: 'center', anchor: 'cell' },
  { key: 'iris_dash', src: 'personagens/iris_dash.png', expect: 6, height: 115, grid: [3, 2], cut: true, largest: true, anchor: 'head' },
  { key: 'iris_glide', src: 'personagens/iris_glide.png', expect: 6, height: 130, grid: [3, 2], cut: true, largest: true, anchor: 'head' },
  // quadros 0-2: deslizando na parede (mão à direita); 3-5: saltando para longe dela
  { key: 'iris_wall', src: 'personagens/iris_wall.png', expect: 6, height: 115, grid: [3, 2], cut: true, largest: true, anchor: 'head' },
  { key: 'iris_swim', src: 'personagens/iris_swim.png', expect: 6, height: 62, grid: [3, 2], cut: true, largest: true, align: 'center', anchor: 'cell' },
  { key: 'iris_shoot', src: 'personagens/iris_shoot.png', expect: 6, height: 115, grid: [3, 2], cut: true, largest: true },
  // mergulho estelar: no ar (giro, mergulho) centrado; pouso agachado apoiado no chão
  { key: 'iris_pound_air', src: 'personagens/iris_pound.png', expect: 4, height: 112, largest: true, align: 'center', anchor: 'cell', cells: [[0, 0, 1 / 3, 0.5], [1 / 3, 0, 2 / 3, 0.5], [2 / 3, 0, 1, 0.5], [0, 0.5, 1 / 3, 1]] },
  { key: 'iris_pound_land', src: 'personagens/iris_pound.png', expect: 2, height: 76, largest: true, cells: [[1 / 3, 0.5, 2 / 3, 1], [2 / 3, 0.5, 1, 1]] },
  // o cristal disparado, recortado do último quadro do disparo
  { key: 'prism_shot', src: 'personagens/iris_shoot.png', expect: 1, height: 28, largest: true, align: 'center', anchor: 'cell', cells: [[0.556, 0.585, 0.645, 0.68]] },
  { key: 'spark_anim', src: 'personagens/spark_anim.png', expect: 4, height: 46, grid: [2, 2] },
  { key: 'blot', src: 'inimigos/blot.png', expect: 6, height: 56, grid: [3, 2] },
  { key: 'moth', src: 'inimigos/moth.png', expect: 6, height: 64, grid: [3, 2] },
  { key: 'megaphone', src: 'inimigos/megaphone.png', expect: 6, height: 64, grid: [3, 2] },
  { key: 'padlock', src: 'inimigos/padlock.png', expect: 6, height: 72, grid: [3, 2] },
  { key: 'collectibles', src: 'comum/collectibles.png', expect: 9, height: 64, grid: [3, 3] },
  { key: 'level_objects', src: 'comum/level_objects.png', expect: 8, height: 180, grid: [4, 2] },
  { key: 'vfx', src: 'comum/vfx.png', expect: 12, height: 96, grid: [4, 3] },
  { key: 'hud', src: 'ui/hud.png', expect: 9, height: 48, grid: [3, 3] },

  // Mundo 1
  { key: 'w1_bg_far', src: 'w1/bg_far.png', type: 'image', height: 720, opaque: true, mirror: true },
  { key: 'w1_bg_mid', src: 'w1/bg_mid.png', type: 'image', height: 720, mirror: true },
  { key: 'w1_bg_near', src: 'w1/bg_near.png', type: 'image', height: 720, mirror: true },
  { key: 'w1_ground', src: 'w1/ground_texture.png', type: 'image', width: 256, opaque: true },
  { key: 'w1_boss_arena', src: 'w1/boss_arena.png', type: 'image', height: 720, opaque: true },
  // peça 1 (chão do meio) define a escala: 64 px de largura = 1 bloco
  { key: 'w1_tiles', src: 'w1/tiles_kit.png', expect: 12, grid: [4, 3], surface: true, ref: { frame: 1, width: 64 } },
  { key: 'w1_props', src: 'w1/props.png', expect: 9, height: 190 },
  { key: 'w1_enemy', src: 'w1/enemy.png', expect: 6, height: 62, grid: [3, 2] },
  { key: 'w1_guardian', src: 'w1/guardian_ref.png', expect: 8, height: 150, largest: true, cells: [[0, 0, 1 / 3, 0.6], [1 / 3, 0, 2 / 3, 0.6], [2 / 3, 0, 1, 0.6], [0, 0.6, 0.2, 1], [0.2, 0.6, 0.4, 1], [0.4, 0.6, 0.6, 1], [0.6, 0.6, 0.78, 1], [0.78, 0.6, 1, 1]] },
  { key: 'w1_boss_idle', src: 'w1/boss_idle.png', expect: 4, height: 300, grid: [2, 2] },
  { key: 'w1_boss_attack', src: 'w1/boss_attack.png', expect: 6, height: 320, grid: [3, 2], cut: true, largest: true },
  { key: 'w1_boss_end', src: 'w1/boss_end.png', expect: 4, height: 300, grid: [2, 2] },
  // Mundo 2
  { key: 'w2_bg_far', src: 'w2/bg_far.png', type: 'image', height: 720, opaque: true, mirror: true },
  { key: 'w2_bg_mid', src: 'w2/bg_mid.png', type: 'image', height: 720, mirror: true },
  { key: 'w2_bg_near', src: 'w2/bg_near.png', type: 'image', height: 720, mirror: true },
  { key: 'w2_ground', src: 'w2/ground_texture.png', type: 'image', width: 256, opaque: true },
  { key: 'w2_boss_arena', src: 'w2/boss_arena.png', type: 'image', height: 720, opaque: true },
  { key: 'w2_tiles', src: 'w2/tiles_kit.png', expect: 12, grid: [4, 3], surface: true, ref: { frame: 1, width: 64 } },
  { key: 'w2_props', src: 'w2/props.png', height: 190 },
  { key: 'w2_enemy', src: 'w2/enemy.png', expect: 6, height: 62, grid: [3, 2] },
  { key: 'w2_guardian', src: 'w2/guardian_ref.png', expect: 8, height: 140, largest: true, cells: [[0, 0, 1 / 3, 0.6], [1 / 3, 0, 2 / 3, 0.6], [2 / 3, 0, 1, 0.6], [0, 0.6, 0.2, 1], [0.2, 0.6, 0.4, 1], [0.4, 0.6, 0.6, 1], [0.6, 0.6, 0.78, 1], [0.78, 0.6, 1, 1]] },
  // Luna (opcional: a ficha do guardião veio só com a Sol). Mesma grade, sem o quadro "presa".
  { key: 'w2_luna', src: 'w2/luna_ref.png', expect: 8, height: 140, largest: true, cells: [[0, 0, 0.24, 0.58], [0.24, 0, 0.47, 0.58], [0.47, 0, 0.69, 0.58], [0, 0.58, 0.25, 1], [0.25, 0.58, 0.5, 1], [0.5, 0.58, 0.75, 1], [0.75, 0.58, 1, 1], [0.69, 0, 1, 0.58]] },
  { key: 'w2_boss_idle', src: 'w2/boss_idle.png', expect: 4, height: 300, grid: [2, 2] },
  { key: 'w2_boss_attack', src: 'w2/boss_attack.png', expect: 6, height: 330, grid: [3, 2], cut: true, largest: true },
  { key: 'w2_boss_end', src: 'w2/boss_end.png', expect: 4, height: 300, grid: [2, 2], cut: true, largest: true },
  { key: 'w2_boss_projectiles', src: 'w2/boss_projectiles.png', expect: 6, height: 110, grid: [3, 2], align: 'center' },

  // Mundo 3
  { key: 'w3_bg_far', src: 'w3/bg_far.png', type: 'image', height: 720, opaque: true, mirror: true },
  { key: 'w3_bg_mid', src: 'w3/bg_mid.png', type: 'image', height: 720, mirror: true },
  { key: 'w3_bg_near', src: 'w3/bg_near.png', type: 'image', height: 720, mirror: true },
  { key: 'w3_ground', src: 'w3/ground_texture.png', type: 'image', width: 256, opaque: true },
  { key: 'w3_boss_arena', src: 'w3/boss_arena.png', type: 'image', height: 853, opaque: true },
  { key: 'w3_tiles', src: 'w3/tiles_kit.png', expect: 12, grid: [4, 3], surface: true, ref: { frame: 1, width: 64 } },
  { key: 'w3_props', src: 'w3/props.png', expect: 10, height: 190, largest: true, cells: [[0, 0.18, 0.27, 0.56], [0.27, 0.03, 0.4, 0.56], [0.4, 0.3, 0.63, 0.56], [0.62, 0.2, 0.8, 0.56], [0.8, 0.12, 1, 0.56], [0, 0.58, 0.26, 0.98], [0.26, 0.68, 0.39, 0.98], [0.39, 0.68, 0.64, 0.98], [0.64, 0.74, 0.8, 0.98], [0.8, 0.56, 1, 0.98]] },
  { key: 'w3_enemy', src: 'w3/enemy.png', expect: 6, height: 70, grid: [3, 2], align: 'center' },
  // ordem: 3 corpos, 4 bustos, presa (igual às outras fichas)
  { key: 'w3_guardian', src: 'w3/guardian_ref.png', expect: 8, height: 130, largest: true, cells: [[0, 0, 0.27, 0.57], [0.27, 0, 0.52, 0.57], [0.52, 0, 0.72, 0.57], [0, 0.57, 0.22, 1], [0.22, 0.57, 0.44, 1], [0.44, 0.57, 0.66, 1], [0.66, 0.57, 0.86, 1], [0.72, 0, 1, 0.57]] },
  { key: 'w3_boss_idle', src: 'w3/boss_idle.png', expect: 4, height: 360, grid: [2, 2], cut: true, largest: true },
  { key: 'w3_boss_attack', src: 'w3/boss_attack.png', expect: 6, height: 360, grid: [3, 2], cut: true, largest: true },
  { key: 'w3_boss_end', src: 'w3/boss_end.png', expect: 4, height: 360, grid: [2, 2], cut: true, largest: true },
  { key: 'w3_boss_projectiles', src: 'w3/boss_projectiles.png', expect: 6, height: 110, grid: [3, 2], align: 'center' },

  // Mundo 4
  { key: 'w4_bg_far', src: 'w4/bg_far.png', type: 'image', height: 720, opaque: true, mirror: true },
  { key: 'w4_bg_mid', src: 'w4/bg_mid.png', type: 'image', height: 720, mirror: true },
  { key: 'w4_bg_near', src: 'w4/bg_near.png', type: 'image', height: 720, mirror: true },
  { key: 'w4_ground', src: 'w4/ground_texture.png', type: 'image', width: 256, opaque: true },
  { key: 'w4_boss_arena', src: 'w4/boss_arena.png', type: 'image', height: 853, opaque: true },
  { key: 'w4_tiles', src: 'w4/tiles_kit.png', expect: 12, grid: [4, 3], surface: true, ref: { frame: 1, width: 64 } },
  { key: 'w4_props', src: 'w4/props.png', expect: 11, height: 190, largest: true, cells: [[0, 0, 0.31, 0.33], [0.31, 0.07, 0.48, 0.33], [0.5, 0.05, 0.71, 0.33], [0.71, 0.08, 1, 0.33], [0, 0.33, 0.27, 0.76], [0.28, 0.4, 0.76, 0.73], [0.76, 0.34, 1, 0.73], [0, 0.74, 0.24, 1], [0.25, 0.74, 0.48, 1], [0.49, 0.76, 0.75, 1], [0.76, 0.73, 1, 1]] },
  { key: 'w4_enemy', src: 'w4/enemy.png', expect: 6, height: 76, grid: [3, 2] },
  { key: 'w4_guardian', src: 'w4/guardian_ref.png', expect: 8, height: 140, largest: true, cells: [[0, 0, 0.2, 0.57], [0.2, 0, 0.44, 0.57], [0.44, 0, 0.7, 0.57], [0, 0.57, 0.25, 1], [0.25, 0.57, 0.48, 1], [0.48, 0.57, 0.72, 1], [0.72, 0.57, 1, 1], [0.7, 0, 1, 0.57]] },
  { key: 'w4_boss_idle', src: 'w4/boss_idle.png', expect: 4, height: 320, grid: [2, 2], cut: true, largest: true },
  { key: 'w4_boss_attack', src: 'w4/boss_attack.png', expect: 6, height: 330, grid: [3, 2], cut: true, largest: true },
  { key: 'w4_boss_end', src: 'w4/boss_end.png', expect: 4, height: 320, grid: [2, 2], cut: true, largest: true },
  { key: 'w4_boss_projectiles', src: 'w4/boss_projectiles.png', expect: 6, height: 110, grid: [3, 2], align: 'center' },

  // Mundo 5
  { key: 'w5_bg_far', src: 'w5/bg_far.png', type: 'image', height: 720, opaque: true, mirror: true },
  { key: 'w5_bg_mid', src: 'w5/bg_mid.png', type: 'image', height: 720, mirror: true },
  { key: 'w5_bg_near', src: 'w5/bg_near.png', type: 'image', height: 720, mirror: true },
  { key: 'w5_ground', src: 'w5/ground_texture.png', type: 'image', width: 256, opaque: true },
  { key: 'w5_boss_arena', src: 'w5/boss_arena.png', type: 'image', height: 853, opaque: true },
  { key: 'w5_tiles', src: 'w5/tiles_kit.png', expect: 12, grid: [4, 3], surface: true, ref: { frame: 1, width: 64 } },
  { key: 'w5_props', src: 'w5/props.png', expect: 10, height: 190, largest: true, cells: [[0, 0.03, 0.2, 0.5], [0.19, 0.08, 0.39, 0.5], [0.37, 0.05, 0.53, 0.43], [0.49, 0.15, 0.75, 0.5], [0.74, 0.08, 1, 0.5], [0, 0.6, 0.22, 1], [0.22, 0.52, 0.44, 1], [0.44, 0.52, 0.64, 1], [0.64, 0.52, 0.8, 1], [0.8, 0.56, 1, 1]] },
  { key: 'w5_enemy', src: 'w5/enemy.png', expect: 6, height: 62, grid: [3, 2], align: 'center', anchor: 'cell' },
  { key: 'w5_guardian', src: 'w5/guardian_ref.png', expect: 8, height: 140, largest: true, cells: [[0, 0, 0.24, 0.56], [0.24, 0, 0.46, 0.56], [0.46, 0, 0.68, 0.56], [0, 0.56, 0.25, 1], [0.25, 0.56, 0.5, 1], [0.5, 0.56, 0.75, 1], [0.75, 0.56, 1, 1], [0.68, 0, 1, 0.56]] },
  { key: 'w5_boss_idle', src: 'w5/boss_idle.png', expect: 4, height: 330, grid: [2, 2], cut: true, largest: true },
  { key: 'w5_boss_attack', src: 'w5/boss_attack.png', expect: 6, height: 330, grid: [3, 2], cut: true, largest: true },
  { key: 'w5_boss_end', src: 'w5/boss_end.png', expect: 4, height: 330, grid: [2, 2], cut: true, largest: true },
  // 0 tentáculo varrendo, 1 tentáculo subindo, 2-3 redemoinhos, 4-5 nuvens de tinta
  { key: 'w5_boss_projectiles', src: 'w5/boss_projectiles.png', expect: 6, height: 200, grid: [2, 3], cut: true, largest: true, align: 'center', anchor: 'cell' },

  // Mundo 6
  { key: 'w6_bg_far', src: 'w6/bg_far.png', type: 'image', height: 720, opaque: true, mirror: true },
  { key: 'w6_bg_mid', src: 'w6/bg_mid.png', type: 'image', height: 720, mirror: true },
  { key: 'w6_bg_near', src: 'w6/bg_near.png', type: 'image', height: 720, mirror: true },
  { key: 'w6_ground', src: 'w6/ground_texture.png', type: 'image', width: 256, opaque: true },
  { key: 'w6_boss_arena', src: 'w6/boss_arena.png', type: 'image', height: 853, opaque: true },
  { key: 'w6_tiles', src: 'w6/tiles_kit.png', expect: 12, grid: [4, 3], surface: true, ref: { frame: 1, width: 64 } },
  { key: 'w6_props', src: 'w6/props.png', expect: 10, height: 190, largest: true, cells: [[0.02, 0, 0.3, 0.38], [0.31, 0.03, 0.53, 0.38], [0.53, 0, 0.72, 0.38], [0.74, 0.02, 0.95, 0.38], [0.08, 0.38, 0.47, 0.69], [0.53, 0.42, 0.96, 0.69], [0, 0.68, 0.27, 1], [0.28, 0.68, 0.45, 1], [0.45, 0.68, 0.66, 1], [0.68, 0.68, 1, 1]] },
  { key: 'w6_enemy', src: 'w6/enemy.png', expect: 6, height: 52, grid: [3, 2], align: 'center', anchor: 'cell' },
  { key: 'w6_guardian', src: 'w6/guardian_ref.png', expect: 8, height: 140, largest: true, cells: [[0, 0, 0.23, 0.56], [0.23, 0, 0.47, 0.56], [0.47, 0, 0.69, 0.56], [0, 0.56, 0.25, 1], [0.25, 0.56, 0.5, 1], [0.5, 0.56, 0.75, 1], [0.75, 0.56, 1, 1], [0.69, 0, 1, 0.56]] },
  { key: 'w6_boss_idle', src: 'w6/boss_idle.png', expect: 4, height: 330, grid: [2, 2], cut: true, largest: true },
  { key: 'w6_boss_attack', src: 'w6/boss_attack.png', expect: 6, height: 330, grid: [3, 2], cut: true, largest: true },
  { key: 'w6_boss_end', src: 'w6/boss_end.png', expect: 4, height: 330, grid: [2, 2], cut: true, largest: true },
  // 0-1 rajadas de asa, 2 orbe-cometa, 3 orbe de eclipse, 4 cometa de sombra, 5 nuvem
  { key: 'w6_boss_projectiles', src: 'w6/boss_projectiles.png', expect: 6, height: 90, grid: [3, 2], cut: true, largest: true, align: 'center', anchor: 'cell' },

  // Mundo 7
  { key: 'w7_bg_far', src: 'w7/bg_far.png', type: 'image', height: 720, opaque: true, mirror: true },
  { key: 'w7_bg_mid', src: 'w7/bg_mid.png', type: 'image', height: 720, mirror: true },
  { key: 'w7_bg_near', src: 'w7/bg_near.png', type: 'image', height: 720, mirror: true },
  { key: 'w7_ground', src: 'w7/ground_texture.png', type: 'image', width: 256, opaque: true },
  { key: 'w7_boss_arena', src: 'w7/boss_arena.png', type: 'image', height: 853, opaque: true },
  { key: 'w7_tiles', src: 'w7/tiles_kit.png', expect: 12, grid: [4, 3], surface: true, ref: { frame: 1, width: 64 } },
  { key: 'w7_props', src: 'w7/props.png', expect: 10, height: 190, largest: true, cells: [[0.04, 0, 0.23, 0.42], [0.26, 0, 0.55, 0.42], [0.55, 0, 0.78, 0.42], [0.78, 0, 0.98, 0.42], [0.02, 0.42, 0.25, 0.73], [0.26, 0.42, 0.47, 0.73], [0.49, 0.42, 0.74, 0.73], [0.76, 0.42, 1, 0.73], [0.04, 0.73, 0.48, 1], [0.52, 0.73, 0.95, 1]] },
  { key: 'w7_enemy', src: 'w7/enemy.png', expect: 6, height: 76, grid: [3, 2], cut: true, largest: true },
  { key: 'w7_guardian', src: 'w7/guardian_ref.png', expect: 8, height: 140, largest: true, cells: [[0, 0, 0.23, 0.56], [0.23, 0, 0.47, 0.56], [0.47, 0, 0.7, 0.56], [0, 0.56, 0.25, 1], [0.25, 0.56, 0.5, 1], [0.5, 0.56, 0.75, 1], [0.75, 0.56, 1, 1], [0.7, 0, 1, 0.56]] },
  { key: 'w7_boss_p1_idle', src: 'w7/boss_p1_idle.png', expect: 4, height: 340, grid: [2, 2], cut: true, largest: true },
  { key: 'w7_boss_p1_attack', src: 'w7/boss_p1_attack.png', expect: 6, height: 340, grid: [3, 2], cut: true, largest: true },
  { key: 'w7_boss_p1_end', src: 'w7/boss_p1_end.png', expect: 4, height: 340, grid: [2, 2], cut: true, largest: true },
  { key: 'w7_boss_p2_idle', src: 'w7/boss_p2_idle.png', expect: 4, height: 360, grid: [2, 2], cut: true, largest: true },
  { key: 'w7_boss_p2_attack', src: 'w7/boss_p2_attack.png', expect: 6, height: 360, grid: [3, 2], cut: true, largest: true },
  { key: 'w7_boss_p2_end', src: 'w7/boss_p2_end.png', expect: 4, height: 360, grid: [2, 2], cut: true, largest: true },
  // 0 pedregulho, 1 máscara fantasma, 2 tornado, 3 espinho de cristal, 4 anel de máscaras, 5 orbe rachado
  { key: 'w7_boss_projectiles', src: 'w7/boss_projectiles.png', expect: 6, height: 100, grid: [3, 2], cut: true, largest: true, align: 'center', anchor: 'cell' },

  // Tela de carregamento: 7 gemas, gema vazia, Faísca voando (4), brilho (4)
  // gemas + Faísca (linhas 1-3): fica só a figura principal de cada célula, sem os respingos de brilho
  { key: 'loading_icons', src: 'ui/loading_icons.png', expect: 12, height: 110, largest: true, align: 'center', anchor: 'cell',
    cells: [0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => [c / 4, r / 4, (c + 1) / 4, (r + 1) / 4])) },
  // brilho (linha 4): os anéis são feitos de várias estrelinhas soltas, então mantém tudo da célula
  { key: 'loading_twinkle', src: 'ui/loading_icons.png', expect: 4, height: 110, align: 'center', anchor: 'cell',
    cells: [0, 1, 2, 3].map((c) => [c / 4, 0.76, (c + 1) / 4, 1]) },

  // Mapas de cada mundo (4 fases ligadas por um caminho)
  ...[1, 2, 3, 4, 5, 6, 7].map((w) => ({ key: `w${w}_map`, src: `w${w}/world_map.png`, type: 'image', height: 853, opaque: true })),

  // Cutscenes (abertura e final)
  ...['intro_1', 'intro_2', 'intro_3', 'intro_4', 'guardians', 'ending_1', 'ending_2', 'ending_true', ...[1, 2, 3, 4, 5, 6, 7].map((w) => `w${w}_outro`), ...[1, 2, 3, 4, 5, 6].map((w) => `w${w}_transition`)].map((n) => ({
    key: `cs_${n}`,
    src: `cutscenes/${n}.png`,
    type: 'image',
    height: 900,
    opaque: true,
  })),

  // Menus e mapa (Lote 4)
  { key: 'logo', src: 'ui/logo.png', type: 'image', width: 0, height: 300 },
  { key: 'title_bg', src: 'ui/title_bg.png', type: 'image', height: 853, opaque: true },
  { key: 'world_map', src: 'ui/world_map.png', type: 'image', height: 853, opaque: true },
  { key: 'map_icons', src: 'ui/map_icons.png', expect: 9, height: 70, grid: [3, 3], cut: true, largest: true, align: 'center' },
  // painéis de tamanhos diferentes: recortes explícitos (balão, moldura, painel, botão / botão aceso, apertado, chave off, on / slider, caixa, caixa marcada, seta)
  { key: 'ui_panels', src: 'ui/ui_panels.png', expect: 12, height: 180, largest: true, align: 'center', cells: [
    [0.005, 0.08, 0.33, 0.4], [0.33, 0.08, 0.52, 0.4], [0.52, 0, 0.755, 0.42], [0.76, 0.1, 0.99, 0.37],
    [0.01, 0.47, 0.275, 0.68], [0.28, 0.47, 0.53, 0.68], [0.535, 0.47, 0.75, 0.68], [0.76, 0.47, 0.99, 0.68],
    [0.02, 0.73, 0.37, 0.97], [0.39, 0.72, 0.545, 0.98], [0.58, 0.72, 0.735, 0.98], [0.775, 0.72, 0.97, 0.98] ] },

  { key: 'w1_boss_projectiles', src: 'w1/boss_projectiles.png', expect: 6, height: 90, grid: [3, 2] },
];

async function loadRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function cleanAlpha(img) {
  const { data } = img;
  for (let i = 3; i < data.length; i += 4) if (data[i] < ALPHA_MIN) data[i] = 0;
}

// Rotula as ilhas de pixels opacos numa máscara de baixa resolução.
function findIslands(img, DILATE) {
  const { data, w, h } = img;
  const bw = Math.ceil(w / BLOCK), bh = Math.ceil(h / BLOCK);
  const mask = new Uint8Array(bw * bh);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) mask[((y / BLOCK) | 0) * bw + ((x / BLOCK) | 0)]++;
    }
  }
  const solid = new Uint8Array(bw * bh);
  for (let i = 0; i < mask.length; i++) solid[i] = mask[i] >= 3 ? 1 : 0;

  const dil = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      if (!solid[y * bw + x]) continue;
      for (let dy = -DILATE; dy <= DILATE; dy++) {
        for (let dx = -DILATE; dx <= DILATE; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < bw && ny < bh) dil[ny * bw + nx] = 1;
        }
      }
    }
  }

  const label = new Int32Array(bw * bh).fill(-1);
  let count = 0;
  const stack = [];
  for (let i = 0; i < dil.length; i++) {
    if (!dil[i] || label[i] >= 0) continue;
    label[i] = count;
    stack.push(i);
    while (stack.length) {
      const j = stack.pop();
      const x = j % bw, y = (j / bw) | 0;
      const nb = [x > 0 ? j - 1 : -1, x < bw - 1 ? j + 1 : -1, y > 0 ? j - bw : -1, y < bh - 1 ? j + bw : -1];
      for (const n of nb) {
        if (n >= 0 && dil[n] && label[n] < 0) {
          label[n] = count;
          stack.push(n);
        }
      }
    }
    count++;
  }

  const boxes = Array.from({ length: count }, (_, id) => ({ id, x0: Infinity, y0: Infinity, x1: -1, y1: -1, area: 0 }));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] === 0) continue;
      const l = label[((y / BLOCK) | 0) * bw + ((x / BLOCK) | 0)];
      if (l < 0) continue;
      const b = boxes[l];
      b.area++;
      if (x < b.x0) b.x0 = x;
      if (y < b.y0) b.y0 = y;
      if (x > b.x1) b.x1 = x;
      if (y > b.y1) b.y1 = y;
    }
  }
  const minArea = MIN_AREA * w * h;
  return { label, bw, islands: boxes.filter((b) => b.area >= minArea) };
}

// Ordem de leitura: linhas de cima para baixo, e da esquerda para a direita em cada linha.
function readingOrder(islands) {
  const sorted = [...islands].sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);
  const rows = [];
  for (const isl of sorted) {
    const cy = (isl.y0 + isl.y1) / 2;
    const row = rows.find((r) => cy >= r.top && cy <= r.bottom);
    if (row) {
      row.items.push(isl);
      row.top = Math.min(row.top, isl.y0);
      row.bottom = Math.max(row.bottom, isl.y1);
    } else rows.push({ top: isl.y0, bottom: isl.y1, items: [isl] });
  }
  rows.sort((a, b) => a.top - b.top);
  return rows.flatMap((r) => r.items.sort((a, b) => a.x0 - b.x0));
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Imagens extras geradas junto com os atlas (ex.: faixas de chão). */
const extraImages = [];

// Fração da altura da primeira linha com mais de 60% de pixels opacos: o "chão" da peça
// (folhas e flores soltas acima dela ficam de fora).
function surfaceLine(c) {
  for (let y = 0; y < c.h; y++) {
    let n = 0;
    for (let x = 0; x < c.w; x++) if (c.buf[(y * c.w + x) * 4 + 3] > 0) n++;
    if (n > c.w * 0.6) return clamp01(y / c.h);
  }
  return 0;
}

// Centro horizontal (0..1) dos pixels opacos numa faixa vertical do recorte (frações da altura).
function massCenterX(c, fy0, fy1) {
  let sum = 0, n = 0;
  for (let y = Math.floor(c.h * fy0); y < Math.floor(c.h * fy1); y++) {
    for (let x = 0; x < c.w; x++) {
      if (c.buf[(y * c.w + x) * 4 + 3] > 0) {
        sum += x;
        n++;
      }
    }
  }
  return n ? clamp01(sum / n / c.w) : 0.5;
}

// Copia só os pixels que pertencem às ilhas do grupo (evita pegar pedaços do vizinho).
function extractIslands(img, lab, group) {
  const { data, w } = img;
  const ids = new Set(group.map((g) => g.id));
  const x0 = Math.min(...group.map((g) => g.x0)), y0 = Math.min(...group.map((g) => g.y0));
  const x1 = Math.max(...group.map((g) => g.x1)), y1 = Math.max(...group.map((g) => g.y1));
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const sx = x + x0, sy = y + y0;
      if (!ids.has(lab.label[((sy / BLOCK) | 0) * lab.bw + ((sx / BLOCK) | 0)])) continue;
      const si = (sy * w + sx) * 4, di = (y * cw + x) * 4;
      data.copy(out, di, si, si + 4);
    }
  }
  return { buf: out, w: cw, h: ch, x0, y0 };
}

function gridCells([cols, rows]) {
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c / cols, r / rows, (c + 1) / cols, (r + 1) / rows]);
  return cells;
}

// Recorta um retângulo e apara as bordas transparentes.
function extractRect(img, rx0, ry0, rx1, ry1) {
  const { data, w, h } = img;
  rx0 = Math.max(0, Math.round(rx0)); ry0 = Math.max(0, Math.round(ry0));
  rx1 = Math.min(w, Math.round(rx1)); ry1 = Math.min(h, Math.round(ry1));
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = ry0; y < ry1; y++) {
    for (let x = rx0; x < rx1; x++) {
      if (data[(y * w + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) data.copy(out, y * cw * 4, ((y + y0) * w + x0) * 4, ((y + y0) * w + x1 + 1) * 4);
  return { buf: out, w: cw, h: ch, x0, y0 };
}

async function processSheet(sheet) {
  const file = path.join(RAW, sheet.src);
  if (!fs.existsSync(file)) return null;

  const img = await loadRaw(file);
  cleanAlpha(img);
  const lab = findIslands(img, sheet.dilate ?? DEFAULT_DILATE);
  let crops;
  const align = sheet.align ?? 'bottom';
  if (sheet.cells || (sheet.grid && sheet.cut)) {
    // corte por célula: para sheets em que as figuras encostam umas nas outras
    const cells = sheet.cells ?? gridCells(sheet.grid);
    crops = cells
      .map(([fx0, fy0, fx1, fy1]) => {
        let c = extractRect(img, fx0 * img.w, fy0 * img.h, fx1 * img.w, fy1 * img.h);
        if (!c) return null;
        const cellX = ((fx0 + fx1) / 2) * img.w, cellY = ((fy0 + fy1) / 2) * img.h;
        if (sheet.largest) {
          // descarta lascas de figuras vizinhas que entraram na célula: fica só a maior ilha
          const sub = { data: c.buf, w: c.w, h: c.h };
          const subLab = findIslands(sub, 1);
          const big = subLab.islands.sort((a, b) => b.area - a.area)[0];
          if (big) {
            const kept = extractIslands(sub, subLab, [big]);
            c = { ...kept, x0: c.x0 + kept.x0, y0: c.y0 + kept.y0 };
          }
        }
        c.anchor = { x: cellX - c.x0, y: cellY - c.y0 };
        return c;
      })
      .filter(Boolean);
  } else {
    let groups;
    if (sheet.grid) {
      // ordem pela célula da grade; pedaços soltos na mesma célula viram um só frame
      const [cols, rows] = sheet.grid;
      const byCell = new Map();
      for (const isl of lab.islands) {
        const cx = (isl.x0 + isl.x1) / 2, cy = (isl.y0 + isl.y1) / 2;
        const cell = Math.min(rows - 1, Math.floor(cy / (img.h / rows))) * cols + Math.min(cols - 1, Math.floor(cx / (img.w / cols)));
        if (!byCell.has(cell)) byCell.set(cell, []);
        byCell.get(cell).push(isl);
      }
      const keys = [...byCell.keys()].sort((a, b) => a - b);
      crops = keys.map((k) => {
        const c = extractIslands(img, lab, byCell.get(k));
        // âncora = centro da célula: mantém o personagem parado entre frames de larguras diferentes
        c.anchor = { x: ((k % cols) + 0.5) * (img.w / cols) - c.x0, y: (Math.floor(k / cols) + 0.5) * (img.h / rows) - c.y0 };
        return c;
      });
    } else crops = readingOrder(lab.islands).map((isl) => extractIslands(img, lab, [isl]));
  }

  if (sheet.expect && crops.length !== sheet.expect) {
    console.warn(`  ⚠ ${sheet.src}: esperava ${sheet.expect} figuras, encontrei ${crops.length}. Confira se alguma está encostando em outra.`);
  }
  if (sheet.pick) crops = sheet.pick.map((i) => crops[i]).filter(Boolean);
  if (!crops.length) {
    console.warn(`  ✖ ${sheet.src}: nenhuma figura encontrada (o fundo é transparente?)`);
    return null;
  }
  // escala: pela maior figura (height) ou por uma peça de referência (ref: { frame, width | height })
  let scale;
  if (sheet.ref) {
    const c = crops[sheet.ref.frame];
    scale = sheet.ref.width ? (sheet.ref.width * RES) / c.w : (sheet.ref.height * RES) / c.h;
  } else scale = (sheet.height * RES) / Math.max(...crops.map((c) => c.h));

  const frames = [];
  for (const c of crops) {
    const w = Math.max(1, Math.round(c.w * scale)), h = Math.max(1, Math.round(c.h * scale));
    const buf = await sharp(c.buf, { raw: { width: c.w, height: c.h, channels: 4 } })
      .resize(w, h, { kernel: 'lanczos3' })
      .png()
      .toBuffer();
    // pivô do frame (usado pelo Phaser como origem). Figuras apoiadas no chão: x = centro de massa
    // dos pés (faixa inferior), que fica estável entre frames; as demais usam o centro da célula.
    // anchor: 'feet' (padrão; bom para poses paradas) | 'head' (corrida/pulo, em que os pés se abrem) | 'cell'
    const anchor = sheet.anchor ?? (align === 'bottom' ? 'feet' : 'cell');
    const px =
      anchor === 'feet' ? massCenterX(c, 0.8, 1) : anchor === 'head' ? massCenterX(c, 0, 0.2) : c.anchor ? clamp01(c.anchor.x / c.w) : 0.5;
    let py = align === 'bottom' ? 1 : c.anchor ? clamp01(c.anchor.y / c.h) : 0.5;
    // peças de terreno: o pivô vertical marca a linha onde se pisa (primeira faixa "cheia")
    if (sheet.surface) py = surfaceLine(c);
    frames.push({ buf, w, h, pivot: { x: sheet.surface ? 0.5 : +px.toFixed(3), y: +py.toFixed(3) } });
  }

  // Faixa de chão contínua: o miolo da peça de topo (frame 1), espelhado ao lado de si mesmo
  // para emendar sem costura. O jogo a repete ao longo de cada trecho de chão.
  if (sheet.surface) {
    const top = frames[1];
    const cut = Math.round(top.w * 0.25), cw = top.w - cut * 2;
    const mid = await sharp(top.buf).extract({ left: cut, top: 0, width: cw, height: top.h }).png().toBuffer();
    const flop = await sharp(mid).flop().toBuffer();
    await sharp({ create: { width: cw * 2, height: top.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: mid, left: 0, top: 0 }, { input: flop, left: cw, top: 0 }])
      .png()
      .toFile(path.join(SPRITES_DIR, `${sheet.key}_strip.png`));
    extraImages.push({ key: `${sheet.key}_strip`, type: 'image', file: `sprites/${sheet.key}_strip.png`, res: RES });
  }

  // Atlas: cada frame com o próprio tamanho, empacotado em prateleiras de até MAX_W.
  // No jogo, a origem do sprite (ex.: 0.5, 1) alinha os frames pelo pé ou pelo centro.
  const MAX_W = 4096;
  let x = 0, y = 0, shelfH = 0, atlasW = 0;
  const atlasFrames = {};
  const composites = [];
  frames.forEach((f, i) => {
    const cw = f.w + PAD * 2, ch = f.h + PAD * 2;
    if (x + cw > MAX_W) {
      x = 0;
      y += shelfH;
      shelfH = 0;
    }
    composites.push({ input: f.buf, left: x + PAD, top: y + PAD });
    atlasFrames[String(i)] = {
      frame: { x: x + PAD, y: y + PAD, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
      pivot: f.pivot,
    };
    x += cw;
    shelfH = Math.max(shelfH, ch);
    atlasW = Math.max(atlasW, x);
  });
  const atlasH = y + shelfH;

  const outFile = `${sheet.key}.png`;
  await sharp({ create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(SPRITES_DIR, outFile));
  fs.writeFileSync(
    path.join(SPRITES_DIR, `${sheet.key}.json`),
    JSON.stringify({ frames: atlasFrames, meta: { image: outFile, size: { w: atlasW, h: atlasH }, scale: '1' } }),
  );

  console.log(`  ✔ ${sheet.key}: ${frames.length} frame(s)`);
  return { key: sheet.key, type: 'atlas', file: `sprites/${outFile}`, json: `sprites/${sheet.key}.json`, frames: frames.length, res: RES };
}

// Fundos e texturas: só redimensiona (sem separar figuras).
async function processImage(entry) {
  const file = path.join(RAW, entry.src);
  if (!fs.existsSync(file)) return null;
  let pipe = sharp(file).ensureAlpha();
  if (entry.height) pipe = pipe.resize({ height: entry.height, kernel: 'lanczos3' });
  else if (entry.width) pipe = pipe.resize({ width: entry.width, height: entry.width, fit: 'fill', kernel: 'lanczos3' });
  if (entry.mirror) {
    // imagem + cópia espelhada lado a lado: as bordas sempre combinam ao repetir (parallax sem emenda)
    const buf = await pipe.png().toBuffer();
    const { width, height } = await sharp(buf).metadata();
    const flopped = await sharp(buf).flop().toBuffer();
    pipe = sharp({ create: { width: width * 2, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: buf, left: 0, top: 0 }, { input: flopped, left: width, top: 0 }])
      .png();
    pipe = sharp(await pipe.toBuffer());
  }
  if (entry.opaque) pipe = pipe.removeAlpha();
  const outFile = `${entry.key}.${entry.opaque ? 'jpg' : 'png'}`;
  if (entry.opaque) await pipe.jpeg({ quality: 88 }).toFile(path.join(SPRITES_DIR, outFile));
  else {
    // limpa o halo semitransparente também nas camadas de parallax
    const { data, info } = await pipe.raw().toBuffer({ resolveWithObject: true });
    cleanAlpha({ data });
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(SPRITES_DIR, outFile));
  }
  console.log(`  ✔ ${entry.key}: imagem`);
  return { key: entry.key, type: 'image', file: `sprites/${outFile}`, res: 1 };
}

fs.mkdirSync(SPRITES_DIR, { recursive: true });
console.log('Processando assets...');
const manifest = { sprites: [] };
for (const sheet of SHEETS) {
  const entry = sheet.type === 'image' ? await processImage(sheet) : await processSheet(sheet);
  if (entry) manifest.sprites.push(entry);
}
manifest.sprites.push(...extraImages);
// Áudio: copia assets/audio/{musica,sfx} para public/assets/audio e registra no manifest.
// A chave é o nome do arquivo sem extensão (ex.: sfx/jump.wav → "sfx_jump").
manifest.audio = [];
for (const [dir, prefix] of [['musica', 'music'], ['sfx', 'sfx']]) {
  const src = path.join('assets/audio', dir);
  if (!fs.existsSync(src)) continue;
  const dest = path.join(OUT_DIR, 'audio', dir);
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    if (!/\.(mp3|ogg|wav|m4a)$/i.test(f)) continue;
    fs.copyFileSync(path.join(src, f), path.join(dest, f));
    manifest.audio.push({ key: `${prefix}_${path.parse(f).name}`, file: `audio/${dir}/${f}` });
  }
}
console.log(`  ✔ áudio: ${manifest.audio.length} arquivo(s)`);
// Modelos 3D do visual 3D (beta): copia assets/models/*.glb|.gltf para public/assets/models.
// A chave é o nome do arquivo sem extensão (ex.: iris.glb → "iris"); veja docs/MODELOS-3D.md.
manifest.models = [];
if (fs.existsSync('assets/models')) {
  const dest = path.join(OUT_DIR, 'models');
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync('assets/models')) {
    if (!/\.(glb|gltf)$/i.test(f)) continue;
    fs.copyFileSync(path.join('assets/models', f), path.join(dest, f));
    manifest.models.push({ key: path.parse(f).name, file: `models/${f}` });
  }
}
console.log(`  ✔ modelos 3D: ${manifest.models.length} arquivo(s)`);
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Pronto: ${manifest.sprites.length} asset(s) em ${SPRITES_DIR}`);
