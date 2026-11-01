import { LevelBuilder } from './LevelBuilder';

// Mundo 7 · Cidadela Cinza. Fases finais: misturam todos os inimigos e habilidades.
// Novidade: Sentinelas Cinzas, que bloqueiam de frente com o escudo (ataque por cima ou pelas costas).

// Fase 7-1: portões da Cidadela.
export function level7_1() {
  const b = new LevelBuilder('7-1', 'Portões da Cidadela', 7, 130);

  b.ground(0, 14, 2).add('player', 2, 9).add('sentinel', 11, 9);
  b.hint(7, 4, 'Treino: no ar, aperte BAIXO para usar o mergulho estelar.'); // prática em área inicial segura
  b.hint(7, 5, 'Sentinelas bloqueiam de frente: pule em cima ou ataque pelas costas!');

  b.ground(17, 32, 2).coinArc(14, 8, 3).add('sentinel', 25, 9);
  b.ground(33, 42, 1).spikes(33, 42, 10).oneway(35, 36, 7).oneway(39, 40, 6);

  // chaminé até o 1º fragmento
  b.ground(43, 80, 2).add('checkpoint', 44, 9).add('megaphone', 50, 9).block(53, 3, 53, 7).block(56, 4, 60, 9).add('shard', 59, 3).coins(54, 55, 4);
  b.add('sentinel', 66, 9).add('drone', 72, 4).add('crate', 76, 9).add('heart', 77, 9);

  // abismo largo: pulo duplo e planar
  b.coinArc(81, 7, 6);
  b.ground(87, 105, 2).add('checkpoint', 88, 9).add('padlock', 94, 9).add('comet', 98, 5).add('spring', 97, 9).block(100, 3, 103, 3).add('shard', 102, 2);

  b.ground(106, 129, 2).add('sentinel', 112, 9).add('scorpion', 117, 9).block(120, 7, 122, 7).add('shard', 121, 6);
  b.add('exit', 125, 9);

  return b.build();
}

// Fase 7-2: salão dos espelhos; gêiser, plataformas e muitos sentinelas.
export function level7_2() {
  const b = new LevelBuilder('7-2', 'Salão dos Espelhos', 7, 130);

  b.ground(0, 12, 2).add('player', 2, 9);
  b.ground(13, 26, 1).spikes(13, 26, 10).mover(14, 8, 8, 0, 2, 3.5).add('comet', 20, 4);

  b.ground(27, 44, 2).add('checkpoint', 28, 9).add('sentinel', 34, 9).add('snapper', 40, 9);
  b.ground(45, 52, 1).spikes(45, 52, 10).block(47, 6, 48, 6).block(50, 4, 51, 4).add('shard', 50, 3);

  b.ground(53, 88, 2).add('checkpoint', 54, 9).add('sentinel', 58, 9).add('drone', 62, 4);
  b.block(64, 3, 64, 7).block(67, 4, 70, 9).add('shard', 69, 3);
  b.add('megaphone', 76, 9).add('sentinel', 82, 9).vent(85, 9).block(86, 4, 88, 4).add('shard', 87, 3);

  b.ground(89, 96, 1).spikes(89, 96, 10).mover(90, 8, 5, 0, 2, 3);

  b.ground(97, 129, 2).add('checkpoint', 98, 9).add('sentinel', 104, 9).add('sentinel', 110, 9).add('moth', 114, 5);
  b.add('exit', 125, 9);

  return b.build();
}

// Fase 7-3: a última subida; termina com Ás preso no cristal.
export function level7_3() {
  const b = new LevelBuilder('7-3', 'Torre do Trono', 7, 136);

  b.ground(0, 10, 2).add('player', 2, 9);
  b.ground(11, 22, 1).spikes(11, 22, 10).oneway(13, 14, 8).oneway(17, 18, 7).oneway(20, 21, 8).add('comet', 17, 3).add('shard', 17, 5);

  b.ground(23, 40, 2).add('checkpoint', 24, 9).add('sentinel', 29, 9).add('sentinel', 35, 9);

  // chaminé alta com o 2º fragmento no topo
  b.ground(41, 56, 2).block(42, 1, 42, 7).block(45, 2, 48, 9).add('shard', 47, 1).add('checkpoint', 50, 9).add('snapper', 54, 9);

  // abismo de 8 blocos
  b.coinArc(57, 7, 8);

  b.ground(65, 82, 2).add('checkpoint', 66, 9).add('sentinel', 72, 9).add('drone', 76, 4).add('crate', 79, 9).add('heart', 80, 9);
  b.ground(83, 94, 1).spikes(83, 94, 10).mover(84, 8, 7, 0, 2, 3.5).add('shard', 88, 5);

  b.ground(95, 135, 2).add('checkpoint', 96, 9).add('sentinel', 102, 9).add('megaphone', 107, 9);
  b.add('guardian', 116, 9).hint(113, 5, 'Golpeie o cristal para libertar Ás!');
  b.add('exit', 128, 9);

  return b.build();
}

// Fase 7-4: sala do trono de Monocromo (chefão final, duas formas).
export function level7_4() {
  const b = new LevelBuilder('7-4', 'Sala do Trono', 7, 20);
  b.arena = 'w7_boss_arena'; // sem arte própria: usa o cenário do mundo como fundo
  b.ground(0, 19, 2).add('player', 3, 9).add('boss', 15, 9);
  return b.build();
}
