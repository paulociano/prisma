import { LevelBuilder } from './LevelBuilder';

// Mundo 6 · Ilhas do Céu Anil. Gravidade leve (0.6): pulos bem mais altos e longos.
// Novidades: cometas de sombra e ilhas flutuantes. O mergulho estelar vem de Bix, no fim da 6-3.

const SKY = 0.6;

// Fase 6-1: escadaria de estrelas; apresenta a gravidade leve e os cometas.
export function level6_1() {
  const b = new LevelBuilder('6-1', 'Escadaria de Estrelas', 6, 130);
  b.gravity = SKY;

  b.ground(0, 14, 2).add('player', 2, 9).coins(6, 10, 9);
  b.hint(7, 4, 'Treino: aperte C/I (B no controle) para disparar um prisma.'); // prática em área inicial segura
  b.hint(5, 5, 'Aqui a gravidade é leve: pulos mais altos e mais longos!');

  // ilhas flutuantes
  b.block(19, 8, 23, 9).block(28, 6, 31, 7).block(36, 8, 40, 9).add('comet', 30, 3).coins(29, 30, 5).coins(37, 39, 7);
  b.hint(26, 2, 'Cometas de sombra riscam o céu: passe por baixo ou golpeie!');

  b.ground(44, 60, 2).add('checkpoint', 45, 9).add('blot', 50, 9).add('megaphone', 57, 9);
  b.block(52, 4, 54, 4).add('shard', 53, 3);

  b.ground(67, 82, 2).add('comet', 74, 6).add('moth', 78, 5).add('padlock', 80, 9).coinArc(61, 7, 6);
  b.mover(84, 8, 4, 0, 2, 3);

  b.ground(91, 105, 2).add('checkpoint', 92, 9).add('spring', 97, 9).block(99, 2, 103, 2).add('shard', 102, 1).coins(99, 101, 1);

  b.ground(106, 129, 2).add('comet', 112, 6).add('blot', 117, 9).block(119, 6, 121, 6).add('shard', 120, 5);
  b.add('exit', 125, 9);

  return b.build();
}

// Fase 6-2: observatório; elevadores, espinhos de cristal e faixas de cometas.
export function level6_2() {
  const b = new LevelBuilder('6-2', 'Observatório', 6, 130);
  b.gravity = SKY;

  b.ground(0, 12, 2).add('player', 2, 9);
  b.ground(13, 24, 1).spikes(13, 24, 10).block(16, 6, 17, 6).block(21, 5, 22, 5).add('comet', 19, 3).coins(16, 17, 5);

  b.ground(25, 40, 2).add('checkpoint', 26, 9).add('megaphone', 33, 9).mover(36, 9, 0, -5, 2, 4);
  b.block(38, 3, 44, 3).add('shard', 43, 2).add('comet', 41, 0);
  b.ground(41, 52, 2).add('padlock', 47, 9);

  // abismo de 8 blocos com uma ilha no meio
  b.block(56, 6, 57, 6).coinArc(53, 6, 8);

  b.ground(61, 80, 2).add('checkpoint', 62, 9).add('comet', 68, 5).add('comet', 74, 7).add('blot', 77, 9);

  b.ground(81, 92, 1).spikes(81, 92, 10).mover(82, 7, 7, 0, 2, 3.5).add('shard', 86, 4);

  b.ground(93, 129, 2).add('checkpoint', 94, 9).add('moth', 100, 5).add('padlock', 106, 9);
  b.add('spring', 108, 9).block(110, 4, 113, 4).add('shard', 112, 3).add('comet', 118, 6);
  b.add('exit', 124, 9);

  return b.build();
}

// Fase 6-3: a mais difícil do mundo; termina com Bix preso e uma câmara cuja
// única entrada é um teto de blocos rachados (precisa do mergulho estelar).
export function level6_3() {
  const b = new LevelBuilder('6-3', 'Coração da Constelação', 6, 140);
  b.gravity = SKY;

  b.ground(0, 10, 2).add('player', 2, 9);
  b.block(14, 8, 16, 9).block(20, 6, 22, 7).block(26, 8, 28, 9).add('comet', 21, 3).add('shard', 21, 5);

  b.ground(31, 48, 2).add('checkpoint', 32, 9).add('padlock', 38, 9).add('megaphone', 44, 9).add('comet', 40, 5);

  b.ground(49, 60, 1).spikes(49, 60, 10).mover(50, 8, 8, 0, 2, 3.5).add('comet', 55, 4);

  b.ground(61, 78, 2).add('checkpoint', 62, 9).add('blot', 66, 9).block(70, 3, 73, 3).add('shard', 72, 2).add('moth', 75, 5);

  b.ground(86, 139, 2).add('checkpoint', 87, 9).add('comet', 94, 6).add('padlock', 100, 9);
  b.block(104, 6, 106, 6).add('shard', 105, 5).coinArc(79, 7, 7);

  b.add('guardian', 114, 9).hint(111, 5, 'Golpeie o cristal para libertar Bix!');

  // câmara da saída: teto com blocos rachados, parede à esquerda
  b.block(122, 4, 126, 5).block(130, 4, 139, 5).cracked(127, 129, 5).block(122, 6, 122, 9);
  b.hint(126, 1, 'Suba no teto e aperte ↓ no ar: MERGULHO ESTELAR!');
  b.add('exit', 134, 9);

  return b.build();
}

// Fase 6-4: ilha do Eclipse.
export function level6_4() {
  const b = new LevelBuilder('6-4', 'Ilha do Eclipse', 6, 20);
  b.arena = 'w6_boss_arena';
  b.gravity = SKY;
  b.ground(0, 19, 2).add('player', 3, 9).add('boss', 15, 9);
  return b.build();
}
