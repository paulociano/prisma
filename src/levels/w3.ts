import { LevelBuilder } from './LevelBuilder';

// Mundo 3 · Cidade Solar. Novidades: drones vigias e holofotes de vigia (luz fria que machuca).
// Íris tem pulo duplo e dash; o pulo na parede vem da Aurora, no fim da 3-3.

// Fase 3-1: telhados do festival; apresenta drones e holofotes.
export function level3_1() {
  const b = new LevelBuilder('3-1', 'Telhados do Festival', 3, 130);

  b.ground(0, 14, 2).add('player', 2, 9).coins(6, 10, 9);
  b.ground(17, 28, 3).coinArc(14, 8, 3).add('drone', 23, 4);
  b.hint(22, 4, 'Drones vigiam do alto: se a luz te achar, eles mergulham!');

  b.ground(31, 46, 2).add('checkpoint', 32, 9).searchlight(39, 1, 10, 3).coins(42, 45, 9);
  b.hint(38, 6, 'A luz fria machuca: passe quando ela se afastar');

  // toldo-mola até o telhado alto com o 1º fragmento
  b.ground(47, 58, 3).add('spring', 49, 8).block(50, 3, 55, 3).coins(51, 53, 2).add('shard', 55, 2).add('megaphone', 56, 8);

  // vão de 4 blocos
  b.ground(63, 78, 2).add('checkpoint', 64, 9).add('drone', 70, 4).add('padlock', 75, 9);

  b.ground(79, 86, 1).spikes(79, 86, 10).oneway(81, 82, 7).oneway(84, 85, 6).coins(84, 85, 5);

  b.ground(87, 104, 2).searchlight(95, 1, 10, 4, 3.6).add('blot', 91, 9).add('shard', 96, 8).coins(99, 102, 9);

  b.ground(105, 129, 2).add('megaphone', 110, 9).add('drone', 116, 4);
  b.block(118, 6, 120, 6).add('shard', 119, 5);
  b.add('exit', 125, 9);

  return b.build();
}

// Fase 3-2: varais e toldos; plataformas móveis sob a vigia dos holofotes.
export function level3_2() {
  const b = new LevelBuilder('3-2', 'Varais e Toldos', 3, 136);

  b.ground(0, 12, 2).add('player', 2, 9);
  b.mover(14, 8, 5, 0, 2, 3.5).coins(15, 19, 6);

  b.ground(22, 36, 2).add('checkpoint', 23, 9).searchlight(30, 1, 10, 3).add('drone', 33, 4);

  b.ground(37, 44, 3).add('spring', 39, 8).block(41, 3, 48, 3).coins(42, 46, 2).add('shard', 47, 2);
  b.ground(45, 60, 2).add('padlock', 50, 9).add('blot', 56, 9);

  // vão de 6 blocos: pulo duplo
  b.ground(67, 80, 2).add('checkpoint', 68, 9).add('drone', 74, 4).add('megaphone', 78, 9).coinArc(61, 8, 6);

  // elevador até o terraço com o 2º fragmento
  b.ground(81, 96, 2).mover(84, 9, 0, -5, 2, 4).block(87, 3, 92, 3).coins(87, 90, 2).add('shard', 91, 2);

  // longa plataforma sobre espinhos, com um holofote varrendo: pule a luz!
  b.ground(97, 112, 1).spikes(97, 112, 10).mover(98, 8, 12, 0, 2, 6).searchlight(105, 1, 8, 4, 2.6).add('shard', 104, 5);
  b.hint(99, 3, 'Na plataforma, pule quando a luz chegar');

  b.ground(113, 135, 2).add('checkpoint', 114, 9).add('drone', 120, 4).add('padlock', 124, 9);
  b.add('exit', 131, 9);

  return b.build();
}

// Fase 3-3: a mais difícil do mundo; termina com a Aurora presa e uma chaminé
// que só se sobe com o pulo na parede que ela ensina.
export function level3_3() {
  const b = new LevelBuilder('3-3', 'Torre do Relógio Solar', 3, 140);

  b.ground(0, 10, 2).add('player', 2, 9);
  b.ground(11, 22, 1).spikes(11, 22, 10).oneway(13, 14, 8).oneway(17, 18, 7).oneway(20, 21, 8).add('drone', 17, 3).add('shard', 17, 5);

  b.ground(23, 36, 3).add('megaphone', 28, 8).add('padlock', 33, 8);

  // dois holofotes alternados
  b.ground(37, 52, 2).add('checkpoint', 38, 9).searchlight(43, 1, 10, 3, 3).searchlight(48, 1, 10, 3, 3, 0.5).add('blot', 46, 9);

  // blocos sobre o abismo
  b.block(55, 8, 56, 8).block(59, 6, 60, 6).block(63, 5, 64, 5).block(67, 7, 68, 7).add('drone', 61, 1).add('shard', 63, 3);
  b.coins(55, 56, 7).coins(67, 68, 6);

  b.ground(70, 88, 2).add('checkpoint', 71, 9).add('drone', 78, 4).add('padlock', 84, 9);

  // vão de 8 blocos: pulo duplo + dash
  b.coinArc(89, 7, 8).hint(86, 5, 'Pulo duplo + dash para atravessar!');

  b.ground(97, 139, 2).add('checkpoint', 98, 9).add('crate', 102, 9).add('heart', 103, 9);
  b.oneway(106, 108, 7).add('shard', 107, 5);

  // Aurora presa; depois dela, a chaminé até o terraço da saída
  b.add('guardian', 115, 9).hint(112, 5, 'Golpeie o cristal para libertar a Aurora!');
  b.block(119, 3, 119, 7).block(122, 4, 139, 9).coins(120, 121, 4);
  b.hint(116, 1, 'PULO NA PAREDE: pule de uma parede para a outra!');
  b.add('exit', 132, 3);

  return b.build();
}

// Fase 3-4: palco do Holofote Frio.
export function level3_4() {
  const b = new LevelBuilder('3-4', 'Palco Principal', 3, 20);
  b.arena = 'w3_boss_arena';
  b.ground(0, 19, 2).add('player', 3, 9).add('boss', 15, 9);
  return b.build();
}
