import { LevelBuilder, type LevelData } from './LevelBuilder';

// Sub-níveis secretos: cápsulas curtas (~46 blocos) com um mini-desafio cada.
// Entra-se por um portal escondido numa fase normal; ao chegar na saída volta-se ao portal.
// Todos têm um coração e muitas faíscas no fim. O validador (check-levels) também os confere.

export const SUB_NAMES = ['Chuva de Faíscas', 'Corredor de Espinhos', 'Salão das Surpresas', 'Cofre da Caixa'];
export const SUB_COUNT = SUB_NAMES.length;

const GROUND = 2; // chão de 2 blocos: quem está de pé fica na linha 9

/** Chuva de faíscas: saltos sobre pequenos abismos, com arcos de moedas e uma mola. */
function sparkRain(b: LevelBuilder) {
  b.ground(0, 5, GROUND).ground(9, 14, GROUND).ground(18, 23, GROUND).ground(27, 32, GROUND).ground(36, 47, GROUND);
  b.coinArc(6, 8, 5).coinArc(15, 8, 5).coinArc(24, 8, 5);
  b.add('spring', 20, 9);
  b.coins(19, 22, 3);
  b.coins(28, 31, 7);
  b.add('heart', 40, 8);
  b.coins(37, 45, 8);
  b.add('exit', 45, 9);
}

/** Corredor de espinhos: espinhos no chão, degraus finos por cima de um trecho longo. */
function spikeRun(b: LevelBuilder) {
  b.ground(0, 47, GROUND);
  b.spikes(6, 7, 9).spikes(11, 12, 9);
  b.spikes(16, 26, 9);
  b.oneway(16, 17, 8).oneway(19, 20, 7).oneway(22, 23, 8).oneway(25, 26, 7);
  b.coins(16, 17, 7).coins(19, 20, 6).coins(22, 23, 7).coins(25, 26, 6);
  b.add('heart', 20, 4);
  b.coins(33, 40, 8);
  b.add('exit', 45, 9);
}

/** Salão das surpresas: só blocos de bater com a cabeça (um deles guarda um coração). */
function bumpHall(b: LevelBuilder) {
  b.ground(0, 47, GROUND);
  [8, 11, 14].forEach((c) => b.bump(c, 6, 1));
  b.bump(19, 6, 0).bump(22, 6, 2).bump(25, 6, 1);
  b.bump(31, 6, 1).bump(34, 6, 1).bump(37, 6, 1);
  b.coins(8, 40, 9);
  b.add('exit', 45, 9);
}

/** Cofre da caixa: empurre a caixa até a placa para abrir o portão. */
function boxVault(b: LevelBuilder) {
  b.ground(0, 47, GROUND);
  b.pushbox(5, 9).pushbox(8, 9);
  b.plate(13, 9, 1);
  b.block(14, 9, 14, 9); // trava a caixa sobre a placa
  b.gate(20, 5, 5, 1);
  b.hint(4, 6, 'Empurre a caixa até a placa');
  b.coins(22, 30, 8);
  b.add('heart', 26, 8);
  b.coins(33, 40, 9);
  b.add('exit', 45, 9);
}

const BUILDERS = [sparkRain, spikeRun, bumpHall, boxVault];

export function buildSub(world: number, kind: number): LevelData {
  const k = ((kind % SUB_COUNT) + SUB_COUNT) % SUB_COUNT;
  const b = new LevelBuilder(`${world}-S${k}`, `✦ ${SUB_NAMES[k]}`, world, 48, 12);
  b.add('player', 2, 9);
  BUILDERS[k](b);
  return b.build();
}
