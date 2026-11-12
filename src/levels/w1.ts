import { LevelBuilder } from './LevelBuilder';

// Fase 1-1: tutorial. Ensina andar, pular, pisar e golpear, uma ideia por trecho.
export function level1_1() {
  const b = new LevelBuilder('1-1', 'Vale do Coração', 1, 128);

  // Início tranquilo: só andar e pular o arco de faíscas
  b.ground(0, 16, 2).add('player', 2, 9).coinArc(7, 8, 5);
  b.hint(4, 5, '← →  andar').hint(12, 5, 'ESPAÇO  pular (segure para ir mais alto)');

  // Primeiro buraco (3 blocos) e primeiro inimigo
  b.ground(20, 34, 2).coins(21, 23, 9).add('blot', 29, 9);
  b.hint(25, 5, 'X  golpe de echarpe  ·  ou pule em cima');
  // primeira flor-ponte: restaurar o Desbotado ao lado faz a flor abrir e dá acesso às faíscas do alto
  b.bloom(31, 8, 2).coins(31, 32, 6).coins(31, 32, 5);
  b.hint(33, 3, 'Devolva a cor a um Desbotado: a flor desabrocha');

  // Escada de plataformas atravessáveis com o 1º fragmento no alto
  b.ground(35, 52, 2);
  b.oneway(37, 39, 8).oneway(41, 43, 6).oneway(45, 47, 4).add('shard', 46, 3);
  b.coins(38, 38, 7).coins(42, 42, 5);
  b.add('padlock', 50, 9).hint(49, 5, 'O Cadeado bloqueia golpes: pule em cima!');

  // Poço de espinhos com blocos para atravessar
  b.ground(53, 64, 1).spikes(53, 64, 10);
  b.block(56, 8, 57, 8).block(61, 8, 62, 8);
  b.coins(56, 57, 7).coins(61, 62, 7).add('moth', 59, 5);

  // Checkpoint, mola e plataforma alta com o 2º fragmento
  b.ground(65, 82, 2).add('checkpoint', 66, 9);
  b.add('spring', 72, 9).hint(70, 5, 'Mola!');
  b.block(74, 4, 79, 4).coins(74, 77, 3).add('shard', 79, 3);
  b.add('megaphone', 81, 9);

  // Degrau, caixas que escondem um coração, mais inimigos
  b.ground(83, 98, 3);
  b.add('crate', 87, 8).add('crate', 87, 7).add('heart', 89, 8);
  b.add('beetle', 94, 8).add('checkpoint', 97, 8);

  // Buraco com mariposa e subida final; 3º fragmento escondido no alto
  b.add('moth', 101, 6);
  b.ground(103, 127, 2);
  b.oneway(105, 106, 8).oneway(108, 109, 6).oneway(111, 112, 4).add('shard', 112, 3);
  b.coinArc(99, 7, 5);
  b.add('beetle', 116, 9);
  // plataformas desbotadas: só voltam se a fase recuperou cor; levam a um coração antes da saída
  b.fadeplat(114, 8, 2, 0.5).fadeplat(117, 6, 2, 0.5).add('heart', 117, 5).coins(118, 118, 5);
  b.hint(116, 3, 'Com mais cor na fase, mais caminhos voltam');
  b.add('exit', 122, 9);

  return b.build();
}

