import { LevelBuilder } from './LevelBuilder';

// Mundo 4 · Selva Esmeralda. Novidades: plantas mordedoras e torres que se sobem
// com o pulo na parede. O planar vem do Ramo, no fim da 4-3.

// Fase 4-1: trilha das samambaias; apresenta as mordedoras e as chaminés de pedra.
export function level4_1() {
  const b = new LevelBuilder('4-1', 'Trilha das Samambaias', 4, 130);

  b.ground(0, 14, 2).add('player', 2, 9).coins(6, 10, 9);
  b.hint(7, 4, 'Treino: encoste numa parede e pule novamente para usar o pulo na parede.'); // prática em área inicial segura
  b.ground(17, 30, 2).coinArc(14, 8, 3).add('snapper', 24, 9);
  b.hint(21, 5, 'Plantas mordedoras dão bote: espere a boca fechar!');

  // primeira chaminé: pilar + paredão que bloqueia a trilha
  b.ground(31, 58, 2).block(36, 3, 36, 7).block(39, 4, 44, 9).coins(37, 38, 4).add('shard', 43, 3);
  b.hint(33, 1, 'Suba pulando de uma parede para a outra');
  b.add('checkpoint', 46, 9).add('moth', 52, 5).add('snapper', 56, 9);

  b.ground(59, 66, 1).spikes(59, 66, 10).oneway(61, 62, 7).oneway(64, 65, 6).add('moth', 63, 3);

  // folha-mola até a copa com o 2º fragmento
  b.ground(67, 84, 2).add('checkpoint', 68, 9).add('spring', 72, 9).block(74, 4, 79, 4).coins(74, 77, 3).add('shard', 78, 3).add('blot', 82, 9);

  b.ground(85, 129, 2).add('snapper', 92, 9).add('padlock', 98, 9);
  // segunda chaminé, com o 3º fragmento no topo da torre
  b.block(104, 2, 104, 7).block(107, 3, 108, 9).add('shard', 107, 2);
  b.add('moth', 115, 5).add('exit', 124, 9);

  return b.build();
}

// Fase 4-2: cachoeiras; elevadores de cipó e mais escaladas.
export function level4_2() {
  const b = new LevelBuilder('4-2', 'Cachoeiras', 4, 136);

  b.ground(0, 12, 2).add('player', 2, 9);
  b.ground(15, 30, 2).coinArc(12, 8, 3).add('snapper', 22, 9).add('moth', 26, 5);

  // elevador até a borda alta; embaixo, a trilha segue também
  b.ground(31, 50, 2).add('checkpoint', 32, 9).mover(35, 9, 0, -5, 2, 4).block(38, 4, 50, 4);
  b.add('snapper', 44, 3).coins(39, 42, 3).add('shard', 49, 3);

  b.ground(51, 58, 1).spikes(51, 58, 10).mover(52, 8, 4, 0, 2, 3);

  b.ground(59, 96, 2).add('checkpoint', 60, 9).add('padlock', 66, 9).add('blot', 71, 9);
  // torre que bloqueia a trilha: escale pela chaminé
  b.block(74, 2, 74, 7).block(77, 3, 79, 9).add('shard', 78, 2);
  b.add('snapper', 86, 9).add('moth', 90, 4);

  b.ground(97, 104, 1).spikes(97, 104, 10).oneway(99, 100, 7).oneway(102, 103, 7);

  b.ground(105, 135, 2).add('checkpoint', 106, 9).add('spring', 110, 9).block(112, 4, 116, 4).add('shard', 115, 3);
  b.add('snapper', 120, 9).add('megaphone', 125, 9).add('exit', 131, 9);

  return b.build();
}

// Fase 4-3: a mais difícil do mundo; termina com o Ramo preso e um abismo
// que só se atravessa planando.
export function level4_3() {
  const b = new LevelBuilder('4-3', 'Coração da Selva', 4, 140);

  b.ground(0, 10, 2).add('player', 2, 9);
  b.ground(11, 20, 1).spikes(11, 20, 10).oneway(13, 14, 8).oneway(17, 18, 7).add('moth', 16, 3).add('shard', 17, 5);

  b.ground(21, 34, 2).add('snapper', 26, 9).add('snapper', 31, 9);

  // chaminé alta
  b.ground(35, 52, 2).add('checkpoint', 36, 9).block(37, 1, 37, 7).block(40, 2, 43, 9).coins(38, 39, 3).add('blot', 48, 9);

  b.ground(53, 60, 1).spikes(53, 60, 10).mover(54, 8, 4, 0, 2, 3);

  b.ground(61, 80, 2).add('checkpoint', 62, 9).add('padlock', 68, 9).add('moth', 72, 4).add('crate', 76, 9).add('heart', 77, 9);

  // pedras sobre o abismo
  b.block(83, 8, 84, 8).block(87, 6, 88, 6).block(91, 7, 92, 7).add('shard', 87, 4).coins(91, 92, 6);

  b.ground(95, 122, 2).add('checkpoint', 96, 9).add('snapper', 102, 9).add('megaphone', 108, 9);
  b.oneway(110, 111, 7).add('shard', 111, 5);

  // Ramo preso; depois dele, o grande abismo até a saída: só planando
  b.add('guardian', 117, 9).hint(114, 5, 'Golpeie o cristal para libertar o Ramo!');
  b.hint(121, 4, 'Pulo duplo e SEGURE pular para planar!').coinArc(124, 7, 7);
  b.ground(132, 139, 2).add('exit', 136, 9);

  return b.build();
}

// Fase 4-4: jardim da Espinheira.
export function level4_4() {
  const b = new LevelBuilder('4-4', 'Jardim de Espinhos', 4, 20);
  b.arena = 'w4_boss_arena';
  b.ground(0, 19, 2).add('player', 3, 9).add('boss', 15, 9);
  return b.build();
}
