import { LevelBuilder } from './LevelBuilder';

// Mundo 5 · Recife Turquesa. Tudo abaixo da linha 2 é água: Íris nada (cada pulo é uma braçada).
// Novidades: baiacus que incham, campos de ouriços, túneis de coral e correntezas.
// O disparo de prisma vem da Marina, no fim da 5-3.

// Fase 5-1: jardim de corais; apresenta o nado, os baiacus e as correntezas.
export function level5_1() {
  const b = new LevelBuilder('5-1', 'Jardim de Corais', 5, 128);
  b.water = 2;

  b.ground(0, 20, 2).add('player', 2, 9).coins(8, 14, 7);
  b.hint(5, 5, 'Debaixo d\'água, aperte PULAR para nadar para cima');

  // campo de ouriços: nade por cima
  b.ground(21, 40, 1).spikes(21, 40, 10).coinArc(24, 7, 6).add('puffer', 31, 6);
  b.hint(28, 4, 'Baiacus incham quando você chega perto: espere murchar!');

  b.ground(41, 58, 2).add('checkpoint', 42, 9).add('blot', 48, 9).add('puffer', 55, 6);
  b.block(50, 4, 52, 4).add('shard', 51, 3);

  // túnel de coral: teto baixo e ouriços embaixo
  b.ground(59, 80, 1).spikes(59, 80, 10).block(59, 0, 80, 4);
  b.add('puffer', 65, 7).add('puffer', 74, 8).add('shard', 70, 6).coins(61, 64, 7);

  // correnteza contra
  b.ground(81, 100, 2).add('checkpoint', 82, 9).wind(86, 2, 10, 8, -1, 160).add('padlock', 95, 9).add('shard', 98, 4);
  b.hint(85, 3, 'Correntezas empurram: nade firme!');

  b.ground(101, 127, 2).add('puffer', 108, 6).add('crate', 112, 9).add('heart', 113, 9).add('blot', 117, 9);
  b.add('exit', 123, 9);

  return b.build();
}

// Fase 5-2: galeria submersa; mais túneis e uma correnteza a favor.
export function level5_2() {
  const b = new LevelBuilder('5-2', 'Galeria Submersa', 5, 136);
  b.water = 2;

  b.ground(0, 12, 2).add('player', 2, 9);
  b.ground(13, 32, 1).spikes(13, 32, 10).block(22, 0, 23, 4).add('puffer', 18, 6).add('puffer', 27, 5).coins(15, 20, 8);

  b.ground(33, 50, 2).add('checkpoint', 34, 9).wind(38, 2, 12, 8, 1, 180).add('blot', 44, 9);
  b.block(46, 4, 48, 4).add('shard', 47, 3);

  b.ground(51, 70, 1).spikes(51, 70, 10).block(51, 0, 70, 4);
  b.add('puffer', 56, 7).add('puffer', 62, 6).add('puffer', 67, 8).add('shard', 62, 9).coins(53, 55, 8);

  b.ground(71, 90, 2).add('checkpoint', 72, 9).add('padlock', 78, 9).wind(82, 2, 8, 8, -1, 170).coins(83, 88, 6);

  b.ground(91, 110, 1).spikes(91, 110, 10).add('puffer', 97, 5).add('puffer', 104, 7).coinArc(93, 7, 8);

  b.ground(111, 135, 2).block(117, 5, 119, 5).add('shard', 118, 4).add('blot', 125, 9).add('exit', 131, 9);

  return b.build();
}

// Fase 5-3: a mais difícil do mundo; termina com a Marina presa no cristal.
export function level5_3() {
  const b = new LevelBuilder('5-3', 'Anfiteatro Afundado', 5, 136);
  b.water = 2;

  b.ground(0, 10, 2).add('player', 2, 9);
  b.ground(11, 30, 1).spikes(11, 30, 10).block(11, 0, 30, 3);
  b.add('puffer', 16, 6).add('puffer', 23, 8).add('puffer', 28, 5).add('shard', 20, 9);

  b.ground(31, 48, 2).add('checkpoint', 32, 9).wind(35, 2, 13, 8, -1, 190).add('crate', 39, 9).add('heart', 40, 9).add('padlock', 42, 9).add('blot', 46, 9);

  b.ground(49, 70, 1).spikes(49, 70, 10).add('puffer', 53, 5).add('puffer', 58, 8).add('puffer', 63, 4).add('puffer', 67, 7).add('shard', 60, 6);

  b.ground(71, 90, 2).add('checkpoint', 72, 9).block(78, 4, 80, 4).add('shard', 79, 3).add('megaphone', 85, 9).add('blot', 88, 9);

  b.ground(91, 104, 1).spikes(91, 104, 10).wind(91, 2, 14, 8, 1, 200).add('puffer', 97, 6);

  b.ground(105, 135, 2).add('checkpoint', 106, 9);
  b.add('guardian', 118, 9).hint(115, 5, 'Golpeie o cristal para libertar a Marina!');
  b.add('exit', 130, 9);

  return b.build();
}

// Fase 5-4: galeria do Kraken do Silêncio (submersa).
export function level5_4() {
  const b = new LevelBuilder('5-4', 'Galeria do Silêncio', 5, 20);
  b.arena = 'w5_boss_arena';
  b.water = 0;
  b.ground(0, 19, 2).add('player', 3, 9).add('boss', 15, 9);
  return b.build();
}