// Fase 1-2: apresenta as plataformas móveis e mistura os inimigos já conhecidos.
export function level1_2() {
  const b = new LevelBuilder('1-2', 'Trilha das Lanternas', 1, 140);

  b.ground(0, 12, 2).add('player', 2, 9).coins(5, 9, 9);
  b.ground(16, 27, 2).coinArc(13, 8, 3).add('beetle', 22, 9);
  b.bloom(24, 8, 2).coins(24, 25, 6).coins(24, 25, 5);

  // primeiro poço com plataforma móvel
  b.mover(29, 8, 5, 0, 3, 4).coins(31, 35, 6).hint(30, 4, 'Plataformas se movem: espere o momento certo');

  b.ground(38, 54, 2).add('checkpoint', 39, 9).add('blot', 44, 9);
  b.add('crate', 48, 9).add('heart', 50, 9).add('megaphone', 52, 9);

  // subida em degraus com o 1º fragmento
  b.ground(55, 62, 3).add('beetle', 59, 8);
  b.ground(63, 72, 4).oneway(65, 67, 5).add('shard', 66, 4).coins(68, 70, 7);

  // duas plataformas móveis em sequência, com uma mariposa no caminho
  // sincronizadas: quando a primeira chega ao fim, a segunda está no começo
  b.mover(74, 7, 3, 0, 2, 3).mover(80, 6, 3, 0, 3, 3, 0.5).add('moth', 80, 3).coins(77, 82, 5);

  // mola até o 2º fragmento
  b.ground(87, 104, 3).add('checkpoint', 88, 8).add('spring', 93, 8);
  b.block(95, 3, 99, 3).coins(96, 98, 2).add('shard', 99, 2);
  b.add('padlock', 97, 8).add('megaphone', 102, 8);
  b.fadeplat(101, 7, 2, 0.45).add('heart', 101, 6).coins(102, 102, 6);

  // reta final com escadinha e o 3º fragmento
  b.ground(105, 139, 2).add('beetle', 112, 9).add('blot', 120, 9);
  b.oneway(124, 125, 8).oneway(127, 128, 6).add('shard', 128, 5).coins(124, 125, 7);
  b.add('exit', 134, 9);

  return b.build();
}

// Fase 1-3: a mais difícil do mundo; termina com a Mãe Rubi presa num cristal cinza.
export function level1_3() {
  const b = new LevelBuilder('1-3', 'Ponte das Raízes', 1, 132);

  b.ground(0, 10, 2).add('player', 2, 9);

  // espinhos com plataformas atravessáveis
  b.ground(11, 19, 1).spikes(11, 19, 10);
  b.oneway(13, 14, 8).oneway(17, 18, 7).coins(13, 14, 7).coins(17, 18, 6).add('moth', 16, 4);

  b.ground(20, 31, 2).coinArc(22, 8, 5).add('beetle', 26, 9);

  // poço com plataforma móvel
  b.mover(33, 8, 6, 0, 2, 3.5);

  b.ground(42, 56, 3).add('checkpoint', 43, 8);
  b.add('crate', 48, 8).add('crate', 48, 7).add('heart', 50, 8).add('megaphone', 54, 8);

  // blocos flutuantes sobre o abismo, 1º fragmento no mais alto
  b.block(59, 7, 60, 7).block(63, 5, 64, 5).block(67, 7, 68, 7);
  b.coins(59, 60, 6).coins(67, 68, 6).add('shard', 64, 4).add('moth', 65, 2);

  b.ground(71, 86, 2).add('padlock', 76, 9).add('blot', 80, 9).add('beetle', 84, 9);
  // cofre de cor suspenso: a porta abre depois de 3 Desbotados restaurados na fase
  b.block(76, 6, 80, 6).block(76, 3, 79, 3).block(76, 4, 76, 5);
  b.colorgate(79, 4, 2, 3).chest(77, 5).coins(78, 78, 5);
  b.oneway(82, 83, 8);

  // espinhos com plataforma móvel; 2º fragmento flutua acima dela
  b.ground(87, 96, 1).spikes(87, 96, 10).mover(88, 8, 6, 0, 2, 4).add('shard', 91, 5);

  b.ground(97, 131, 2).add('checkpoint', 98, 9);
  b.oneway(101, 102, 8).oneway(104, 105, 6).oneway(107, 108, 4).add('shard', 108, 3).coins(104, 105, 5);
  b.add('beetle', 110, 9);

  // a guardiã presa bloqueia o caminho até a saída
  b.add('guardian', 116, 9).hint(114, 5, 'Golpeie o cristal para libertar a Mãe Rubi!');
  b.add('exit', 124, 9);

  return b.build();
}

// Fase 1-4: arena do Juiz de Pedra.
export function level1_4() {
  const b = new LevelBuilder('1-4', 'Tribunal de Pedra', 1, 20);
  b.arena = 'w1_boss_arena';
  b.ground(0, 19, 2).add('player', 3, 9).add('boss', 15, 9);
  return b.build();
}
