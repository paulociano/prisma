import { LevelBuilder } from './LevelBuilder';

// Mundo 2 · Cânion do Entardecer. Novidades: escorpiões que se enterram,
// gêiseres de vapor e rajadas de areia. Íris já tem o pulo duplo.

// Fase 2-1: apresenta escorpiões e gêiseres.
export function level2_1() {
  const b = new LevelBuilder('2-1', 'Trilha do Entardecer', 2, 130);

  b.ground(0, 14, 2).add('player', 2, 9).coins(6, 10, 9);
  b.hint(7, 4, 'Treino: salte e aperte PULAR novamente no ar para usar o pulo duplo.'); // prática em área inicial segura
  b.ground(17, 30, 2).coinArc(14, 8, 3).add('scorpion', 24, 9);
  b.hint(22, 5, 'Escorpiões se enterram: espere sair da areia!');

  // primeiro gêiser leva até a plataforma alta com o 1º fragmento
  b.ground(31, 44, 2).vent(36, 9).hint(33, 5, 'Gêiseres de vapor lançam você para o alto');
  b.block(37, 4, 42, 4).coins(38, 40, 3).add('shard', 41, 3);

  // buraco largo: pulo duplo
  b.oneway(47, 47, 8).coins(46, 48, 6);

  b.ground(50, 66, 2).add('checkpoint', 51, 9).add('blot', 56, 9);
  b.add('crate', 59, 9).add('crate', 59, 8).add('heart', 61, 9).add('scorpion', 63, 9);

  // espinhos de cacto com plataformas
  b.ground(67, 74, 1).spikes(67, 74, 10).oneway(69, 70, 7).oneway(72, 73, 6).coins(72, 73, 5);

  b.ground(75, 95, 3).add('checkpoint', 76, 8).add('megaphone', 82, 8).add('moth', 85, 4).add('scorpion', 88, 8);
  b.vent(89, 8, 2.6, 0.5).oneway(90, 92, 3).add('shard', 91, 2);

  b.ground(96, 129, 2).add('padlock', 104, 9).add('scorpion', 110, 9);
  b.block(114, 6, 116, 6).add('shard', 115, 5).coins(114, 116, 5);
  b.add('exit', 124, 9);

  return b.build();
}

// Fase 2-2: fontes termais, rajadas de areia e plataformas móveis.
export function level2_2() {
  const b = new LevelBuilder('2-2', 'Fontes Termais', 2, 136);

  b.ground(0, 12, 2).add('player', 2, 9);
  b.mover(14, 8, 5, 0, 2, 3.5).coins(15, 19, 6);

  // vento contra: segure firme
  b.ground(23, 40, 2).add('checkpoint', 24, 9).wind(28, 4, 11, 6, -1).add('scorpion', 34, 9).coins(29, 37, 8);
  b.hint(27, 3, 'Rajadas de areia empurram! Segure firme.');

  // elevador de vapor até o andar de cima
  b.ground(41, 46, 2).vent(46, 9);
  b.block(47, 4, 60, 4).add('megaphone', 53, 3).coins(48, 51, 3).add('shard', 59, 3);

  b.ground(61, 78, 2).add('checkpoint', 62, 9).add('blot', 66, 9).add('scorpion', 72, 9);
  // vento a favor ajuda a atravessar o abismo largo
  b.wind(74, 4, 13, 6, 1, 260).coins(80, 84, 6).hint(74, 3, 'Vento a favor: corra e pule!');

  b.ground(85, 105, 2).add('checkpoint', 87, 9);
  // plataforma que sobe até o 2º fragmento
  b.mover(91, 9, 0, -4, 2, 4).block(94, 5, 97, 5).add('shard', 96, 4).coins(94, 95, 4);

  b.ground(106, 135, 2).add('moth', 110, 5).add('scorpion', 115, 9).add('padlock', 120, 9);
  b.vent(124, 9, 2.4).oneway(125, 127, 3).add('shard', 126, 2);
  b.add('exit', 131, 9);

  return b.build();
}

// Fase 2-3: a mais difícil do mundo; termina com a Sol presa no cristal.
export function level2_3() {
  const b = new LevelBuilder('2-3', 'Paredões de Arenito', 2, 140);

  b.ground(0, 10, 2).add('player', 2, 9);

  b.ground(11, 22, 1).spikes(11, 22, 10);
  b.oneway(13, 14, 8).oneway(17, 18, 7).oneway(20, 21, 8).add('moth', 16, 4).coins(17, 18, 6);

  b.ground(23, 34, 3).add('scorpion', 28, 8).add('scorpion', 32, 8);

  // plataforma móvel com rajadas no alto: ela leva Íris quase até o outro lado.
  // O vento fica só acima da plataforma (linhas 2–5), atrapalhando pulos altos,
  // mas sem empurrar Íris para fora enquanto ela está em pé na plataforma.
  b.mover(35, 9, 7, 0, 2, 4).wind(35, 2, 10, 4, -1, 150);

  b.ground(45, 62, 2).add('checkpoint', 48, 9).add('megaphone', 55, 9);
  b.add('crate', 58, 9).add('heart', 59, 9);
  b.vent(60, 9, 2.6).oneway(61, 63, 3).add('shard', 62, 2);

  // blocos sobre o abismo; o 2º fragmento pede pulo duplo
  b.block(65, 7, 66, 7).block(69, 5, 70, 5).block(73, 6, 74, 6).block(77, 8, 78, 8);
  b.add('shard', 70, 2).coins(65, 66, 6).coins(73, 74, 5);

  b.ground(80, 100, 2).add('checkpoint', 81, 9).add('scorpion', 86, 9).add('blot', 90, 9).add('padlock', 95, 9);

  b.ground(101, 110, 1).spikes(101, 110, 10).mover(102, 8, 6, 0, 2, 3.5).add('shard', 106, 4);

  b.ground(111, 139, 2).add('checkpoint', 112, 9).add('scorpion', 118, 9);
  b.add('guardian', 128, 9).hint(125, 5, 'Golpeie o cristal para libertar a Sol!');
  b.add('exit', 135, 9);

  return b.build();
}

// Fase 2-4: arena da Serpente das Areias.
export function level2_4() {
  const b = new LevelBuilder('2-4', 'Arena das Areias', 2, 20);
  b.arena = 'w2_boss_arena';
  b.ground(0, 19, 2).add('player', 3, 9).add('boss', 15, 9);
  return b.build();
}
